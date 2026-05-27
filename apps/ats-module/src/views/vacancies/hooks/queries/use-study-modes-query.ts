import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

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
