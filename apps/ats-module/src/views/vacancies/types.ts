interface AddOrSelectOption {
  source: string;
  id: string;
  label: string;
}

interface SelectOption {
  id: string;
  label: string;
}

interface JobRequirement {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  discipline: AddOrSelectOption[];
  careerPath: AddOrSelectOption[];
  level: AddOrSelectOption[];
  role: AddOrSelectOption[];
  jobTitle: AddOrSelectOption[];
  employmentType: AddOrSelectOption[];
  workSchedule: AddOrSelectOption[];
  engagementModel: AddOrSelectOption[];
}

interface Address {
  cityRefId: string;
  stateRefId: string;
  countryRefId: string;
  postalCode: string;
}

interface ProfileRequirements {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  gender: SelectOption;
  materialStatus: SelectOption;
  address: Address[];
}

// ─── Secondary Education ──────────────────────────────────────────────────────

interface LookupItem {
  id: string;
  label: string;
  source: 'MASTER' | 'PENDING';
}

interface LocationLookupItem {
  id: string;
  label: string;
}

interface SecondaryEducationRef {
  source: 'MASTER' | 'PENDING';
  id: string;
  name?: string;
}

interface SecondaryEducationEntry {
  acceptsHomeSchooling: boolean;
  schools: SecondaryEducationRef[];
  schoolLocations: SecondaryEducationRef[];
  examinations: SecondaryEducationRef[];
  secondaryAwardingBody: SecondaryEducationRef[];
  fieldsOfStudy: SecondaryEducationRef[];
  grade: string;
  startDate: string;
  endDate: string;
  result: string;
}

interface SecondaryEducation {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: SecondaryEducationEntry[];
}

interface CreatePendingItemResponse {
  pendingId: string;
  type: string;
  value: string;
  status: 'PENDING';
}

interface CreatePendingApiResponse {
  requestId: string;
  success: boolean;
  message: string;
  data: CreatePendingItemResponse;
}

// ─── Vacancy Form ─────────────────────────────────────────────────────────────

interface VacancyForm {
  title: string;
  status: string;
  lastActiveStep: string;
  jobRequirements: JobRequirement[];
  profileRequirements: ProfileRequirements[];
  secondaryEducation: SecondaryEducation[];
}
interface VacancyStep {
  readonly key: string;
  readonly label: string;
  readonly component: React.ComponentType<StepProps>;
}
interface StepProps {
  onNext: (data?: Partial<VacancyForm>) => void;
  onBack: () => void;
  onSubmit: () => void;
}

interface GenderItem {
  id: string;
  label: string;
  source: string;
}

interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

interface ApiResponse<T> {
  requestId: string;
  success: boolean;
  message: string;
  data: {
    type: string;
    items: {
      content: T;
      empty: boolean;
      first: boolean;
      last: boolean;
      number: number;
      numberOfElements: number;
      size: number;
      totalElements: number;
      totalPages: number;
      pageable: {
        offset: number;
        pageNumber: number;
        pageSize: number;
        paged: boolean;
        unpaged: boolean;
        sort: Sort;
      };
      sort: Sort;
    };
  };
}
export type {
  AddOrSelectOption,
  SelectOption,
  Address,
  JobRequirement,
  ProfileRequirements,
  VacancyForm,
  StepProps,
  VacancyStep,
  GenderItem,
  ApiResponse,
  LookupItem,
  LocationLookupItem,
  SecondaryEducationRef,
  SecondaryEducationEntry,
  SecondaryEducation,
  CreatePendingItemResponse,
  CreatePendingApiResponse,
};
