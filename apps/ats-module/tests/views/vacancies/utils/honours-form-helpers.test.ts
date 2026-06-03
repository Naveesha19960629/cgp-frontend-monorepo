import { vi } from 'vitest';

import { organizationService } from '@/views/vacancies/services';
import { resolveUserCreatedOrganizations } from '@/views/vacancies/utils/honours-form-helpers';

vi.mock('@/views/vacancies/services', () => ({
  organizationService: {
    getAllOrganizations: vi.fn(),
  },
}));

describe('Honours Form Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockGetAllOrganizations =
      organizationService.getAllOrganizations as ReturnType<typeof vi.fn>;
    mockGetAllOrganizations.mockResolvedValue([]);
  });

  describe('resolveUserCreatedOrganizations', () => {
    it('returns honours unchanged if no user created organizations', async () => {
      const honoursAndAwards = [
        {
          title: 'Award',
          issuedBy: 'Org',
          associatedOrganizations: [
            { value: 'org-1', label: 'Master Org', source: 'MASTER' },
          ],
        },
      ];

      const createOrganization = vi.fn();

      const result = await resolveUserCreatedOrganizations(
        honoursAndAwards,
        createOrganization
      );

      expect(result).toEqual(honoursAndAwards);
      expect(createOrganization).not.toHaveBeenCalled();
    });

    it('creates new organizations for user created ones', async () => {
      const honoursAndAwards = [
        {
          title: 'Award',
          issuedBy: 'Org',
          associatedOrganizations: [
            {
              value: 'temp',
              label: 'New Organization',
              source: 'USER_CREATED',
            },
          ],
        },
      ];

      const createOrganization = vi.fn().mockResolvedValue({
        pendingId: 'org-pending-1',
        value: 'New Organization',
        status: 'PENDING',
      });

      const result = await resolveUserCreatedOrganizations(
        honoursAndAwards,
        createOrganization
      );

      expect(createOrganization).toHaveBeenCalledWith('New Organization');
      expect(result[0].associatedOrganizations[0]).toEqual({
        value: 'org-pending-1',
        label: 'New Organization',
        source: 'PENDING',
      });
    });

    it('handles multiple user created organizations', async () => {
      const honoursAndAwards = [
        {
          title: 'Award 1',
          issuedBy: 'Org 1',
          associatedOrganizations: [
            { value: 'temp1', label: 'Org A', source: 'USER_CREATED' },
            { value: 'temp2', label: 'Org B', source: 'USER_CREATED' },
          ],
        },
      ];

      const createOrganization = vi
        .fn()
        .mockResolvedValueOnce({
          pendingId: 'org-1',
          value: 'Org A',
          status: 'PENDING',
        })
        .mockResolvedValueOnce({
          pendingId: 'org-2',
          value: 'Org B',
          status: 'PENDING',
        });

      const result = await resolveUserCreatedOrganizations(
        honoursAndAwards,
        createOrganization
      );

      expect(createOrganization).toHaveBeenCalledTimes(2);
      expect(result[0].associatedOrganizations).toHaveLength(2);
      expect(result[0].associatedOrganizations[0].value).toBe('org-1');
      expect(result[0].associatedOrganizations[1].value).toBe('org-2');
    });

    it('handles MST-403 error and finds existing organization', async () => {
      const honoursAndAwards = [
        {
          title: 'Award',
          issuedBy: 'Org',
          associatedOrganizations: [
            { value: 'temp', label: 'Existing Org', source: 'USER_CREATED' },
          ],
        },
      ];

      const createOrganization = vi.fn().mockRejectedValue({
        response: { data: { code: 'MST-403' } },
      });

      const mockGetAllOrganizations =
        organizationService.getAllOrganizations as ReturnType<typeof vi.fn>;
      mockGetAllOrganizations.mockResolvedValue([
        { id: 'org-existing', name: 'Existing Org', source: 'MASTER' },
      ]);

      const result = await resolveUserCreatedOrganizations(
        honoursAndAwards,
        createOrganization
      );

      expect(mockGetAllOrganizations).toHaveBeenCalledWith('Existing Org');
      expect(result[0].associatedOrganizations[0]).toEqual({
        value: 'org-existing',
        label: 'Existing Org',
        source: 'MASTER',
      });
    });

    it('resolves user created organization successfully', async () => {
      const honoursAndAwards = [
        {
          title: 'Award',
          issuedBy: 'Org',
          associatedOrganizations: [
            {
              value: 'temp',
              label: 'Test Organization',
              source: 'USER_CREATED',
            },
          ],
        },
      ];

      const mockGetAllOrganizations =
        organizationService.getAllOrganizations as ReturnType<typeof vi.fn>;
      mockGetAllOrganizations.mockResolvedValue([]);

      const createOrganization = vi.fn().mockResolvedValue({
        pendingId: 'org-pending-1',
        value: 'Test Organization',
        status: 'PENDING',
      });

      const result = await resolveUserCreatedOrganizations(
        honoursAndAwards,
        createOrganization
      );

      expect(result[0].associatedOrganizations[0].value).toBe('org-pending-1');
      expect(result[0].associatedOrganizations[0].source).toBe('PENDING');
    });

    it('preserves master organizations alongside user created ones', async () => {
      const honoursAndAwards = [
        {
          title: 'Award',
          issuedBy: 'Org',
          associatedOrganizations: [
            { value: 'org-1', label: 'Master Org', source: 'MASTER' },
            { value: 'temp', label: 'New Org', source: 'USER_CREATED' },
          ],
        },
      ];

      const createOrganization = vi.fn().mockResolvedValue({
        pendingId: 'org-new',
        value: 'New Org',
        status: 'PENDING',
      });

      const result = await resolveUserCreatedOrganizations(
        honoursAndAwards,
        createOrganization
      );

      expect(result[0].associatedOrganizations).toHaveLength(2);
      expect(result[0].associatedOrganizations[0]).toEqual({
        value: 'org-1',
        label: 'Master Org',
        source: 'MASTER',
      });
      expect(result[0].associatedOrganizations[1].source).toBe('PENDING');
    });

    it('handles multiple honours with mixed organization sources', async () => {
      const honoursAndAwards = [
        {
          title: 'Award 1',
          issuedBy: 'Org 1',
          associatedOrganizations: [
            { value: 'org-1', label: 'Master Org 1', source: 'MASTER' },
            { value: 'temp1', label: 'New Org 1', source: 'USER_CREATED' },
          ],
        },
        {
          title: 'Award 2',
          issuedBy: 'Org 2',
          associatedOrganizations: [
            { value: 'temp2', label: 'New Org 2', source: 'USER_CREATED' },
          ],
        },
      ];

      const createOrganization = vi
        .fn()
        .mockResolvedValueOnce({
          pendingId: 'org-new-1',
          value: 'New Org 1',
          status: 'PENDING',
        })
        .mockResolvedValueOnce({
          pendingId: 'org-new-2',
          value: 'New Org 2',
          status: 'PENDING',
        });

      const result = await resolveUserCreatedOrganizations(
        honoursAndAwards,
        createOrganization
      );

      expect(result).toHaveLength(2);
      expect(result[0].associatedOrganizations).toHaveLength(2);
      expect(result[1].associatedOrganizations).toHaveLength(1);
      expect(result[0].associatedOrganizations[1].value).toBe('org-new-1');
      expect(result[1].associatedOrganizations[0].value).toBe('org-new-2');
    });

    it('case insensitive organization matching on duplicate error', async () => {
      const honoursAndAwards = [
        {
          title: 'Award',
          issuedBy: 'Org',
          associatedOrganizations: [
            { value: 'temp', label: 'Test Org', source: 'USER_CREATED' },
          ],
        },
      ];

      const createOrganization = vi.fn().mockRejectedValue({
        response: { data: { code: 'MST-403' } },
      });

      const mockGetAllOrganizations =
        organizationService.getAllOrganizations as ReturnType<typeof vi.fn>;
      mockGetAllOrganizations.mockResolvedValue([
        { id: 'org-1', name: 'test org', source: 'MASTER' },
      ]);

      const result = await resolveUserCreatedOrganizations(
        honoursAndAwards,
        createOrganization
      );

      expect(result[0].associatedOrganizations[0]).toEqual({
        value: 'org-1',
        label: 'test org',
        source: 'MASTER',
      });
    });

    it('throws error if duplicate found but matching organization not found', async () => {
      const honoursAndAwards = [
        {
          title: 'Award',
          issuedBy: 'Org',
          associatedOrganizations: [
            { value: 'temp', label: 'Test Org', source: 'USER_CREATED' },
          ],
        },
      ];

      const createOrganization = vi.fn().mockRejectedValue({
        response: { data: { code: 'MST-403' } },
      });

      const mockGetAllOrganizations =
        organizationService.getAllOrganizations as ReturnType<typeof vi.fn>;
      mockGetAllOrganizations.mockResolvedValue([
        { id: 'org-1', name: 'Different Org', source: 'MASTER' },
      ]);

      await expect(
        resolveUserCreatedOrganizations(honoursAndAwards, createOrganization)
      ).rejects.toEqual({ response: { data: { code: 'MST-403' } } });
    });

    it('throws error on non-MST-403 errors', async () => {
      const honoursAndAwards = [
        {
          title: 'Award',
          issuedBy: 'Org',
          associatedOrganizations: [
            { value: 'temp', label: 'Test Org', source: 'USER_CREATED' },
          ],
        },
      ];

      const networkError = new Error('Network error');
      const createOrganization = vi.fn().mockRejectedValue(networkError);

      await expect(
        resolveUserCreatedOrganizations(honoursAndAwards, createOrganization)
      ).rejects.toThrow('Network error');
    });

    it('deduplicates same user created organization across multiple honours', async () => {
      const honoursAndAwards = [
        {
          title: 'Award 1',
          issuedBy: 'Org 1',
          associatedOrganizations: [
            { value: 'temp1', label: 'Shared Org', source: 'USER_CREATED' },
          ],
        },
        {
          title: 'Award 2',
          issuedBy: 'Org 2',
          associatedOrganizations: [
            { value: 'temp2', label: 'Shared Org', source: 'USER_CREATED' },
          ],
        },
      ];

      const createOrganization = vi.fn().mockResolvedValue({
        pendingId: 'org-new',
        value: 'Shared Org',
        status: 'PENDING',
      });

      const result = await resolveUserCreatedOrganizations(
        honoursAndAwards,
        createOrganization
      );

      // Both items will be resolved to the same value due to map deduplication by label
      expect(result[0].associatedOrganizations[0].value).toBe('org-new');
      expect(result[1].associatedOrganizations[0].value).toBe('org-new');
      expect(result[0].associatedOrganizations[0].label).toBe('Shared Org');
      expect(result[1].associatedOrganizations[0].label).toBe('Shared Org');
    });
  });
});
