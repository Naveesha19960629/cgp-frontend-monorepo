import type {
  ApiResponse,
  CreatePendingItemResponse,
  SingleApiResponse,
  SocietyItem,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const societyService = {
  getSocieties: async (
    search: string,
    size = 50
  ): Promise<ApiResponse<SocietyItem[]>> => {
    const response = await httpClient.get<ApiResponse<SocietyItem[]>>(
      `/societies`,

      { params: { search, size } }
    );
    return response.data;
  },

  createSociety: async (label: string): Promise<CreatePendingItemResponse> => {
    const response = await httpClient.post<
      SingleApiResponse<CreatePendingItemResponse>
    >(`/societies`, {
      type: 'SOCIETY',
      displayValue: label,
      payload: {
        additionalProp1: 'string',
        additionalProp2: 'string',
        additionalProp3: 'string',
      },
    });
    return response.data.data;
  },
};
