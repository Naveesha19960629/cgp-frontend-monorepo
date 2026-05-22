import type {
  ApiResponse,
  CreatePendingApiResponse,
  LocationLookupItem,
  LookupItem,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const secondaryEducationService = {
  getSchools: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/schools',
      { params: { search, page, size } }
    );
    return response.data;
  },

  getSchoolLocations: async (
    search: string = '',
    size: number = 50
  ): Promise<ApiResponse<LocationLookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LocationLookupItem[]>>(
      '/locations',
      { params: { search, size } }
    );
    return response.data;
  },

  getExaminations: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/examinations',
      { params: { search, page, size } }
    );
    return response.data;
  },

  getAwardingBodies: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/secondary-awarding-bodies',
      { params: { search, page, size } }
    );
    return response.data;
  },

  getFieldsOfStudy: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/field-of-studies',
      { params: { search, page, size } }
    );
    return response.data;
  },

  addSchool: async (params: {
    displayValue: string;
    locationId?: string;
    url?: string;
  }): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/schools',
      { type: 'SCHOOL', ...params }
    );
    return response.data;
  },

  addExamination: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/examinations',
      { type: 'EXAMINATION', displayValue }
    );
    return response.data;
  },

  addAwardingBody: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/secondary-awarding-bodies',
      { type: 'SECONDARY_AWARDING_BODY', displayValue }
    );
    return response.data;
  },

  addFieldOfStudy: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/field-of-studies',
      { type: 'FIELD_OF_STUDY', displayValue }
    );
    return response.data;
  },
};
