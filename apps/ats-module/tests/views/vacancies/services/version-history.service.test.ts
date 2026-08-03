import { beforeEach, describe, expect, it, vi } from 'vitest';

import { versionHistoryService } from '@/views/vacancies/services/version-history.service';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: mockGet,
  },
}));

describe('versionHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVacancyVersionHistory', () => {
    it('calls GET /vacancies/:id/version-histories and returns response data', async () => {
      const responseData = {
        requestId: 'req-1',
        success: true,
        message: 'Version history retrieved successfully',
        data: {
          vacancyTitle: 'Vice President',
          status: 'ONHOLD',
          createdAt: '2026-07-07T20:04:24.850555',
          createdBy: 'sahanlmsl@gmail.com',
          lastUpdatedAt: '2026-07-07T21:40:43.804959',
          totalVersions: 1,
          versions: [],
        },
      };
      mockGet.mockResolvedValue({ data: responseData });

      const result =
        await versionHistoryService.getVacancyVersionHistory('vacancy-1');

      expect(mockGet).toHaveBeenCalledWith(
        '/vacancies/vacancy-1/version-histories'
      );
      expect(result).toBe(responseData);
    });
  });
});
