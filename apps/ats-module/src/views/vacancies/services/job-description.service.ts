import type {
  SingleRecordApiResponse,
  UpdateVacancyJobDescriptionRequest,
  VacancyJobDescription,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const jobDescriptionService = {
  getVacancyJobDescription: async (
    vacancyId: string
  ): Promise<SingleRecordApiResponse<VacancyJobDescription>> => {
    const response = await httpClient.get<
      SingleRecordApiResponse<VacancyJobDescription>
    >(`/vacancies/${vacancyId}/job-descriptions`);
    return response.data;
  },
  updateVacancyJobDescription: async (
    vacancyId: string,
    payload: UpdateVacancyJobDescriptionRequest
  ): Promise<SingleRecordApiResponse<VacancyJobDescription>> => {
    const response = await httpClient.patch<
      SingleRecordApiResponse<VacancyJobDescription>
    >(`/vacancies/${vacancyId}/job-descriptions`, payload);
    return response.data;
  },
};
