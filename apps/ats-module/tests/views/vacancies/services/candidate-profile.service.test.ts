import { beforeEach, describe, expect, it, vi } from 'vitest';

import { candidateProfileService } from '@/views/vacancies/services/candidate-profile.service';

describe('candidateProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfileBasicInformations', () => {
    it('throws pending integration error when called', async () => {
      const candidateId = 'candidate-123';
      const payload = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        gender: { id: 'gender-1', label: 'Male' },
        maritalStatus: { id: 'status-1', label: 'Single' },
        addresses: [
          {
            city: { id: 'city-1', label: 'New York' },
            stateProvince: { id: 'state-1', label: 'NY' },
            country: { id: 'country-1', label: 'USA' },
            postalCode: '10001',
            isOpen: true,
          },
        ],
      };

      await expect(
        candidateProfileService.updateProfileBasicInformations(
          candidateId,
          payload
        )
      ).rejects.toThrow(/Pending API integration for \/v1\/candidates/);
    });

    it('includes candidateId in error message', async () => {
      const candidateId = 'candidate-456';
      const payload = {
        isEnabled: false,
        dataTakenFromCandidate: true,
        gender: { id: '', label: '' },
        maritalStatus: { id: '', label: '' },
        addresses: [],
      };

      await expect(
        candidateProfileService.updateProfileBasicInformations(
          candidateId,
          payload
        )
      ).rejects.toThrow(/candidateId: candidate-456/);
    });

    it('indicates payload is ready in error message', async () => {
      const candidateId = 'candidate-789';
      const payload = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        gender: { id: 'gender-1', label: 'Female' },
        maritalStatus: { id: '', label: '' },
        addresses: [],
      };

      await expect(
        candidateProfileService.updateProfileBasicInformations(
          candidateId,
          payload
        )
      ).rejects.toThrow(/payloadReady: true/);
    });

    it('accepts ProfileRequirements with minimal data', async () => {
      const candidateId = 'candidate-min';
      const payload = {
        isEnabled: false,
        dataTakenFromCandidate: false,
        gender: { id: '', label: '' },
        maritalStatus: { id: '', label: '' },
        addresses: [],
      };

      await expect(
        candidateProfileService.updateProfileBasicInformations(
          candidateId,
          payload
        )
      ).rejects.toThrow();
    });

    it('accepts ProfileRequirements with complete data including multiple addresses', async () => {
      const candidateId = 'candidate-full';
      const payload = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        gender: { id: 'gender-1', label: 'Male' },
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

      await expect(
        candidateProfileService.updateProfileBasicInformations(
          candidateId,
          payload
        )
      ).rejects.toThrow();
    });
  });
});
