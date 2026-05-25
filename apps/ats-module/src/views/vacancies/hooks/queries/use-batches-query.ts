import { useCallback } from 'react';

import { tertiaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const BATCHES_QUERY_KEY = ['batches'] as const;

const useBatchesQuery = (search: string = '') =>
  useQuery({
    queryKey: [...BATCHES_QUERY_KEY, search],
    queryFn: () => tertiaryEducationService.getBatches(search),
  });

const useBatchesSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...BATCHES_QUERY_KEY, search],
        queryFn: () => tertiaryEducationService.getBatches(search),
      });
      return data.data.items.content.map(item => ({
        id: item.id,
        label: item.label,
        source: item.source,
      }));
    },
    [queryClient]
  );
};

export { useBatchesQuery, useBatchesSearch };
