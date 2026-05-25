import { useCallback } from 'react';

import { tertiaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const LEVEL_OF_QUALIFICATIONS_QUERY_KEY = ['level-of-qualifications'] as const;

const useLevelOfQualificationsQuery = (search: string = '') =>
  useQuery({
    queryKey: [...LEVEL_OF_QUALIFICATIONS_QUERY_KEY, search],
    queryFn: () => tertiaryEducationService.getLevelOfQualifications(search),
  });

const useLevelOfQualificationsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...LEVEL_OF_QUALIFICATIONS_QUERY_KEY, search],
        queryFn: () =>
          tertiaryEducationService.getLevelOfQualifications(search),
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

export { useLevelOfQualificationsQuery, useLevelOfQualificationsSearch };
