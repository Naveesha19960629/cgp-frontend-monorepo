import type {
  CreateVacancyTemplateRequest,
  CreatedVacancyTemplate,
  NextTemplateName,
  SaveVacancyAsTemplatePayload,
  SingleRecordApiResponse,
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
  saveVacancyAsTemplate: async (
    payload: SaveVacancyAsTemplatePayload
  ): Promise<SingleRecordApiResponse<string>> => {
    const { vacancyId, templateName } = payload;
    const response = await httpClient.post<SingleRecordApiResponse<string>>(
      `/vacancies/${vacancyId}/templates`,
      { templateName }
    );
    return response.data;
  },
};
