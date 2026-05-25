import { useCallback } from 'react';

import { secondaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const SCHOOL_LOCATIONS_QUERY_KEY = ['school-locations'] as const;

const useSchoolLocationsQuery = (search: string = '') =>
  useQuery({
    queryKey: [...SCHOOL_LOCATIONS_QUERY_KEY, search],
    queryFn: () => secondaryEducationService.getSchoolLocations(search),
  });

const useSchoolLocationsSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...SCHOOL_LOCATIONS_QUERY_KEY, search],
        queryFn: () => secondaryEducationService.getSchoolLocations(search),
      });
      return data.data.items.content.map(item => ({
        id: item.id,
        label: item.label,
      }));
    },
    [queryClient]
  );
};

export { useSchoolLocationsQuery, useSchoolLocationsSearch };
