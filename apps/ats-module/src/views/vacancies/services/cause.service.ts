import type {
  ApiResponse,
  CauseItem,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
} from '@/views/vacancies/types';

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

  createCause: async (label: string): Promise<CreatePendingItemResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/causes',
      {
        type: 'CAUSE',
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
