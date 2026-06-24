import type { ApiResponse, MaritalStatusItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const maritalStatusService = {
  getMaritalStatuses: async (): Promise<ApiResponse<MaritalStatusItem[]>> => {
    const response = await httpClient.get<ApiResponse<MaritalStatusItem[]>>(
      '/marital-statuses?context=VACANCY'
    );
    return response.data;
  },
};
