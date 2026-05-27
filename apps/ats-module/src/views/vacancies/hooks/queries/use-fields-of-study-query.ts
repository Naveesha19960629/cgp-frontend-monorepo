import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { secondaryEducationService } from '@/views/vacancies/services';

const FIELDS_OF_STUDY_QUERY_KEY = ['field-of-studies'] as const;

const useFieldsOfStudyQuery = (search: string = '') =>
  useQuery({
    queryKey: [...FIELDS_OF_STUDY_QUERY_KEY, search],
    queryFn: () => secondaryEducationService.getFieldsOfStudy(search),
  });

const useFieldsOfStudySearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...FIELDS_OF_STUDY_QUERY_KEY, search],
        queryFn: () => secondaryEducationService.getFieldsOfStudy(search),
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

export { useFieldsOfStudyQuery, useFieldsOfStudySearch };
