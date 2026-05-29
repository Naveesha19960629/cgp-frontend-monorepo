import type {
  ApiResponse,
  CreatePendingItemResponse,
} from '@/views/vacancies/types';

function isAlreadyExistsError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const axiosErr = err as { response?: { data?: { code?: unknown } } };
  return axiosErr.response?.data?.code === 'MST-403';
}

interface EntryWithSource {
  id: string;
  label: string;
  source?: string;
}

/**
 * Resolves user-created entries by POSTing them to the API.
 * If the entry already exists (MST-403), searches for the existing item.
 * Returns the list with user-created entries replaced by resolved ones.
 */
async function resolveUserCreatedEntries<
  T extends { id: string; label: string },
>(
  entries: EntryWithSource[],
  createFn: (label: string) => Promise<CreatePendingItemResponse>,
  searchFn: (search: string) => Promise<ApiResponse<T[]>>
): Promise<EntryWithSource[]> {
  const userCreated = entries.filter(e => e.source === 'USER_CREATED');

  if (userCreated.length === 0) {
    return entries;
  }

  const resolvedMap = new Map<string, EntryWithSource>();

  await Promise.all(
    userCreated.map(async entry => {
      try {
        const result = await createFn(entry.label);
        resolvedMap.set(entry.label, {
          id: result.pendingId,
          label: result.value,
          source: result.status,
        });
      } catch (err) {
        if (isAlreadyExistsError(err)) {
          const searchResult = await searchFn(entry.label);
          const existing = searchResult.data.items.content.find(
            item => item.label.toLowerCase() === entry.label.toLowerCase()
          );
          if (existing) {
            resolvedMap.set(entry.label, {
              id: existing.id,
              label: existing.label,
              source: 'MASTER',
            });
            return;
          }
        }
        throw err;
      }
    })
  );

  return entries.map(entry => {
    if (entry.source === 'USER_CREATED') {
      const resolved = resolvedMap.get(entry.label);
      if (resolved) return resolved;
    }
    return entry;
  });
}

export { resolveUserCreatedEntries };
