import type {
  ApiResponse,
  CreatePendingApiResponse,
  LocationLookupItem,
  LookupItem,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const tertiaryEducationService = {
  // ── GET master data ──────────────────────────────────────────────────────

  getQualifications: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/qualifications',
      { params: { search, page, size } }
    );
    return response.data;
  },

  getTertiaryAwardingBodies: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/tertiary-awarding-bodies',
      { params: { search, page, size } }
    );
    return response.data;
  },

  getTertiaryAwardingBodyLocations: async (
    search: string = '',
    size: number = 50
  ): Promise<ApiResponse<LocationLookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LocationLookupItem[]>>(
      '/locations',
      { params: { search, size } }
    );
    return response.data;
  },

  getLevelOfQualifications: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/level-of-qualifications',
      { params: { search, page, size } }
    );
    return response.data;
  },

  getSpecializations: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/specializations',
      { params: { search, page, size } }
    );
    return response.data;
  },

  getStudyModes: async (
    page: number = 0,
    size: number = 50
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/type-of-study-modes',
      { params: { page, size } }
    );
    return response.data;
  },

  getStudyPatterns: async (
    page: number = 0,
    size: number = 50
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/study-patterns',
      { params: { page, size } }
    );
    return response.data;
  },

  getDeliverySchedules: async (
    page: number = 0,
    size: number = 50
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/delivery-schedules',
      { params: { page, size } }
    );
    return response.data;
  },

  getBatches: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/batches',
      { params: { search, page, size } }
    );
    return response.data;
  },

  getDepartments: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/departments',
      { params: { search, page, size } }
    );
    return response.data;
  },

  getFaculties: async (
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<LookupItem[]>> => {
    const response = await httpClient.get<ApiResponse<LookupItem[]>>(
      '/faculties',
      { params: { search, page, size } }
    );
    return response.data;
  },

  // ── POST (add pending) ───────────────────────────────────────────────────

  addQualification: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/qualifications',
      { type: 'QUALIFICATION', displayValue }
    );
    return response.data;
  },

  addTertiaryAwardingBody: async (params: {
    displayValue: string;
    locationId?: string;
    url?: string;
  }): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/tertiary-awarding-bodies',
      { type: 'TERTIARY_AWARDING_BODY', ...params }
    );
    return response.data;
  },

  addLevelOfQualification: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/level-of-qualifications',
      { type: 'LEVEL_OF_QUALIFICATION', displayValue }
    );
    return response.data;
  },

  addSpecialization: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/specializations',
      { type: 'SPECIALIZATION', displayValue }
    );
    return response.data;
  },

  addBatch: async (displayValue: string): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/batches',
      { type: 'BATCH', displayValue }
    );
    return response.data;
  },

  addDepartment: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/departments',
      { type: 'DEPARTMENT', displayValue }
    );
    return response.data;
  },

  addFaculty: async (
    displayValue: string
  ): Promise<CreatePendingApiResponse> => {
    const response = await httpClient.post<CreatePendingApiResponse>(
      '/faculties',
      { type: 'FACULTY', displayValue }
    );
    return response.data;
  },
};
