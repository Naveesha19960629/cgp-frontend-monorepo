import type { ScheduleVacancyPayload } from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

interface ScheduleVacancyRequest {
  schedule: ScheduleVacancyPayload;
}

interface CreateVacancyResponse {
  requestId: string;
  success: boolean;
  message: string;
}

export const vacancyService = {
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
