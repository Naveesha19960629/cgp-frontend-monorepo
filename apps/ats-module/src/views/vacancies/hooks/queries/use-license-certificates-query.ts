import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type LicenseCertLookupItem,
  licenseCertificatesService,
} from '@/views/vacancies/services';
import type { ApiResponse } from '@/views/vacancies/types';

const LICENSE_CERTS_QUERY_KEY = ['licenses-and-certificates'] as const;

const useLicenseCertificatesQuery = (search: string = '') =>
  useQuery<ApiResponse<LicenseCertLookupItem[]>>({
    queryKey: [...LICENSE_CERTS_QUERY_KEY, search],
    queryFn: () =>
      licenseCertificatesService.getLicensesAndCertifications(search),
  });

const useLicenseCertificatesSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery<
        ApiResponse<LicenseCertLookupItem[]>
      >({
        queryKey: [...LICENSE_CERTS_QUERY_KEY, search],
        queryFn: () =>
          licenseCertificatesService.getLicensesAndCertifications(search),
      });
      return data.data.items.content.map(item => ({
        value: item.id,
        label: item.label,
        source: item.source,
        certType: item.type,
      }));
    },
    [queryClient]
  );
};

export { useLicenseCertificatesQuery, useLicenseCertificatesSearch };
