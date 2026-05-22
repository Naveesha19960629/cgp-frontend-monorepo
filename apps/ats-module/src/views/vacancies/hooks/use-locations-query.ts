import { locationService } from '@/views/vacancies/services';
import type { LocationOption } from '@/views/vacancies/services';

import { useQuery } from '@cgp/data-access';

export function useLocationsQuery(searchQuery: string, enabled = true) {
  const { data, isLoading, error } = useQuery<LocationOption[]>({
    queryKey: ['locations', searchQuery],
    queryFn: () => locationService.getLocations(searchQuery),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: data ?? [],
    isLoading,
    error,
  };
}
