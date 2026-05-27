import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { secondaryEducationService } from '@/views/vacancies/services';

const SECONDARY_AWARDING_BODIES_QUERY_KEY = [
  'secondary-awarding-bodies',
] as const;

const useSecondaryAwardingBodiesQuery = (search: string = '') =>
  useQuery({
    queryKey: [...SECONDARY_AWARDING_BODIES_QUERY_KEY, search],
    queryFn: () => secondaryEducationService.getAwardingBodies(search),
  });

const useAwardingBodiesSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...SECONDARY_AWARDING_BODIES_QUERY_KEY, search],
        queryFn: () => secondaryEducationService.getAwardingBodies(search),
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

export { useSecondaryAwardingBodiesQuery, useAwardingBodiesSearch };
