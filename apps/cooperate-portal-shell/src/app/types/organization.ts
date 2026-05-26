/**
 * Organization-related types for the cooperate portal
 */

export interface LocationOption {
  id: string;
  label: string;
}

export interface PlaceItem {
  id: string;
  label: string;
}

export interface PlaceCityResult {
  city: PlaceItem;
  state?: PlaceItem;
  country: PlaceItem;
}

export interface OrganizationSelectOptions {
  id: string;
  label: string;
  source: 'MASTER' | 'PENDING';
  location?: string;
  organizationWebSite?: string;
}

export interface BackendApiResponse<T> {
  requestId: string;
  success: boolean;
  message: string;
  data: T;
}

export interface ApiResponse<T> {
  requestId: string;
  success: boolean;
  message: string;
  data: {
    items: {
      content: T;
    };
  };
}

export interface MasterDataPendingResponse {
  pendingId: string;
}
