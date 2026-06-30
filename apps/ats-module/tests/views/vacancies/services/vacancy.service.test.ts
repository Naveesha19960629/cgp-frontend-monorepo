import { beforeEach, describe, expect, it, vi } from 'vitest';

import { vacancyService } from '@/views/vacancies/services/vacancy.service';
import type { CreateVacancyPayload } from '@/views/vacancies/types';

const { mockGet, mockPost, mockPut } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
  },
}));

const mockCreateVacancyPayload: CreateVacancyPayload = {
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
    profileRequirement: [
      {
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: { gender: '', maritalStatus: '', addresses: [] },
      },
    ],
    secondaryEducation: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    tertiaryEducation: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    skills: {
      isEnabled: false,
      dataTakenFromCandidate: false,
      content: [],
    },
    languages: {
      isEnabled: false,
      dataTakenFromCandidate: false,
      content: [],
    },
    causes: [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }],
    hobbyList: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
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
    publications: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    clubsAndSocieties: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    sports: [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }],
    volunteering: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    licensesAndCertifications: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
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

  describe('getFilterOptions', () => {
    const mockFilterResponse = {
      data: {
        requestId: 'req-filter-1',
        success: true,
        message: 'OK',
        data: {
          careerPaths: [{ id: 'cp1', label: 'Engineering' }],
          disciplines: [{ id: 'd1', label: 'Software' }],
          statuses: [{ id: 'Live', label: 'Live' }],
        },
      },
    };

    it('sends GET request to /vacancies/filters/options', async () => {
      mockGet.mockResolvedValue(mockFilterResponse);

      await vacancyService.getFilterOptions();

      expect(mockGet).toHaveBeenCalledWith(
        '/vacancies/filters/options',
        expect.objectContaining({ params: undefined })
      );
    });

    it('includes search param when search string is provided', async () => {
      mockGet.mockResolvedValue(mockFilterResponse);

      await vacancyService.getFilterOptions('engineer');

      expect(mockGet).toHaveBeenCalledWith('/vacancies/filters/options', {
        params: { search: 'engineer' },
      });
    });

    it('sends no params when search is undefined', async () => {
      mockGet.mockResolvedValue(mockFilterResponse);

      await vacancyService.getFilterOptions(undefined);

      expect(mockGet).toHaveBeenCalledWith(
        '/vacancies/filters/options',
        expect.objectContaining({ params: undefined })
      );
    });

    it('returns the API response data', async () => {
      mockGet.mockResolvedValue(mockFilterResponse);

      const result = await vacancyService.getFilterOptions();

      expect(result).toEqual(mockFilterResponse.data);
    });

    it('throws when HTTP request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(vacancyService.getFilterOptions()).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('updateVacancy', () => {
    it('sends PUT request to /vacancies/:id endpoint', async () => {
      const vacancyId = 'vacancy-123';
      const mockResponse = {
        data: {
          requestId: 'req-901',
          success: true,
          message: 'Vacancy updated successfully',
        },
      };
      mockPut.mockResolvedValue(mockResponse);

      const result = await vacancyService.updateVacancy(
        vacancyId,
        mockCreateVacancyPayload
      );

      expect(mockPut).toHaveBeenCalledWith(
        `/vacancies/${vacancyId}`,
        mockCreateVacancyPayload
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('returns success response with correct structure', async () => {
      const mockResponse = {
        data: {
          requestId: 'req-902',
          success: true,
          message: 'Updated',
        },
      };
      mockPut.mockResolvedValue(mockResponse);

      const result = await vacancyService.updateVacancy(
        'vacancy-456',
        mockCreateVacancyPayload
      );

      expect(result.success).toBe(true);
      expect(result.requestId).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('throws error when HTTP request fails', async () => {
      const mockError = new Error('Update network error');
      mockPut.mockRejectedValue(mockError);

      await expect(
        vacancyService.updateVacancy('vacancy-789', mockCreateVacancyPayload)
      ).rejects.toThrow('Update network error');
    });
  });
});
