import type { ApiResponse } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export interface LocationOption {
  id: string;
  label: string;
}

export const locationService = {
  getLocations: async (search: string = ''): Promise<LocationOption[]> => {
    const response = await httpClient.get<ApiResponse<LocationOption[]>>(
      `/locations?search=${encodeURIComponent(search)}&size=50`
    );
    return response.data.data.items.content;
  },
};
