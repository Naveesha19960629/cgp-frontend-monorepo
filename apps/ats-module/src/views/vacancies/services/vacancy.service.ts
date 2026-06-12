import type {
  VacanciesApiResponse,
  VacancyQueryParams,
} from '@/views/vacancies/types';
import type { CreateVacancyPayload } from '@/views/vacancies/utils';

import { httpClient } from '@cgp/data-access';

interface CreateVacancyResponse {
  requestId: string;
  success: boolean;
  message: string;
}

export const vacancyService = {
  getVacancies: async (
    params: VacancyQueryParams
  ): Promise<VacanciesApiResponse> => {
    const response = await httpClient.get<VacanciesApiResponse>('/vacancies', {
      params,
    });
    return response.data;
  },
  createVacancy: async (
    payload: CreateVacancyPayload
  ): Promise<CreateVacancyResponse> => {
    const response = await httpClient.post<CreateVacancyResponse>(
      '/vacancies',
      payload
    );
    return response.data;
  },
};
