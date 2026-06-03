import type { ApiResponse, WorkScheduleItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const workScheduleService = {
  getAllWorkSchedules: async (
    search: string = ''
  ): Promise<ApiResponse<WorkScheduleItem[]>> => {
    const response = await httpClient.get<ApiResponse<WorkScheduleItem[]>>(
      '/work-schedules',
      { params: { search, size: 50 } }
    );
    return response.data;
  },
};
