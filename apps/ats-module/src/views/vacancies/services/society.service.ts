import type {
  ApiResponse,
  SingleApiResponse,
  SocietyCreateResponse,
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

  createSociety: async (label: string): Promise<SocietyCreateResponse> => {
    const response = await httpClient.post<
      SingleApiResponse<SocietyCreateResponse>
    >(`/societies`, { type: 'SOCIETY', displayValue: label });
    return response.data.data;
  },
};
