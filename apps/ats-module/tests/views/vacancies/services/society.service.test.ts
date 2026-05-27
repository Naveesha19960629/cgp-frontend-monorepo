import { beforeEach, describe, expect, it, vi } from 'vitest';

import { societyService } from '@/views/vacancies/services/society.service';
import type {
  ApiResponse,
  SocietyCreateResponse,
  SocietyItem,
} from '@/views/vacancies/types';

// ── Mock @cgp/data-access ──────────────────────────────────────────────────

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

// ── Tests ───────────────────────────────────────────────────────────────────

describe('society.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getSocieties ──────────────────────────────────────────────────────────

  describe('getSocieties', () => {
    it('calls GET /societies with search and size params', async () => {
      const mockResponse: ApiResponse<SocietyItem[]> = {
        requestId: 'req-001',
        success: true,
        message: 'Success',
        data: {
          type: 'SOCIETY',
          items: {
            content: [
              { id: '1', name: 'Rotaract Club', source: 'MASTER' },
              { id: '2', name: 'Swimming Team', source: 'MASTER' },
            ],
            number: 0,
            size: 50,
            totalElements: 2,
            empty: false,
            first: true,
            last: true,
            numberOfElements: 2,
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
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await societyService.getSocieties('club', 50);

      expect(mockGet).toHaveBeenCalledWith('/societies', {
        params: { search: 'club', size: 50 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('uses default size of 50 when not provided', async () => {
      const mockResponse: ApiResponse<SocietyItem[]> = {
        requestId: 'req-002',
        success: true,
        message: 'Success',
        data: {
          type: 'SOCIETY',
          items: {
            content: [],
            number: 0,
            size: 50,
            totalElements: 0,
            empty: true,
            first: true,
            last: true,
            numberOfElements: 0,
            totalPages: 0,
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
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      await societyService.getSocieties('test');

      expect(mockGet).toHaveBeenCalledWith('/societies', {
        params: { search: 'test', size: 50 },
      });
    });

    it('handles empty search string', async () => {
      const mockResponse: ApiResponse<SocietyItem[]> = {
        requestId: 'req-003',
        success: true,
        message: 'Success',
        data: {
          type: 'SOCIETY',
          items: {
            content: [
              { id: '1', name: 'Society A', source: 'MASTER' },
              { id: '2', name: 'Society B', source: 'PENDING' },
            ],
            number: 0,
            size: 50,
            totalElements: 2,
            empty: false,
            first: true,
            last: true,
            numberOfElements: 2,
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
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await societyService.getSocieties('', 50);

      expect(mockGet).toHaveBeenCalledWith('/societies', {
        params: { search: '', size: 50 },
      });
      expect(result.data.items.content).toHaveLength(2);
    });
  });

  // ── createSociety ─────────────────────────────────────────────────────────

  describe('createSociety', () => {
    it('calls POST /societies with correct payload', async () => {
      const mockResponse: SocietyCreateResponse = {
        id: 'soc-123',
        name: 'New Society',
        source: 'PENDING',
      };

      mockPost.mockResolvedValue({ data: { data: mockResponse } });

      const result = await societyService.createSociety('New Society');

      expect(mockPost).toHaveBeenCalledWith('/societies', {
        type: 'SOCIETY',
        displayValue: 'New Society',
      });
      expect(result).toEqual(mockResponse);
    });

    it('returns response with pendingId when provided', async () => {
      const mockResponse: SocietyCreateResponse = {
        id: 'soc-456',
        pendingId: 'pending-789',
        name: 'Test Society',
        source: 'PENDING',
      };

      mockPost.mockResolvedValue({ data: { data: mockResponse } });

      const result = await societyService.createSociety('Test Society');

      expect(result.pendingId).toBe('pending-789');
      expect(result.source).toBe('PENDING');
    });

    it('handles society names with special characters', async () => {
      const mockResponse: SocietyCreateResponse = {
        id: 'soc-999',
        name: 'Society & Club - 2024',
        source: 'USER_CREATED',
      };

      mockPost.mockResolvedValue({ data: { data: mockResponse } });

      await societyService.createSociety('Society & Club - 2024');

      expect(mockPost).toHaveBeenCalledWith('/societies', {
        type: 'SOCIETY',
        displayValue: 'Society & Club - 2024',
      });
    });
  });
});
