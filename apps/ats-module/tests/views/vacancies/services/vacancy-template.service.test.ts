import { beforeEach, describe, expect, it, vi } from 'vitest';

import { vacancyTemplateService } from '@/views/vacancies/services/vacancy-template.service';

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  },
}));

describe('vacancyTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteTemplate', () => {
    it('sends a DELETE request to /vacancy-templates/:id', async () => {
      const mockResponse = {
        data: {
          requestId: 'req-123',
          success: true,
          message: 'Template deleted successfully',
          data: 'template-1',
        },
      };
      mockDelete.mockResolvedValue(mockResponse);

      const result = await vacancyTemplateService.deleteTemplate('template-1');

      expect(mockDelete).toHaveBeenCalledWith('/vacancy-templates/template-1');
      expect(result).toEqual(mockResponse.data);
    });

    it('throws when the HTTP request fails', async () => {
      mockDelete.mockRejectedValue(new Error('Network error'));

      await expect(
        vacancyTemplateService.deleteTemplate('template-1')
      ).rejects.toThrow('Network error');
    });
  });
});
