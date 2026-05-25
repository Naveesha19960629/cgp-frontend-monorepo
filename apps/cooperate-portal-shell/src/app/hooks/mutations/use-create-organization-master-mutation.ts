import { useMutation, useQueryClient } from '@tanstack/react-query';

import { organizationService } from '../../services/organization.service';
import type { OrganizationFormSchema } from '../use-organization-form';

type ToastFunction = (options: { title: string; description: string }) => void;

// TODO: Import these from your toast/notification library
// For now, using console as placeholder
const SuccessToast: ToastFunction = ({ title, description }) => {
  console.log(`✓ ${title}: ${description}`);
};

const ErrorToast: ToastFunction = ({ title, description }) => {
  console.error(`✗ ${title}: ${description}`);
};

export const useCreateOrganizationMasterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrganizationFormSchema) =>
      organizationService.createMasterDataOrganization({
        type: 'ORGANIZATION',
        displayValue: data.name,
        payload: {
          url: data.organizationWebSite,
          location: data.location?.id ? { id: data.location.id } : undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['allOrganizations'],
      });
      SuccessToast({
        title: 'Successfully Added',
        description: 'Organization has been successfully added to the list',
      });
    },
    onError: _error => {
      ErrorToast({
        title: 'Try Again',
        description: 'Could not add organization. Please try again.',
      });
    },
  });
};
