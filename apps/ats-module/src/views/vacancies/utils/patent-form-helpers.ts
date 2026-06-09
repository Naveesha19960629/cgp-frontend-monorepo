import type {
  ApiResponse,
  CreatePendingItemResponse,
  IndustryItem,
  PatentEntrySchemaType,
} from '@/views/vacancies/types';

type ResolvedIndustry = {
  value: string;
  label: string;
  source: string;
};

function isAlreadyExistsError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const axiosErr = err as { response?: { data?: { code?: unknown } } };
  return axiosErr.response?.data?.code === 'MST-403';
}

async function resolveUserCreatedIndustries(
  patents: PatentEntrySchemaType[],
  createFn: (label: string) => Promise<CreatePendingItemResponse>,
  searchFn: (search: string) => Promise<ApiResponse<IndustryItem[]>>
): Promise<PatentEntrySchemaType[]> {
  const allUserCreated = patents
    .flatMap(p => p.relatedIndustries)
    .filter(i => i.source === 'USER_CREATED');

  if (allUserCreated.length === 0) {
    return patents;
  }

  const resolvedMap = new Map<string, ResolvedIndustry>();

  await Promise.all(
    allUserCreated.map(async industry => {
      try {
        const result = await createFn(industry.label);
        resolvedMap.set(industry.label, {
          value: result.pendingId,
          label: result.value,
          source: result.status,
        });
      } catch (err) {
        if (isAlreadyExistsError(err)) {
          const searchResult = await searchFn(industry.label);
          const existing = searchResult.data.items.content.find(
            item => item.label.toLowerCase() === industry.label.toLowerCase()
          );
          if (existing) {
            resolvedMap.set(industry.label, {
              value: existing.id,
              label: existing.label,
              source: existing.source,
            });
            return;
          }
        }
        throw err;
      }
    })
  );

  return patents.map(patent => ({
    ...patent,
    relatedIndustries: patent.relatedIndustries.map(industry => {
      if (industry.source === 'USER_CREATED') {
        const resolved = resolvedMap.get(industry.label);
        if (resolved) {
          return resolved;
        }
      }
      return industry;
    }),
  }));
}

export { resolveUserCreatedIndustries };
