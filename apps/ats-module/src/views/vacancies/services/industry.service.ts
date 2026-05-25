import type { ApiResponse, IndustryItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const industryService = {
  getIndustries: async (
    search: string,
    size = 50
  ): Promise<ApiResponse<IndustryItem[]>> => {
    const response = await httpClient.get<ApiResponse<IndustryItem[]>>(
      `/industries`,
      { params: { search, size } }
    );
    return response.data;
  },
};
