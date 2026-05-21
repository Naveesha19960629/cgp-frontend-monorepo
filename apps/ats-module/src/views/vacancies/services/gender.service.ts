import type { ApiResponse, GenderItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const genderService = {
  getGenders: async (): Promise<ApiResponse<GenderItem[]>> => {
    const response =
      await httpClient.get<ApiResponse<GenderItem[]>>('/genders');
    return response.data;
  },
};
