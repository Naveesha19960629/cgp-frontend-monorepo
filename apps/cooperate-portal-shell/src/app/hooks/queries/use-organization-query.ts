import { useQuery } from '@tanstack/react-query';

import { organizationService } from '../../services/organization.service';

export const useAllOrganizationsQuery = (search: string = '') => {
  return useQuery({
    queryKey: ['organizations', search],
    queryFn: () => organizationService.getAllOrganizations(search),
  });
};

export const useOrganizationsQuery = (search: string = '') => {
  return useQuery({
    queryKey: ['organizations', search],
    queryFn: () => organizationService.getAllOrganizations(search),
    enabled: true,
  });
};
