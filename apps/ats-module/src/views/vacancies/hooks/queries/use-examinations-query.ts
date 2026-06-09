import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { secondaryEducationService } from '@/views/vacancies/services';

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
        value: item.id,
        label: item.label,
        source: item.source,
      }));
    },
    [queryClient]
  );
};

export { useExaminationsQuery, useExaminationsSearch };
