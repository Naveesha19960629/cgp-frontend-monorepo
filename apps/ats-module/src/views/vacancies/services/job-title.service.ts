import type {
  ApiResponse,
  CreatePendingApiResponse,
  JobTitleItem,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const jobTitleService = {
  getAllJobTitles: async (
    search: string = ''
  ): Promise<ApiResponse<JobTitleItem[]>> => {
    const response = await httpClient.get<ApiResponse<JobTitleItem[]>>(
      '/job-titles',
      { params: { search, size: 50 } }
    );
    return response.data;
  },

  addJobTitle: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/job-titles',
      { type: 'JOB_TITLE', displayValue }
    );
    return response.data;
  },
};
