import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

const DEPARTMENTS_QUERY_KEY = ['departments'] as const;

const useDepartmentsQuery = (search: string = '') =>
  useQuery({
    queryKey: [...DEPARTMENTS_QUERY_KEY, search],
    queryFn: () => tertiaryEducationService.getDepartments(search),
  });

const useDepartmentsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...DEPARTMENTS_QUERY_KEY, search],
        queryFn: () => tertiaryEducationService.getDepartments(search),
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

export { useDepartmentsQuery, useDepartmentsSearch };
