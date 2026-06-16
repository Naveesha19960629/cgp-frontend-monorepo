import { beforeEach, describe, expect, it, vi } from 'vitest';

import { vacancyService } from '@/views/vacancies/services/vacancy.service';

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    post: mockPost,
  },
}));

const mockCreateVacancyPayload = {
  title: 'Test Vacancy',
  status: 'UNPUBLISHED',
  lastActiveStep: 'job-requirements',
  data: {
    jobRequirement: {
      isEnabled: true,
      dataTakenFromCandidate: false,
      roles: [],
      jobTitles: [],
    },
    industry: {
      isEnabled: false,
      dataTakenFromCandidate: false,
      content: [],
    },
    patents: [
      {
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      },
    ],
    honoursAndAwards: [
      {
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      },
    ],
    projects: [
      {
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      },
    ],
    customizedForm: {
      isEnabled: false,
      sectionTitle: '',
      forms: [],
    },
    schedule: {
      schedulePublishAt: '2026-06-25T10:30:00 AM',
      expirationAt: '2026-06-30T05:27:10 PM',
    },
  },
};

describe('vacancyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVacancy', () => {
    it('sends POST request to /vacancies endpoint', async () => {
      const mockResponse = {
        data: {
          requestId: 'req-123',
          success: true,
          message: 'Vacancy created successfully',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await vacancyService.createVacancy(
        mockCreateVacancyPayload
      );

      expect(mockPost).toHaveBeenCalledWith(
        '/vacancies',
        mockCreateVacancyPayload
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
      mockPost.mockResolvedValue(mockResponse);

      const result = await vacancyService.createVacancy(
        mockCreateVacancyPayload
      );

      expect(result.success).toBe(true);
      expect(result.requestId).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('throws error when HTTP request fails', async () => {
      const mockError = new Error('Network error');
      mockPost.mockRejectedValue(mockError);

      await expect(
        vacancyService.createVacancy(mockCreateVacancyPayload)
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
      mockPost.mockResolvedValue(mockResponse);

      const payload = {
        ...mockCreateVacancyPayload,
        data: {
          ...mockCreateVacancyPayload.data,
          schedule: {
            schedulePublishAt: '2026-06-25T02:30:00 PM',
            expirationAt: '2026-07-15T11:59:59 PM',
          },
        },
      };

      await vacancyService.createVacancy(payload);

      expect(mockPost).toHaveBeenCalledWith(
        '/vacancies',
        expect.objectContaining({
          data: expect.objectContaining({
            schedule: {
              schedulePublishAt: '2026-06-25T02:30:00 PM',
              expirationAt: '2026-07-15T11:59:59 PM',
            },
          }),
        })
      );
    });
  });
});
