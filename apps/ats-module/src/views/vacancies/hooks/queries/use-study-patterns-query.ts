import { useCallback } from 'react';

import { tertiaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const STUDY_PATTERNS_QUERY_KEY = ['study-patterns'] as const;

const useStudyPatternsQuery = () =>
  useQuery({
    queryKey: STUDY_PATTERNS_QUERY_KEY,
    queryFn: () => tertiaryEducationService.getStudyPatterns(),
  });

const useStudyPatternsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (_search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: STUDY_PATTERNS_QUERY_KEY,
        queryFn: () => tertiaryEducationService.getStudyPatterns(),
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

export { useStudyPatternsQuery, useStudyPatternsSearch };
