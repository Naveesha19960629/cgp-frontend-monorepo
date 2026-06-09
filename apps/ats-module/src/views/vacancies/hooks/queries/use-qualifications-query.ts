import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

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
        value: item.id,
        label: item.label,
        source: item.source,
      }));
    },
    [queryClient]
  );
};

export { useQualificationsQuery, useQualificationsSearch };
