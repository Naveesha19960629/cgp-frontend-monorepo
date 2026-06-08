import type {
  PlaceCityResult,
  PlaceCountryResult,
  PlaceStateResult,
  PlacesApiResponse,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const placesService = {
  getByCity: async (input: string): Promise<PlaceCityResult[]> => {
    const params = new URLSearchParams({ type: 'CITY' });
    if (input.trim()) params.set('input', input);
    const response = await httpClient.get<PlacesApiResponse<PlaceCityResult>>(
      `/places?${params}`
    );
    return response.data.data;
  },

  getByState: async (input: string): Promise<PlaceStateResult[]> => {
    const params = new URLSearchParams({ type: 'STATE' });
    if (input.trim()) params.set('input', input);
    const response = await httpClient.get<PlacesApiResponse<PlaceStateResult>>(
      `/places?${params}`
    );
    return response.data.data;
  },

  getByCountry: async (input: string): Promise<PlaceCountryResult[]> => {
    const params = new URLSearchParams({ type: 'COUNTRY' });
    if (input.trim()) params.set('input', input);
    const response = await httpClient.get<
      PlacesApiResponse<PlaceCountryResult>
    >(`/places?${params}`);
    return response.data.data;
  },
};
