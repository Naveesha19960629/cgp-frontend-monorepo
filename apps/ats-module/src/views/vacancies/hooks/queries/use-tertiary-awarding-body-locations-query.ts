import { useCallback } from 'react';

import { tertiaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const TERTIARY_AWARDING_BODY_LOCATIONS_QUERY_KEY = [
  'tertiary-awarding-body-locations',
] as const;

const useTertiaryAwardingBodyLocationsQuery = (search: string = '') =>
  useQuery({
    queryKey: [...TERTIARY_AWARDING_BODY_LOCATIONS_QUERY_KEY, search],
    queryFn: () =>
      tertiaryEducationService.getTertiaryAwardingBodyLocations(search),
  });

const useTertiaryAwardingBodyLocationsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...TERTIARY_AWARDING_BODY_LOCATIONS_QUERY_KEY, search],
        queryFn: () =>
          tertiaryEducationService.getTertiaryAwardingBodyLocations(search),
      });
      return data.data.items.content.map(item => ({
        id: item.id,
        label: item.label,
      }));
    },
    [queryClient]
  );
};

export {
  useTertiaryAwardingBodyLocationsQuery,
  useTertiaryAwardingBodyLocationsSearch,
};
