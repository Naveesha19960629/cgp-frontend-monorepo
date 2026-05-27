import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { secondaryEducationService } from '@/views/vacancies/services';

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
