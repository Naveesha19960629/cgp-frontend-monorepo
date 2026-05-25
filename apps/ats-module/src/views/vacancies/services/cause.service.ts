import type { ApiResponse, CauseItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const causeService = {
  getAllCauses: async (
    search: string = ''
  ): Promise<ApiResponse<CauseItem[]>> => {
    const response = await httpClient.get<ApiResponse<CauseItem[]>>('/causes', {
      params: { search, limit: 20 },
    });
    return response.data;
  },
};
