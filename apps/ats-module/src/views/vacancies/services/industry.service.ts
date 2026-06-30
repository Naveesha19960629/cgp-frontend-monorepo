import type {
  ApiResponse,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
  IndustryItem,
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

  createIndustry: async (label: string): Promise<CreatePendingItemResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      `/industries`,
      {
        type: 'INDUSTRY',
        displayValue: label,
        payload: {
          additionalProp1: 'string',
          additionalProp2: 'string',
          additionalProp3: 'string',
        },
      }
    );
    return response.data.data;
  },
};
