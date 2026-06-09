import { httpClient } from '@cgp/data-access';

import type { ApiResponse, LocationOption } from '../types/organization';

export const locationService = {
  /**
   * Get locations with optional search filter
   */
  getLocations: async (search: string = ''): Promise<LocationOption[]> => {
    const response = await httpClient.get<ApiResponse<LocationOption[]>>(
      `/locations?search=${encodeURIComponent(search)}&size=50`
    );
    return response.data.data.items.content;
  },
};
