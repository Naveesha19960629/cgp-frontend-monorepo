import type { ApiResponse, SportItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const sportService = {
  getSports: async (search: string, size = 50): Promise<SportItem[]> => {
    const response = await httpClient.get<ApiResponse<SportItem[]>>(`/sports`, {
      params: { search, size },
    });
    return response.data.data.items.content;
  },
};
