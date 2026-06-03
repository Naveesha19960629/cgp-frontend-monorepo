import type { JobLevelItem, SingleApiResponse } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const jobLevelService = {
  getAllJobLevels: async (): Promise<SingleApiResponse<JobLevelItem[]>> => {
    const response =
      await httpClient.get<SingleApiResponse<JobLevelItem[]>>('/levels');
    return response.data;
  },
};
