import type {
  VacanciesApiResponse,
  VacancyQueryParams,
} from '@/views/vacancies/types';
import type { ScheduleVacancyPayload } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';
import { temporaryHttpClient } from '@cgp/data-access';

interface ScheduleVacancyRequest {
  schedule: ScheduleVacancyPayload;
}

interface CreateVacancyResponse {
  requestId: string;
  success: boolean;
  message: string;
}

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
  createVacancy: async (
    payload: ScheduleVacancyRequest
  ): Promise<CreateVacancyResponse> => {
    const response = await httpClient.post<CreateVacancyResponse>(
      '/vacancies',
      payload
    );
    return response.data;
  },
};
