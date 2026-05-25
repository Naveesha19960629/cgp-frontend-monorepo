import type { ApiResponse, CareerPathItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const careerPathService = {
  getAllCareerPaths: async (
    search: string = ''
  ): Promise<ApiResponse<CareerPathItem[]>> => {
    const response = await httpClient.get<ApiResponse<CareerPathItem[]>>(
      '/career-paths',
      { params: { search } }
    );
    return response.data;
  },
};
