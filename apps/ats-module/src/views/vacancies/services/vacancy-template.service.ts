import type {
  CreateVacancyTemplateRequest,
  CreatedVacancyTemplate,
  NextTemplateName,
  SingleRecordApiResponse,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const vacancyTemplateService = {
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
};
