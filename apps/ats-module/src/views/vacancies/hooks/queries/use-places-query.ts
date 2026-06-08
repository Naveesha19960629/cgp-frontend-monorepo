import { useQuery } from '@tanstack/react-query';

import { placesService } from '@/views/vacancies/services';

const usePlacesCityQuery = (input: string, enabled = true) => {
  return useQuery({
    queryKey: ['places', 'city', input],
    queryFn: () => placesService.getByCity(input),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

const usePlacesStateQuery = (input: string, enabled = true) => {
  return useQuery({
    queryKey: ['places', 'state', input],
    queryFn: () => placesService.getByState(input),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

const usePlacesCountryQuery = (input: string, enabled = true) => {
  return useQuery({
    queryKey: ['places', 'country', input],
    queryFn: () => placesService.getByCountry(input),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export { usePlacesCityQuery, usePlacesStateQuery, usePlacesCountryQuery };
