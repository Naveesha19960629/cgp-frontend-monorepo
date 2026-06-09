import { useMutation, useQueryClient } from '@tanstack/react-query';

import { organizationService } from '@/views/vacancies/services';
import type { CreatePendingItemResponse } from '@/views/vacancies/types';

const useCreateOrganizationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (label: string): Promise<CreatePendingItemResponse> => {
      const response = await organizationService.createMasterDataOrganization({
        type: 'ORGANIZATION',
        displayValue: label,
        payload: {
          name: label,
        },
      });

      return {
        pendingId: response.data.pendingId,
        type: 'ORGANIZATION',
        value: response.data.displayValue ?? label,
        status: 'PENDING',
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

export { useCreateOrganizationMutation };
