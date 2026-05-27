import type {
  CreatePendingItemResponse,
  PatentEntrySchemaType,
} from '@/views/vacancies/types';

async function resolveUserCreatedIndustries(
  patents: PatentEntrySchemaType[],
  createFn: (label: string) => Promise<CreatePendingItemResponse>
): Promise<PatentEntrySchemaType[]> {
  const allUserCreated = patents
    .flatMap(p => p.relatedIndustries)
    .filter(i => i.source === 'USER_CREATED');

  if (allUserCreated.length === 0) {
    return patents;
  }

  const results = await Promise.all(allUserCreated.map(i => createFn(i.label)));

  const resultMap = new Map(
    allUserCreated.map((i, idx) => [i.label, results[idx]])
  );

  return patents.map(patent => ({
    ...patent,
    relatedIndustries: patent.relatedIndustries.map(industry => {
      if (industry.source === 'USER_CREATED') {
        const result = resultMap.get(industry.label);
        if (result) {
          return {
            value: result.pendingId,
            label: result.value,
            source: result.status,
          };
        }
      }
      return industry;
    }),
  }));
}

export { resolveUserCreatedIndustries };
