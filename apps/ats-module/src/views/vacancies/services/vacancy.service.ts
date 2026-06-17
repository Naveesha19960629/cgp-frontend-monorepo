import type {
  CreateVacancyPayload,
  VacanciesApiResponse,
  VacancyQueryParams,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

interface CreateVacancyResponse {
  requestId: string;
  success: boolean;
  message: string;
}

interface VacancyDetailResponse {
  requestId: string;
  success: boolean;
  message: string;
  data: Record<string, unknown> & {
    vacancy?: Record<string, unknown>;
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
      `/vacancies/${id}`
    );
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
  updateVacancy: async (
    id: string,
    payload: CreateVacancyPayload
  ): Promise<CreateVacancyResponse> => {
    const response = await httpClient.put<CreateVacancyResponse>(
      `/vacancies/${id}`,
      payload
    );
    return response.data;
  },
};
