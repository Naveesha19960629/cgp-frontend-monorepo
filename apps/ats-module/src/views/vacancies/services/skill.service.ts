import type {
  ApiResponse,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
  SkillItem,
} from '@/views/vacancies/types';

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

  createSkillCareerPath: async (
    skillName: string,
    careerPathName: string
  ): Promise<CreatePendingItemResponse> => {
    const displayValue = `${skillName} - ${careerPathName}`;
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/skill-career-paths',
      {
        type: 'SKILL_CAREER_PATH',
        displayValue,
        payload: {
          skill: skillName,
          career_path: careerPathName,
        },
      }
    );
    return response.data.data;
  },
};
