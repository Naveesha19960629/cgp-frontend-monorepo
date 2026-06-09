import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sportService } from '@/views/vacancies/services/sport.service';
import type { ApiResponse, SportItem } from '@/views/vacancies/types';

// ── Mock @cgp/data-access ──────────────────────────────────────────────────

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: mockGet,
  },
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

const buildResponse = (content: SportItem[]): ApiResponse<SportItem[]> => ({
  requestId: 'req-001',
  success: true,
  message: 'Success',
  data: {
    type: 'SPORT',
    items: {
      content,
      number: 0,
      size: 50,
      totalElements: content.length,
      empty: content.length === 0,
      first: true,
      last: true,
      numberOfElements: content.length,
      totalPages: 1,
      pageable: {
        offset: 0,
        pageNumber: 0,
        pageSize: 50,
        paged: true,
        unpaged: false,
        sort: { sorted: false, empty: true, unsorted: true },
      },
      sort: { sorted: false, empty: true, unsorted: true },
    },
  },
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('sport.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSports', () => {
    it('calls GET /sports with search and size params', async () => {
      const mockResponse = buildResponse([
        { id: '1', name: 'Cricket', source: 'MASTER' },
        { id: '2', name: 'Swimming', source: 'MASTER' },
      ]);

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await sportService.getSports('cric', 50);

      expect(mockGet).toHaveBeenCalledWith('/sports', {
        params: { search: 'cric', size: 50 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('uses default size of 50 when not provided', async () => {
      mockGet.mockResolvedValue({ data: buildResponse([]) });

      await sportService.getSports('test');

      expect(mockGet).toHaveBeenCalledWith('/sports', {
        params: { search: 'test', size: 50 },
      });
    });

    it('handles empty search string', async () => {
      const mockResponse = buildResponse([
        { id: '1', name: 'Cricket', source: 'MASTER' },
        { id: '2', name: 'Rugby', source: 'PENDING' },
      ]);

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await sportService.getSports('', 50);

      expect(mockGet).toHaveBeenCalledWith('/sports', {
        params: { search: '', size: 50 },
      });
      expect(result.data.items.content).toHaveLength(2);
    });
  });
});
