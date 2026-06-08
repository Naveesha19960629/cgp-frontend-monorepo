import { describe, expect, it, vi } from 'vitest';

import { vacancyService } from '@/views/vacancies/services/vacancy.service';

import * as dataAccess from '@cgp/data-access';

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

describe('vacancyService', () => {
  describe('createVacancy', () => {
    it('sends POST request to /vacancies endpoint', async () => {
      const mockResponse = {
        data: {
          requestId: 'req-123',
          success: true,
          message: 'Vacancy created successfully',
        },
      };
      vi.mocked(dataAccess.httpClient.post).mockResolvedValue(mockResponse);

      const payload = {
        schedule: {
          schedulePublishAt: '2026-06-25T10:30:00 AM',
          expirationAt: '2026-06-30T05:27:10 PM',
        },
      };

      const result = await vacancyService.createVacancy(payload);

      expect(dataAccess.httpClient.post).toHaveBeenCalledWith(
        '/vacancies',
        payload
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('returns success response with correct structure', async () => {
      const mockResponse = {
        data: {
          requestId: 'req-456',
          success: true,
          message: 'OK',
        },
      };
      vi.mocked(dataAccess.httpClient.post).mockResolvedValue(mockResponse);

      const result = await vacancyService.createVacancy({
        schedule: {
          schedulePublishAt: '2026-06-25T10:30:00 AM',
          expirationAt: '2026-06-30T05:27:10 PM',
        },
      });

      expect(result.success).toBe(true);
      expect(result.requestId).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('throws error when HTTP request fails', async () => {
      const mockError = new Error('Network error');
      vi.mocked(dataAccess.httpClient.post).mockRejectedValue(mockError);

      await expect(
        vacancyService.createVacancy({
          schedule: {
            schedulePublishAt: '2026-06-25T10:30:00 AM',
            expirationAt: '2026-06-30T05:27:10 PM',
          },
        })
      ).rejects.toThrow('Network error');
    });

    it('sends payload with correct schedule data', async () => {
      const mockResponse = {
        data: {
          requestId: 'req-789',
          success: true,
          message: 'Created',
        },
      };
      vi.mocked(dataAccess.httpClient.post).mockResolvedValue(mockResponse);

      const payload = {
        schedule: {
          schedulePublishAt: '2026-06-25T02:30:00 PM',
          expirationAt: '2026-07-15T11:59:59 PM',
        },
      };

      await vacancyService.createVacancy(payload);

      expect(dataAccess.httpClient.post).toHaveBeenCalledWith(
        '/vacancies',
        expect.objectContaining({
          schedule: {
            schedulePublishAt: '2026-06-25T02:30:00 PM',
            expirationAt: '2026-07-15T11:59:59 PM',
          },
        })
      );
    });
  });
});
