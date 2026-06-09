import type { ApiResponse, EngagementModelItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const engagementModelService = {
  getAllEngagementModels: async (
    search: string = ''
  ): Promise<ApiResponse<EngagementModelItem[]>> => {
    const response = await httpClient.get<ApiResponse<EngagementModelItem[]>>(
      '/engagement-models',
      { params: { search, size: 50 } }
    );
    return response.data;
  },
};
