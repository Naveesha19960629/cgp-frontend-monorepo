import type { ApiResponse, DisciplineItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const disciplineService = {
  getAllDisciplines: async (
    search: string = ''
  ): Promise<ApiResponse<DisciplineItem[]>> => {
    const response = await httpClient.get<ApiResponse<DisciplineItem[]>>(
      '/disciplines',
      { params: { search } }
    );
    return response.data;
  },
};
