import type {
  VacanciesApiResponse,
  VacancyQueryParams,
} from '@/views/vacancies/types';

import { temporaryHttpClient } from '@cgp/data-access';

export const vacancyService = {
  getVacancies: async (
    params: VacancyQueryParams
  ): Promise<VacanciesApiResponse> => {
    const response = await temporaryHttpClient.get<VacanciesApiResponse>(
      '/vacancies',
      {
        params,
      }
    );

    return response.data;
  },
};
