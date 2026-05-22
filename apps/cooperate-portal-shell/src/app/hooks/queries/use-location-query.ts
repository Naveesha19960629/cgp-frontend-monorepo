import { useQuery } from '@tanstack/react-query';

import { locationService } from '../../services/location.service';

export const useLocationsQuery = (search: string, enabled = true) => {
  return useQuery({
    queryKey: ['locations', search],
    queryFn: () => locationService.getLocations(search),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
