import { useCallback } from 'react';

import { tertiaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const TERTIARY_AWARDING_BODIES_QUERY_KEY = [
  'tertiary-awarding-bodies',
] as const;

const useTertiaryAwardingBodiesQuery = (search: string = '') =>
  useQuery({
    queryKey: [...TERTIARY_AWARDING_BODIES_QUERY_KEY, search],
    queryFn: () => tertiaryEducationService.getTertiaryAwardingBodies(search),
  });

const useTertiaryAwardingBodiesSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...TERTIARY_AWARDING_BODIES_QUERY_KEY, search],
        queryFn: () =>
          tertiaryEducationService.getTertiaryAwardingBodies(search),
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

export { useTertiaryAwardingBodiesQuery, useTertiaryAwardingBodiesSearch };
