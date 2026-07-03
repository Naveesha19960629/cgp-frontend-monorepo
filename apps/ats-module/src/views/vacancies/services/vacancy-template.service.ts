import type { CreateVacancyTemplateRequest } from '@/views/vacancies/templates/vacancy-template-form';

import { httpClient } from '@cgp/data-access';

/** Envelope returned by the candidate-service (BaseResponse<T>). */
interface TemplateApiResponse<T> {
  requestId: string;
  success: boolean;
  message: string;
  data: T;
}

export interface NextTemplateName {
  templateName: string;
  refNumber?: string;
}

export interface CreatedVacancyTemplate {
  vacancyTemplateId: string;
  templateName: string;
  refNumber: string;
  createdAt?: string;
}

export const vacancyTemplateService = {
  getNextTemplateName: async (): Promise<
    TemplateApiResponse<NextTemplateName>
  > => {
    const response = await httpClient.get<
      TemplateApiResponse<NextTemplateName>
    >('/vacancy-templates/next-template-name');
    return response.data;
  },
  createTemplate: async (
    payload: CreateVacancyTemplateRequest
  ): Promise<TemplateApiResponse<CreatedVacancyTemplate>> => {
    const response = await httpClient.post<
      TemplateApiResponse<CreatedVacancyTemplate>
    >('/vacancy-templates', payload);
    return response.data;
  },
};
