import type {
  ApiResponse,
  CreateVacancyPayload,
  SingleRecordApiResponse,
  VacanciesApiResponse,
  VacancyDetailData,
  VacancyFilterOptionsApiResponse,
  VacancyQueryParams,
  VacancyToggleAction,
  VacancyToggleActiveData,
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
    payload: CreateVacancyPayload
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
  duplicateVacancy: async (id: string): Promise<ApiResponse<string>> => {
    const response = await httpClient.post<ApiResponse<string>>(
      `/vacancies/${id}/duplicates`
    );
    return response.data;
  },
  toggleVacancyActiveStatus: async (
    id: string,
    action: VacancyToggleAction
  ): Promise<ApiResponse<VacancyToggleActiveData>> => {
    const response = await httpClient.patch<
      ApiResponse<VacancyToggleActiveData>
    >(`/vacancies/${id}/statuses`, { action });
    return response.data;
  },
  deleteVacancy: async (id: string): Promise<ApiResponse<string>> => {
    const response = await httpClient.delete<ApiResponse<string>>(
      `/vacancies/${id}`
    );
    return response.data;
  },
  getFilterOptions: async (
    search?: string
  ): Promise<VacancyFilterOptionsApiResponse> => {
    const response = await httpClient.get<VacancyFilterOptionsApiResponse>(
      '/vacancies/filters/options',
      { params: search ? { search } : undefined }
    );
    return response.data;
  },
};
