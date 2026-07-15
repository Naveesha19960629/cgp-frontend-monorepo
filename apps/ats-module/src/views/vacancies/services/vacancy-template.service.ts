import type {
  CreateVacancyTemplateRequest,
  CreatedVacancyTemplate,
  NextTemplateName,
  SingleRecordApiResponse,
  UpdateVacancyTemplateRequest,
  VacancyTemplateQueryParams,
  VacancyTemplateSearchPage,
  VacancyTemplateUseResponse,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const vacancyTemplateService = {
  searchTemplates: async (
    params: VacancyTemplateQueryParams
  ): Promise<SingleRecordApiResponse<VacancyTemplateSearchPage>> => {
    const response = await httpClient.get<
      SingleRecordApiResponse<VacancyTemplateSearchPage>
    >('/vacancy-templates', { params });
    return response.data;
  },
  getTemplateById: async (
    id: string
  ): Promise<SingleRecordApiResponse<VacancyTemplateUseResponse>> => {
    const response = await httpClient.get<
      SingleRecordApiResponse<VacancyTemplateUseResponse>
    >(`/vacancy-templates/${id}`);
    return response.data;
  },
  getNextTemplateName: async (): Promise<
    SingleRecordApiResponse<NextTemplateName>
  > => {
    const response = await httpClient.get<
      SingleRecordApiResponse<NextTemplateName>
    >('/vacancy-templates/next-template-name');
    return response.data;
  },
  createTemplate: async (
    payload: CreateVacancyTemplateRequest
  ): Promise<SingleRecordApiResponse<CreatedVacancyTemplate>> => {
    const response = await httpClient.post<
      SingleRecordApiResponse<CreatedVacancyTemplate>
    >('/vacancy-templates', payload);
    return response.data;
  },
  // NOTE: the backend PUT endpoint is not live yet (DQCGP-2199); this call will
  // 404 until it lands. The rest of the Edit Template flow is complete.
  updateTemplate: async (
    id: string,
    payload: UpdateVacancyTemplateRequest
  ): Promise<SingleRecordApiResponse<CreatedVacancyTemplate>> => {
    const response = await httpClient.put<
      SingleRecordApiResponse<CreatedVacancyTemplate>
    >(`/vacancy-templates/${id}`, payload);
    return response.data;
  },
  deleteTemplate: async (
    id: string
  ): Promise<SingleRecordApiResponse<string>> => {
    const response = await httpClient.delete<SingleRecordApiResponse<string>>(
      `/vacancy-templates/${id}`
    );
    return response.data;
  },
};
