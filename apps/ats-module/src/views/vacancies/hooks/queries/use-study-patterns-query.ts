import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

const STUDY_PATTERNS_QUERY_KEY = ['study-patterns'] as const;

const useStudyPatternsQuery = () =>
  useQuery({
    queryKey: STUDY_PATTERNS_QUERY_KEY,
    queryFn: () => tertiaryEducationService.getStudyPatterns(),
  });

const useStudyPatternsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: STUDY_PATTERNS_QUERY_KEY,
        queryFn: () => tertiaryEducationService.getStudyPatterns(),
      });
      const normalizedSearch = search.trim().toLowerCase();
      return data.data.items.content
        .filter(
          item =>
            !normalizedSearch ||
            item.label.toLowerCase().includes(normalizedSearch)
        )
        .map(item => ({
          value: item.id,
          label: item.label,
          source: item.source,
        }));
    },
    [queryClient]
  );
};

export { useStudyPatternsQuery, useStudyPatternsSearch };
