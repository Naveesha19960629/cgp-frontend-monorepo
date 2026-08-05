import type {
  ApiResponse,
  NotifyApplicantsPayload,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const notificationService = {
  /**
   * Triggers the backend applicant-notification workflow after an Onhold
   * vacancy with applicants is rescheduled and its application form changed.
   * The backend owns email composition, sending, and the 3-day link expiry.
   */
  notifyApplicants: async (
    payload: NotifyApplicantsPayload
  ): Promise<ApiResponse<string>> => {
    const { vacancyId, ...body } = payload;
    const response = await httpClient.post<ApiResponse<string>>(
      `/vacancies/${vacancyId}/notify-applicants`,
      body
    );
    return response.data;
  },
};
