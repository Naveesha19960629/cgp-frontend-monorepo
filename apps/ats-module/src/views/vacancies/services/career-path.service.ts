import type {
  ApiResponse,
  CareerPathItem,
  CreateCareerPathPayload,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const careerPathService = {
  getAllCareerPaths: async (
    search: string = '',
    disciplineId?: string
  ): Promise<ApiResponse<CareerPathItem[]>> => {
    const params: Record<string, string> = { search };
    if (disciplineId) {
      params.disciplineId = disciplineId;
    }
    const response = await httpClient.get<ApiResponse<CareerPathItem[]>>(
      '/career-paths',
      { params }
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

  addCareerPath: async ({
    displayValue,
    discipline,
  }: CreateCareerPathPayload): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/career-paths',
      {
        type: 'CAREER_PATH',
        displayValue,
        ...(discipline?.id
          ? {
              payload: {
                disciplineRefId: discipline.id,
                disciplineSource: discipline.source,
              },
            }
          : {}),
      }
    );
    return response.data;
  },
};
