import { locationService } from '@/views/vacancies/services';
import type { LocationOption } from '@/views/vacancies/services';

import { useQuery } from '@cgp/data-access';

const LOCATIONS_STALE_TIME = 5 * 60 * 1000;
const LOCATIONS_GC_TIME = 10 * 60 * 1000;

export function useLocationsQuery(searchQuery: string, enabled = true) {
  const { data, isLoading, error } = useQuery<LocationOption[]>({
    queryKey: ['locations', searchQuery],
    queryFn: () => locationService.getLocations(searchQuery),
    enabled,
    staleTime: LOCATIONS_STALE_TIME,
    gcTime: LOCATIONS_GC_TIME,
  });

  return {
    data: data ?? [],
    isLoading,
    error,
  };
}
