import { useCallback } from 'react';

import { secondaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const EXAMINATIONS_QUERY_KEY = ['examinations'] as const;

const useExaminationsQuery = (search: string = '') =>
  useQuery({
    queryKey: [...EXAMINATIONS_QUERY_KEY, search],
    queryFn: () => secondaryEducationService.getExaminations(search),
  });

const useExaminationsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...EXAMINATIONS_QUERY_KEY, search],
        queryFn: () => secondaryEducationService.getExaminations(search),
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

export { useExaminationsQuery, useExaminationsSearch };
