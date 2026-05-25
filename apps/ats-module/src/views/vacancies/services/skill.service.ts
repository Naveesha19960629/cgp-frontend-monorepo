import type { ApiResponse, SkillItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const skillService = {
  getAllSkills: async (
    search: string = ''
  ): Promise<ApiResponse<SkillItem[]>> => {
    const response = await httpClient.get<ApiResponse<SkillItem[]>>(
      '/skill-career-paths',
      { params: { search } }
    );
    return response.data;
  },
};
