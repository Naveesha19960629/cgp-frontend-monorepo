import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

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
        value: item.id,
        label: item.label,
        source: item.source,
      }));
    },
    [queryClient]
  );
};

export { useBatchesQuery, useBatchesSearch };
