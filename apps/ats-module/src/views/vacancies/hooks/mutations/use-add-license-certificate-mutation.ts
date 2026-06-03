import { useMutation, useQueryClient } from '@tanstack/react-query';

import { licenseCertificatesService } from '@/views/vacancies/services';
import type {
  CreatePendingApiResponse,
  LicenseCertType,
} from '@/views/vacancies/types';

const useAddLicenseCertificateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreatePendingApiResponse,
    Error,
    { type: LicenseCertType; displayValue: string }
  >({
    mutationFn: params =>
      licenseCertificatesService.addLicenseCertificate(params),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['licenses-and-certificates'],
      }),
  });
};

export { useAddLicenseCertificateMutation };
