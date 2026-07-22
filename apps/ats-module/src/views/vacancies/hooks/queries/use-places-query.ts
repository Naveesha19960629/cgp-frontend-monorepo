import { useQuery } from '@tanstack/react-query';

import { placesService } from '@/views/vacancies/services';

const PLACES_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const PLACES_GC_TIME = 10 * 60 * 1000; // 10 minutes

const usePlacesCityQuery = (input: string, enabled = true) => {
  return useQuery({
    queryKey: ['places', 'city', input],
    queryFn: () => placesService.getByCity(input),
    enabled,
    staleTime: PLACES_STALE_TIME,
    gcTime: PLACES_GC_TIME,
  });
};

const usePlacesStateQuery = (input: string, enabled = true) => {
  return useQuery({
    queryKey: ['places', 'state', input],
    queryFn: () => placesService.getByState(input),
    enabled,
    staleTime: PLACES_STALE_TIME,
    gcTime: PLACES_GC_TIME,
  });
};

const usePlacesCountryQuery = (input: string, enabled = true) => {
  return useQuery({
    queryKey: ['places', 'country', input],
    queryFn: () => placesService.getByCountry(input),
    enabled,
    staleTime: PLACES_STALE_TIME,
    gcTime: PLACES_GC_TIME,
  });
};

export {
  PLACES_STALE_TIME,
  PLACES_GC_TIME,
  usePlacesCityQuery,
  usePlacesStateQuery,
  usePlacesCountryQuery,
};
