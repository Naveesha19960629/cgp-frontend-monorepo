import { useCallback } from 'react';

import { tertiaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const FACULTIES_QUERY_KEY = ['faculties'] as const;

const useFacultiesQuery = (search: string = '') =>
  useQuery({
    queryKey: [...FACULTIES_QUERY_KEY, search],
    queryFn: () => tertiaryEducationService.getFaculties(search),
  });

const useFacultiesSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...FACULTIES_QUERY_KEY, search],
        queryFn: () => tertiaryEducationService.getFaculties(search),
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

export { useFacultiesQuery, useFacultiesSearch };
