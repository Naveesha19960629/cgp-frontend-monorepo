import backendAxios from '../libs/backend-axios';
import type {
  ApiResponse,
  BackendApiResponse,
  MasterDataPendingResponse,
  OrganizationSelectOptions,
} from '../types/organization';

export const organizationService = {
  /**
   * Get all organizations with optional search filter
   */
  getAllOrganizations: async (
    search: string = ''
  ): Promise<OrganizationSelectOptions[]> => {
    const response = await backendAxios.get<
      ApiResponse<OrganizationSelectOptions[]>
    >(`/organizations?search=${encodeURIComponent(search)}&size=50`);
    return response.data.data.items.content;
  },

  /**
   * Create a new organization in master data
   */
  createMasterDataOrganization: async (data: {
    type: string;
    displayValue: string;
    payload?: { name?: string; url?: string; location?: { id: string } };
  }): Promise<BackendApiResponse<MasterDataPendingResponse>> => {
    const response = await backendAxios.post<
      BackendApiResponse<MasterDataPendingResponse>
    >('/organizations', data);
    return response.data;
  },
};
