import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { tertiaryEducationService } from '@/views/vacancies/services';

const SPECIALIZATIONS_QUERY_KEY = ['specializations'] as const;

const useSpecializationsQuery = (search: string = '') =>
  useQuery({
    queryKey: [...SPECIALIZATIONS_QUERY_KEY, search],
    queryFn: () => tertiaryEducationService.getSpecializations(search),
  });

const useSpecializationsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...SPECIALIZATIONS_QUERY_KEY, search],
        queryFn: () => tertiaryEducationService.getSpecializations(search),
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

export { useSpecializationsQuery, useSpecializationsSearch };
