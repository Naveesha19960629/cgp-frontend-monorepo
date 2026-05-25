import { useCallback } from 'react';

import { tertiaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const STUDY_MODES_QUERY_KEY = ['study-modes'] as const;

const useStudyModesQuery = () =>
  useQuery({
    queryKey: STUDY_MODES_QUERY_KEY,
    queryFn: () => tertiaryEducationService.getStudyModes(),
  });

const useStudyModesSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (_search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: STUDY_MODES_QUERY_KEY,
        queryFn: () => tertiaryEducationService.getStudyModes(),
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

export { useStudyModesQuery, useStudyModesSearch };
