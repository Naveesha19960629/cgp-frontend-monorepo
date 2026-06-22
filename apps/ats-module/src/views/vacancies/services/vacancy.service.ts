import type {
  ApiResponse,
  CreateVacancyPayload,
  ScheduleVacancyPayload,
  SingleRecordApiResponse,
  VacanciesApiResponse,
  VacancyDetailData,
  VacancyQueryParams,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const vacancyService = {
  getVacancies: async (
    params: VacancyQueryParams
  ): Promise<VacanciesApiResponse> => {
    const response = await httpClient.get<VacanciesApiResponse>('/vacancies', {
      params,
    });
    return response.data;
  },
  getVacancyById: async (
    id: string
  ): Promise<SingleRecordApiResponse<VacancyDetailData>> => {
    const response = await httpClient.get<
      SingleRecordApiResponse<VacancyDetailData>
    >(`/vacancies/${id}`);
    return response.data;
  },
  createVacancy: async (
    payload: CreateVacancyPayload
  ): Promise<ApiResponse<string>> => {
    const response = await httpClient.post<ApiResponse<string>>(
      '/vacancies',
      payload
    );
    return response.data;
  },
  updateVacancy: async (
    id: string,
    payload: { schedule: ScheduleVacancyPayload }
  ): Promise<ApiResponse<string>> => {
    const response = await httpClient.put<ApiResponse<string>>(
      `/vacancies/${id}`,
      payload
    );
    return response.data;
  },
  updateDraftVacancy: async (
    id: string,
    payload: CreateVacancyPayload
  ): Promise<ApiResponse<string>> => {
    const response = await httpClient.put<ApiResponse<string>>(
      `/vacancies/${id}`,
      payload
    );
    return response.data;
  },
};
