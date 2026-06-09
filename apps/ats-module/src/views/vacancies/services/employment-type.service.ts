import type { ApiResponse, EmploymentTypeItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const employmentTypeService = {
  getAllEmploymentTypes: async (
    search: string = ''
  ): Promise<ApiResponse<EmploymentTypeItem[]>> => {
    const response = await httpClient.get<ApiResponse<EmploymentTypeItem[]>>(
      '/employment-types',
      { params: { search, size: 50 } }
    );
    return response.data;
  },
};
