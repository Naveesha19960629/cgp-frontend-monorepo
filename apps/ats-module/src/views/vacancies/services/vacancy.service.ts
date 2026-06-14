import type {
  ScheduleVacancyPayload,
  VacanciesApiResponse,
  VacancyQueryParams,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

interface ScheduleVacancyRequest {
  schedule: ScheduleVacancyPayload;
}

interface CreateVacancyResponse {
  requestId: string;
  success: boolean;
  message: string;
}

interface VacancyDetailResponse {
  requestId: string;
  success: boolean;
  message: string;
  data: {
    vacancy: Record<string, unknown>;
  };
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
  getVacancyById: async (id: string): Promise<VacancyDetailResponse> => {
    const response = await httpClient.get<VacancyDetailResponse>(
      `/v1/vacancies/${id}`
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
  updateVacancy: async (
    id: string,
    payload: ScheduleVacancyRequest
  ): Promise<CreateVacancyResponse> => {
    const response = await httpClient.put<CreateVacancyResponse>(
      `/vacancies/${id}`,
      payload
    );
    return response.data;
  },
};
