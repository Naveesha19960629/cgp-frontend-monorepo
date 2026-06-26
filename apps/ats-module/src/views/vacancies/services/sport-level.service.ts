import type { ApiResponse, JobLevelItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const sportLevelService = {
  getAllSportLevels: async (): Promise<JobLevelItem[]> => {
    const response =
      await httpClient.get<ApiResponse<JobLevelItem[]>>('/sport-levels');
    return response.data.data.items.content;
  },
};
