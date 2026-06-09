import { useQuery } from '@tanstack/react-query';

import { locationService } from '../../services/location.service';

const LOCATIONS_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const LOCATIONS_GC_TIME = 10 * 60 * 1000; // 10 minutes

export const useLocationsQuery = (search: string, enabled = true) => {
  return useQuery({
    queryKey: ['locations', search],
    queryFn: () => locationService.getLocations(search),
    enabled,
    staleTime: LOCATIONS_STALE_TIME,
    gcTime: LOCATIONS_GC_TIME,
  });
};
