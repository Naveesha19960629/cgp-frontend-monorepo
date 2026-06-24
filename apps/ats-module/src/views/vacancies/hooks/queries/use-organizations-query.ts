import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type OrganizationOption,
  organizationService,
} from '@/views/vacancies/services';

const ORGANIZATIONS_QUERY_KEY = (search: string) =>
  ['organizations', search] as const;

const ORGANIZATIONS_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const ORGANIZATIONS_GC_TIME = 10 * 60 * 1000; // 10 minutes

export function useOrganizationsQuery(
  searchQuery: string = '',
  enabled = true
) {
  const { data, isLoading, error } = useQuery<OrganizationOption[]>({
    queryKey: ORGANIZATIONS_QUERY_KEY(searchQuery),
    queryFn: () => organizationService.getAllOrganizations(searchQuery),
    enabled,
    staleTime: ORGANIZATIONS_STALE_TIME,
    gcTime: ORGANIZATIONS_GC_TIME,
  });

  return {
    data: data ?? [],
    isLoading,
    error,
  };
}

export function useOrganizationsSearch() {
  const queryClient = useQueryClient();

  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery<OrganizationOption[]>({
        queryKey: ORGANIZATIONS_QUERY_KEY(search),
        queryFn: () => organizationService.getAllOrganizations(search),
        staleTime: ORGANIZATIONS_STALE_TIME,
        gcTime: ORGANIZATIONS_GC_TIME,
      });

      return data.map(item => ({
        value: item.id,
        label: item.name || item.label || '',
        source: item.source ?? 'MASTER',
      }));
    },
    [queryClient]
  );
}

export type { OrganizationOption };
