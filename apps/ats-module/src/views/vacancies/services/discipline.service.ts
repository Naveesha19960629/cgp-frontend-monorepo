import type {
  ApiResponse,
  CreatePendingApiResponse,
  DisciplineItem,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const disciplineService = {
  getAllDisciplines: async (
    search: string = ''
  ): Promise<ApiResponse<DisciplineItem[]>> => {
    const response = await httpClient.get<ApiResponse<DisciplineItem[]>>(
      '/disciplines',
      { params: { search, size: 50 } }
    );
    return response.data;
  },

  addDiscipline: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/disciplines',
      { type: 'DISCIPLINE', displayValue }
    );
    return response.data;
  },
};
