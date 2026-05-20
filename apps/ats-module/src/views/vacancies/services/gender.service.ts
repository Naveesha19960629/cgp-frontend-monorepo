import type { GendersResponse } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export async function fetchGenders(): Promise<GendersResponse> {
  const response = await httpClient.get<GendersResponse>('/genders');
  return response.data;
}
