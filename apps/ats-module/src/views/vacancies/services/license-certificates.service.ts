import type {
  ApiResponse,
  CreatePendingApiResponse,
  LicenseCertType,
  LookupItem,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export interface LicenseCertLookupItem extends LookupItem {
  type: LicenseCertType;
}

export const licenseCertificatesService = {
  getLicensesAndCertifications: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LicenseCertLookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LicenseCertLookupItem[]>>(
      '/licenses-and-certificates',
      { params: { search, page, size } }
    );
    return response.data;
  },

  addLicenseCertificate: async (params: {
    type: LicenseCertType;
    displayValue: string;
  }): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/licenses-and-certificates',
      params
    );
    return response.data;
  },
};
