import type {
  ApiResponse,
  CreateVacancyPayload,
  SingleRecordApiResponse,
  VacanciesApiResponse,
  VacancyDetailData,
  VacancyFilterOptionsApiResponse,
  VacancyQueryParams,
  VacancyTemplateUseResponse,
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
  /**
   * GET /vacancies/{id}/template-snapshots — the point-in-time copy of the
   * vacancy template as it was when this vacancy was created.
   *
   * Response shape is identical to GET /vacancy-templates/{id}, so the same
   * `toVacancyFormFromTemplateUsePayload` mapper consumes it. This is the
   * correct source for restoring section/field visibility on edit: the live
   * template may have been edited or deleted since, and AC 8 of DQCGP-2560
   * requires template changes to leave existing vacancies untouched.
   *
   * 404s when the vacancy was not created from a template (or predates
   * snapshotting) — callers fall back to the live template.
   */
  getVacancyTemplateSnapshot: async (
    id: string
  ): Promise<SingleRecordApiResponse<VacancyTemplateUseResponse>> => {
    const response = await httpClient.get<
      SingleRecordApiResponse<VacancyTemplateUseResponse>
    >(`/vacancies/${id}/template-snapshots`);
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
