import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateCandidateProfileBasicInformationsMutation } from '@/views/vacancies/hooks/mutations/use-update-candidate-profile-basic-informations-mutation';

// -- Types ------------------------------------------------------------------

type MockMutation<TArg = unknown> = {
  mutationFn: (arg: TArg) => Promise<unknown>;
};

type UpdateProfileResponse = {
  requestId: string;
  success: boolean;
  message: string;
};

// -- Mock @tanstack/react-query -------------------------------------------

const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
}));

// -- Mock services ----------------------------------------------------------

const mockUpdateProfileBasicInformations = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  candidateProfileService: {
    updateProfileBasicInformations: (...args: unknown[]) =>
      mockUpdateProfileBasicInformations(...args) as unknown,
  },
}));

describe('useUpdateCandidateProfileBasicInformationsMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
  });

  it('mutationFn calls candidateProfileService.updateProfileBasicInformations with candidateId and payload', async () => {
    const mockResponse = {
      requestId: 'req-123',
      success: true,
      message: 'Profile updated',
    };
    mockUpdateProfileBasicInformations.mockResolvedValue(mockResponse);

    const mutation =
      useUpdateCandidateProfileBasicInformationsMutation() as unknown as MockMutation<{
        candidateId: string;
        payload: unknown;
      }>;

    const candidateId = 'candidate-123';
    const payload = {
      isEnabled: true,
      dataTakenFromCandidate: false,
      gender: { id: 'gender-1', label: 'Male' },
      maritalStatus: { id: 'status-1', label: 'Single' },
      addresses: [],
    };

    const result = await mutation.mutationFn({ candidateId, payload });

    expect(mockUpdateProfileBasicInformations).toHaveBeenCalledWith(
      candidateId,
      payload
    );
    expect(result).toEqual(mockResponse);
  });

  it('mutationFn returns the API response', async () => {
    const mockResponse = {
      requestId: 'req-456',
      success: true,
      message: 'Update successful',
    };
    mockUpdateProfileBasicInformations.mockResolvedValue(mockResponse);

    const mutation =
      useUpdateCandidateProfileBasicInformationsMutation() as unknown as MockMutation<{
        candidateId: string;
        payload: unknown;
      }>;

    const result = (await mutation.mutationFn({
      candidateId: 'candidate-456',
      payload: {
        isEnabled: false,
        dataTakenFromCandidate: true,
        gender: { id: '', label: '' },
        maritalStatus: { id: '', label: '' },
        addresses: [],
      },
    })) as UpdateProfileResponse;

    expect(result).toEqual(mockResponse);
    expect(result.success).toBe(true);
    expect(result.requestId).toBe('req-456');
  });

  it('mutationFn propagates service errors', async () => {
    const mockError = new Error('Pending API integration');
    mockUpdateProfileBasicInformations.mockRejectedValue(mockError);

    const mutation =
      useUpdateCandidateProfileBasicInformationsMutation() as unknown as MockMutation<{
        candidateId: string;
        payload: unknown;
      }>;

    await expect(
      mutation.mutationFn({
        candidateId: 'candidate-789',
        payload: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: { id: '', label: '' },
          maritalStatus: { id: '', label: '' },
          addresses: [],
        },
      })
    ).rejects.toThrow('Pending API integration');
  });

  it('passes options to useMutation', () => {
    useUpdateCandidateProfileBasicInformationsMutation();

    expect(mockUseMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        mutationFn: expect.any(Function),
      })
    );
  });

  it('mutationFn accepts profileRequirements with multiple addresses', async () => {
    const mockResponse = {
      requestId: 'req-full',
      success: true,
      message: 'Updated',
    };
    mockUpdateProfileBasicInformations.mockResolvedValue(mockResponse);

    const mutation =
      useUpdateCandidateProfileBasicInformationsMutation() as unknown as MockMutation<{
        candidateId: string;
        payload: unknown;
      }>;

    const payload = {
      isEnabled: true,
      dataTakenFromCandidate: false,
      gender: { id: 'gender-1', label: 'Female' },
      maritalStatus: { id: 'status-1', label: 'Married' },
      addresses: [
        {
          city: { id: 'city-1', label: 'New York' },
          stateProvince: { id: 'state-1', label: 'NY' },
          country: { id: 'country-1', label: 'USA' },
          postalCode: '10001',
          isOpen: true,
        },
        {
          city: { id: 'city-2', label: 'Los Angeles' },
          stateProvince: { id: 'state-2', label: 'CA' },
          country: { id: 'country-1', label: 'USA' },
          postalCode: '90001',
          isOpen: false,
        },
      ],
    };

    const result = await mutation.mutationFn({
      candidateId: 'candidate-full',
      payload,
    });

    expect(mockUpdateProfileBasicInformations).toHaveBeenCalledWith(
      'candidate-full',
      payload
    );
    expect(result).toEqual(mockResponse);
  });
});
