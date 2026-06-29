import type {
  JobLevelItem,
  SingleRecordApiResponse,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const jobLevelService = {
  getAllJobLevels: async (): Promise<
    SingleRecordApiResponse<JobLevelItem[]>
  > => {
    const response =
      await httpClient.get<SingleRecordApiResponse<JobLevelItem[]>>('/levels');
    return response.data;
  },
};
