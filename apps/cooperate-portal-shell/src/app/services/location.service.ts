import backendAxios from '../libs/backend-axios';
import type { ApiResponse, LocationOption } from '../types/organization';

export const locationService = {
  /**
   * Get locations with optional search filter
   */
  getLocations: async (search: string = ''): Promise<LocationOption[]> => {
    const response = await backendAxios.get<ApiResponse<LocationOption[]>>(
      `/locations?search=${encodeURIComponent(search)}&size=50`
    );
    return response.data.data.items.content;
  },
};
