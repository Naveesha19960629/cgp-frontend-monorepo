import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jobDescriptionService } from '@/views/vacancies/services/job-description.service';
import type { UpdateVacancyJobDescriptionRequest } from '@/views/vacancies/types';

const { mockGet, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: mockGet,
    patch: mockPatch,
  },
}));

describe('jobDescriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVacancyJobDescription', () => {
    it('calls GET /vacancies/:id/job-description and returns response data', async () => {
      const responseData = {
        requestId: 'req-1',
        success: true,
        message: 'ok',
        data: { vacancyId: 'vacancy-1', sections: [] },
      };
      mockGet.mockResolvedValue({ data: responseData });

      const result =
        await jobDescriptionService.getVacancyJobDescription('vacancy-1');

      expect(mockGet).toHaveBeenCalledWith(
        '/vacancies/vacancy-1/job-descriptions'
      );
      expect(result).toBe(responseData);
    });
  });

  describe('updateVacancyJobDescription', () => {
    it('calls PATCH /vacancies/:id/job-description with the payload and returns response data', async () => {
      const payload: UpdateVacancyJobDescriptionRequest = {
        fields: [
          {
            sectionKey: 'PROFILE_REQUIREMENT',
            fieldKey: 'GENDER',
            isVisible: false,
          },
        ],
      };
      const responseData = {
        requestId: 'req-2',
        success: true,
        message: 'Job description has been successfully updated.',
        data: { vacancyId: 'vacancy-1', sections: [] },
      };
      mockPatch.mockResolvedValue({ data: responseData });

      const result = await jobDescriptionService.updateVacancyJobDescription(
        'vacancy-1',
        payload
      );

      expect(mockPatch).toHaveBeenCalledWith(
        '/vacancies/vacancy-1/job-descriptions',
        payload
      );
      expect(result).toBe(responseData);
    });
  });
});
