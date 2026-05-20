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

interface VacancyForm {
  title: string;
  status: string;
  lastActiveStep: string;
  jobRequirements: JobRequirement[];
  profileRequirements: ProfileRequirements[];
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

interface PageContent<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface GendersData {
  type: string;
  items: PageContent<GenderItem>;
}

interface GendersResponse {
  requestId: string;
  success: boolean;
  message: string;
  data: GendersData;
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
  PageContent,
  GendersData,
  GendersResponse,
};
