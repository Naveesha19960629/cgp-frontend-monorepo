import type {
  ApiResponse,
  CareerPathItem,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
} from '@/views/vacancies/types';

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

  createCareerPath: async (
    label: string
  ): Promise<CreatePendingItemResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/career-paths',
      { type: 'CAREER_PATH', displayValue: label }
    );
    return response.data.data;
  },
};
