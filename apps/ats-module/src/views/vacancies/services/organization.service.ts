import type { ApiResponse } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export interface OrganizationOption {
  id: string;
  name?: string;
  label?: string;
  location?: string;
  organizationWebSite?: string;
  source?: 'MASTER' | 'PENDING' | 'USER_CREATED';
}

interface CreateOrganizationResponse {
  message: string[];
  statusCode: number;
  data: {
    id?: string;
    pendingId: string;
    displayValue?: string;
  };
}

export const organizationService = {
  getAllOrganizations: async (
    search: string = ''
  ): Promise<OrganizationOption[]> => {
    const response = await httpClient.get<ApiResponse<OrganizationOption[]>>(
      '/organizations',
      {
        params: {
          search,
          size: 50,
        },
      }
    );

    return response.data.data.items.content;
  },

  createMasterDataOrganization: async (data: {
    type: string;
    displayValue: string;
    payload?: { name?: string; url?: string; location?: { id: string } };
  }): Promise<CreateOrganizationResponse> => {
    const requestBody = {
      type: 'ORGANIZATION',
      displayValue: data.displayValue,
      payload: data.payload ?? {},
    };

    const response = await httpClient.post<CreateOrganizationResponse>(
      '/organizations',
      requestBody
    );
    return response.data;
  },
};
