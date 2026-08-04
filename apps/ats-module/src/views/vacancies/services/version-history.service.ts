import type {
  SingleRecordApiResponse,
  VacancyVersionHistoryData,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const versionHistoryService = {
  getVacancyVersionHistory: async (
    vacancyId: string
  ): Promise<SingleRecordApiResponse<VacancyVersionHistoryData>> => {
    const response = await httpClient.get<
      SingleRecordApiResponse<VacancyVersionHistoryData>
    >(`/vacancies/${vacancyId}/version-histories`);
    return response.data;
  },
};
