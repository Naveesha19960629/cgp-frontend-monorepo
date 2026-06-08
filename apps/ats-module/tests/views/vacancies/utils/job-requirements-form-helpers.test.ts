import { describe, expect, it, vi } from 'vitest';

import type {
  CreatePendingApiResponse,
  JobRequirementFormOption,
} from '@/views/vacancies/types';
import { resolveUserCreatedOptions } from '@/views/vacancies/utils/job-requirements-form-helpers';

describe('resolveUserCreatedOptions', () => {
  const mockCreateFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns original options when none are USER_CREATED', async () => {
    const options: JobRequirementFormOption[] = [
      { value: 'id-1', label: 'Option A', source: 'MASTER' },
      { value: 'id-2', label: 'Option B', source: 'PENDING' },
    ];

    const result = await resolveUserCreatedOptions(options, mockCreateFn);

    expect(mockCreateFn).not.toHaveBeenCalled();
    expect(result).toEqual(options);
  });

  it('returns empty array unchanged', async () => {
    const result = await resolveUserCreatedOptions([], mockCreateFn);

    expect(mockCreateFn).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('resolves USER_CREATED options to PENDING with pendingId', async () => {
    const options: JobRequirementFormOption[] = [
      { value: 'temp-1', label: 'New Item', source: 'USER_CREATED' },
    ];

    const pendingResponse: CreatePendingApiResponse = {
      requestId: 'req-001',
      success: true,
      message: 'Created',
      data: {
        pendingId: 'pending-abc',
        type: 'TEST',
        value: 'New Item',
        status: 'PENDING',
      },
    };

    mockCreateFn.mockResolvedValue(pendingResponse);

    const result = await resolveUserCreatedOptions(options, mockCreateFn);

    expect(mockCreateFn).toHaveBeenCalledWith('New Item');
    expect(result).toEqual([
      { value: 'pending-abc', label: 'New Item', source: 'PENDING' },
    ]);
  });

  it('preserves non-USER_CREATED options alongside resolved ones', async () => {
    const options: JobRequirementFormOption[] = [
      { value: 'id-1', label: 'Existing', source: 'MASTER' },
      { value: 'temp-1', label: 'New', source: 'USER_CREATED' },
      { value: 'id-2', label: 'Another', source: 'PENDING' },
    ];

    const pendingResponse: CreatePendingApiResponse = {
      requestId: 'req-001',
      success: true,
      message: 'Created',
      data: {
        pendingId: 'pending-xyz',
        type: 'TEST',
        value: 'New',
        status: 'PENDING',
      },
    };

    mockCreateFn.mockResolvedValue(pendingResponse);

    const result = await resolveUserCreatedOptions(options, mockCreateFn);

    expect(result).toEqual([
      { value: 'id-1', label: 'Existing', source: 'MASTER' },
      { value: 'pending-xyz', label: 'New', source: 'PENDING' },
      { value: 'id-2', label: 'Another', source: 'PENDING' },
    ]);
  });

  it('resolves multiple USER_CREATED options concurrently', async () => {
    const options: JobRequirementFormOption[] = [
      { value: 'temp-1', label: 'First', source: 'USER_CREATED' },
      { value: 'temp-2', label: 'Second', source: 'USER_CREATED' },
    ];

    mockCreateFn
      .mockResolvedValueOnce({
        requestId: 'req-001',
        success: true,
        message: 'Created',
        data: {
          pendingId: 'p1',
          type: 'TEST',
          value: 'First',
          status: 'PENDING',
        },
      } satisfies CreatePendingApiResponse)
      .mockResolvedValueOnce({
        requestId: 'req-002',
        success: true,
        message: 'Created',
        data: {
          pendingId: 'p2',
          type: 'TEST',
          value: 'Second',
          status: 'PENDING',
        },
      } satisfies CreatePendingApiResponse);

    const result = await resolveUserCreatedOptions(options, mockCreateFn);

    expect(mockCreateFn).toHaveBeenCalledTimes(2);
    expect(mockCreateFn).toHaveBeenCalledWith('First');
    expect(mockCreateFn).toHaveBeenCalledWith('Second');
    expect(result).toEqual([
      { value: 'p1', label: 'First', source: 'PENDING' },
      { value: 'p2', label: 'Second', source: 'PENDING' },
    ]);
  });
});
