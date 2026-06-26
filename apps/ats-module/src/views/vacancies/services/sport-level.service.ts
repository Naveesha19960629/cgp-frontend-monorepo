import type {
  ApiResponse,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
  JobLevelItem,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const sportLevelService = {
  getAllSportLevels: async (): Promise<JobLevelItem[]> => {
    const response =
      await httpClient.get<ApiResponse<JobLevelItem[]>>('/sport-levels');
    return response.data.data.items.content;
  },

  createSportLevel: async (
    label: string
  ): Promise<CreatePendingItemResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/sport-levels',
      {
        type: 'SPORT_LEVEL',
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
