import type {
  ApiResponse,
  IndustryCreateResponse,
  IndustryItem,
  SingleApiResponse,
} from '@/views/vacancies/types';

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

  createIndustry: async (label: string): Promise<IndustryCreateResponse> => {
    const response = await httpClient.post<
      SingleApiResponse<IndustryCreateResponse>
    >(`/industries`, { type: 'INDUSTRY', displayValue: label });
    return response.data.data;
  },
};
