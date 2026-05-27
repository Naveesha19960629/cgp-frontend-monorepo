import type { ApiResponse, HobbyItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const hobbyService = {
  getAllHobbies: async (
    search: string = ''
  ): Promise<ApiResponse<HobbyItem[]>> => {
    const response = await httpClient.get<ApiResponse<HobbyItem[]>>(
      '/hobbies',
      {
        params: { search, limit: 20 },
      }
    );
    return response.data;
  },
};
