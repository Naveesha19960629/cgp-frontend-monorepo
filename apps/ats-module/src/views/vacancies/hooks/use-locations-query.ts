import { useQuery } from '@cgp/data-access';

export interface LocationOption {
  id: string;
  label: string;
}

export function useLocationsQuery(searchQuery: string) {
  const { data, isLoading, error } = useQuery<LocationOption[]>({
    queryKey: ['locations', searchQuery],
    queryFn: async () => {
      // Mock data - replace with actual API call
      const mockLocations: LocationOption[] = [
        { id: '1', label: 'United States' },
        { id: '2', label: 'United Kingdom' },
        { id: '3', label: 'Canada' },
        { id: '4', label: 'Australia' },
        { id: '5', label: 'Germany' },
        { id: '6', label: 'France' },
        { id: '7', label: 'India' },
        { id: '8', label: 'China' },
        { id: '9', label: 'Japan' },
        { id: '10', label: 'Brazil' },
      ];

      if (!searchQuery.trim()) {
        return mockLocations;
      }

      const query = searchQuery.toLowerCase();
      return mockLocations.filter(loc =>
        loc.label.toLowerCase().includes(query)
      );
    },
    enabled: true,
  });

  return {
    data: data ?? [],
    isLoading,
    error,
  };
}
