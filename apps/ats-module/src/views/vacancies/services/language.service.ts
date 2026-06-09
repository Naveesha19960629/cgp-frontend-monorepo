import type {
  ApiResponse,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
  LanguageItem,
} from '@/views/vacancies/types';

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

  createLanguage: async (label: string): Promise<CreatePendingItemResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/languages',
      { type: 'LANGUAGE', displayValue: label }
    );
    return response.data.data;
  },
};
