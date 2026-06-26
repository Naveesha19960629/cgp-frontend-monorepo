import type {
  ApiResponse,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
  SportItem,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const sportService = {
  getSports: async (search: string, size = 50): Promise<SportItem[]> => {
    const response = await httpClient.get<ApiResponse<SportItem[]>>(`/sports`, {
      params: { search, size },
    });
    return response.data.data.items.content;
  },

  createSport: async (label: string): Promise<CreatePendingItemResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      `/sports`,
      { type: 'SPORT', displayValue: label }
    );
    return response.data.data;
  },
};
