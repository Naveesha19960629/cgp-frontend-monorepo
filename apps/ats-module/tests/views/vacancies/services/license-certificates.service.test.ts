import { beforeEach, describe, expect, it, vi } from 'vitest';

import { licenseCertificatesService } from '@/views/vacancies/services/license-certificates.service';
import type {
  ApiResponse,
  CreatePendingApiResponse,
} from '@/views/vacancies/types';

// ── Mock @cgp/data-access ──────────────────────────────────────────────────

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: mockGet,
    post: mockPost,
  },
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

const pagedResponse = <T>(content: T[]): ApiResponse<T[]> => ({
  requestId: 'req-001',
  success: true,
  message: 'Success',
  data: {
    type: 'TEST',
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

const pendingResponse = (): CreatePendingApiResponse => ({
  requestId: 'req-002',
  success: true,
  message: 'Created',
  data: {
    pendingId: 'pending-123',
    type: 'TEST',
    value: 'Test Item',
    status: 'PENDING',
  },
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('licenseCertificatesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('getLicensesAndCertifications', () => {
    it('calls httpClient.get with correct params and returns data', async () => {
      const mockData = [
        {
          id: '1',
          label: 'AWS Developer',
          source: 'MASTER',
          type: 'CERTIFICATION',
        },
        {
          id: '2',
          label: 'Project Management',
          source: 'MASTER',
          type: 'LICENSE',
        },
      ];
      mockGet.mockResolvedValue({ data: pagedResponse(mockData) });

      const result =
        await licenseCertificatesService.getLicensesAndCertifications(
          'AWS',
          0,
          10
        );

      expect(mockGet).toHaveBeenCalledWith('/licenses-and-certificates', {
        params: { search: 'AWS', page: 0, size: 10 },
      });
      expect(result).toEqual(pagedResponse(mockData));
    });

    it('uses default params when not provided', async () => {
      mockGet.mockResolvedValue({ data: pagedResponse([]) });

      await licenseCertificatesService.getLicensesAndCertifications();

      expect(mockGet).toHaveBeenCalledWith('/licenses-and-certificates', {
        params: { search: '', page: 0, size: 10 },
      });
    });
  });

  describe('addLicenseCertificate', () => {
    it('POSTs to /licenses with type LICENSE when adding a license', async () => {
      mockPost.mockResolvedValue({ data: pendingResponse() });

      const result = await licenseCertificatesService.addLicenseCertificate({
        type: 'LICENSE',
        displayValue: 'License AB',
      });

      expect(mockPost).toHaveBeenCalledWith('/licenses', {
        type: 'LICENSE',
        displayValue: 'License AB',
      });
      expect(result).toEqual(pendingResponse());
    });

    it('POSTs to /certificates with type CERTIFICATE when adding a certification', async () => {
      mockPost.mockResolvedValue({ data: pendingResponse() });

      const result = await licenseCertificatesService.addLicenseCertificate({
        type: 'CERTIFICATION',
        displayValue: 'Software Engineering certificates A',
      });

      expect(mockPost).toHaveBeenCalledWith('/certificates', {
        type: 'CERTIFICATE',
        displayValue: 'Software Engineering certificates A',
      });
      expect(result).toEqual(pendingResponse());
    });

    it('returns the pending API response', async () => {
      const response: CreatePendingApiResponse = {
        requestId: 'req-123',
        success: true,
        message: 'Pending item created',
        data: {
          pendingId: 'temp-456',
          type: 'TEST',
          value: 'Test License',
          status: 'PENDING',
        },
      };
      mockPost.mockResolvedValue({ data: response });

      const result = await licenseCertificatesService.addLicenseCertificate({
        type: 'LICENSE',
        displayValue: 'Test License',
      });

      expect(result).toEqual(response);
    });
  });
});
