import type {
  ApiResponse,
  CreatePendingApiResponse,
  CreateRolePayload,
  RoleItem,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const roleService = {
  getAllRoles: async (
    search: string = '',
    careerPathId?: string,
    levelId?: string
  ): Promise<ApiResponse<RoleItem[]>> => {
    const params: Record<string, string | number> = { search, size: 50 };
    if (careerPathId) {
      params.careerPathId = careerPathId;
    }
    if (levelId) {
      params.levelId = levelId;
    }
    const response = await httpClient.get<ApiResponse<RoleItem[]>>(
      '/job-roles',
      { params }
    );
    return response.data;
  },

  addRole: async ({
    displayValue,
    careerPath,
    level,
  }: CreateRolePayload): Promise<CreatePendingApiResponse> => {
    const payload: Record<string, string> = {};
    if (careerPath?.id) {
      payload.careerPathRefId = careerPath.id;
      payload.careerPathSource = careerPath.source;
    }
    if (level?.id) {
      payload.levelRefId = level.id;
    }

    const response = await httpClient.post<CreatePendingApiResponse>(
      '/job-roles',
      {
        type: 'JOB_ROLE',
        displayValue,
        ...(Object.keys(payload).length > 0 ? { payload } : {}),
      }
    );
    return response.data;
  },
};
