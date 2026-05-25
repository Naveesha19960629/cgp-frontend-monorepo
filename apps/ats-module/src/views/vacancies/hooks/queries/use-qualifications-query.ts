import { useCallback } from 'react';

import { tertiaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const QUALIFICATIONS_QUERY_KEY = ['qualifications'] as const;

const useQualificationsQuery = (search: string = '') =>
  useQuery({
    queryKey: [...QUALIFICATIONS_QUERY_KEY, search],
    queryFn: () => tertiaryEducationService.getQualifications(search),
  });

const useQualificationsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...QUALIFICATIONS_QUERY_KEY, search],
        queryFn: () => tertiaryEducationService.getQualifications(search),
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

export { useQualificationsQuery, useQualificationsSearch };
