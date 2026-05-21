import type { ApiResponse, GenderItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

// export async function fetchGenders(): Promise<GendersResponse> {
//   const response = await httpClient.get<GendersResponse>('/genders');
//   return response.data;
// }

export const genderService = {
  getGenders: async (): Promise<ApiResponse<GenderItem[]>> => {
    const response =
      await httpClient.get<ApiResponse<GenderItem[]>>('/genders');
    return response.data;
  },
};
