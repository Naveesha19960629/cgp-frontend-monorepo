interface BreadcrumbItemConfig {
  label: string;
  link?: string;
}

interface BreadcrumbRoute {
  url: string;
  items: BreadcrumbItemConfig[];
}

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
}

interface RouteError {
  status?: number;
  statusText?: string;
  message?: string;
  data?: string;
}

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  firstName: string;
  lastName: string;
  givenName: string;
  familyName: string;
  preferredUsername: string;
  salutation?: string;
  phoneNumber?: string;
  picture?: string;
}

export type {
  BreadcrumbItemConfig,
  BreadcrumbRoute,
  UserContextValue,
  RouteError,
  User,
};
