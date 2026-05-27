import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { secondaryEducationService } from '@/views/vacancies/services';

const SCHOOLS_QUERY_KEY = ['schools'] as const;

const useSchoolsQuery = (search: string = '') =>
  useQuery({
    queryKey: [...SCHOOLS_QUERY_KEY, search],
    queryFn: () => secondaryEducationService.getSchools(search),
  });

const useSchoolsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...SCHOOLS_QUERY_KEY, search],
        queryFn: () => secondaryEducationService.getSchools(search),
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

export { useSchoolsQuery, useSchoolsSearch };
