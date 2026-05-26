import type { ApiResponse, LanguageItem } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const languageService = {
  getAllLanguages: async (
    search: string = ''
  ): Promise<ApiResponse<LanguageItem[]>> => {
    const response = await httpClient.get<ApiResponse<LanguageItem[]>>(
      '/languages',
      { params: { search } }
    );
    return response.data;
  },
};
