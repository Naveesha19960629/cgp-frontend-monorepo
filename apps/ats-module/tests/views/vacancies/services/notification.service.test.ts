import { describe, expect, it, vi } from 'vitest';

import { notificationService } from '@/views/vacancies/services/notification.service';
import type { NotifyApplicantsPayload } from '@/views/vacancies/types';

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    post: mockPost,
  },
}));

const payload: NotifyApplicantsPayload = {
  vacancyId: 'vacancy-1',
  changedSections: ['preferredSkills'],
  changedFields: ['preferredSkills.skills[0].skillName'],
  publishDateTime: '2099-12-25T10:00:00 AM',
};

describe('notificationService.notifyApplicants', () => {
  it('POSTs to the vacancy notify-applicants endpoint with the changed-fields body', async () => {
    mockPost.mockResolvedValueOnce({
      data: { requestId: 'req-1', success: true, message: 'ok', data: 'ok' },
    });

    const result = await notificationService.notifyApplicants(payload);

    expect(mockPost).toHaveBeenCalledWith(
      '/vacancies/vacancy-1/notify-applicants',
      {
        changedSections: ['preferredSkills'],
        changedFields: ['preferredSkills.skills[0].skillName'],
        publishDateTime: '2099-12-25T10:00:00 AM',
      }
    );
    expect(result.success).toBe(true);
  });

  it('propagates rejection when the request fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network Error'));

    await expect(notificationService.notifyApplicants(payload)).rejects.toThrow(
      'Network Error'
    );
  });
});
