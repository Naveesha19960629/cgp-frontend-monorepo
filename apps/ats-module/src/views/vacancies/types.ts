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

// ─── Tertiary Education ───────────────────────────────────────────────────────

interface TertiaryEducationRef {
  source: 'MASTER' | 'PENDING';
  id: string;
  name?: string;
}

interface TertiaryEducationEntry {
  qualificationName: TertiaryEducationRef[];
  tertiaryAwardingBody: TertiaryEducationRef[];
  tertiaryAwardingBodyLocations: TertiaryEducationRef[];
  levelOfQualification: TertiaryEducationRef[];
  specialization: TertiaryEducationRef[];
  studyMode: TertiaryEducationRef[];
  studyPattern: TertiaryEducationRef[];
  deliverySchedule: TertiaryEducationRef[];
  batch: TertiaryEducationRef[];
  department: TertiaryEducationRef[];
  faculty: TertiaryEducationRef[];
  grade: string;
}

interface TertiaryEducation {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: TertiaryEducationEntry[];
}

// ─── Pending Item ─────────────────────────────────────────────────────────────

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
  tertiaryEducation: TertiaryEducation[];
  preferredSkills?: PreferredSkills;
  preferredLanguages?: PreferredLanguages;
  preferredCauses?: PreferredCauses;
  preferredHobbies?: PreferredHobbies;
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

// ─── Preferred Skills ────────────────────────────────────────────────────────

interface SkillItem {
  id: string;
  label: string;
  source?: string;
}

interface CareerPathItem {
  id: string;
  label: string;
  source?: string;
}

interface SkillCareerPathEntry {
  skillId: string;
  skillName: string;
  careerPathId?: string;
  careerPathName: string;
  displayValue: string;
}

interface PreferredSkills {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  skills: SkillCareerPathEntry[];
}

// ─── Preferred Languages ──────────────────────────────────────────────────────

interface LanguageItem {
  id: string;
  label: string;
  source?: string;
}

interface LanguageEntry {
  id: string;
  label: string;
}

interface PreferredLanguages {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  languages: LanguageEntry[];
}

// ─── Preferred Causes ─────────────────────────────────────────────────────────

interface CauseItem {
  id: string;
  label: string;
  source?: string;
}

interface CauseEntry {
  id: string;
  label: string;
}

interface PreferredCauses {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  causes: CauseEntry[];
}

// ─── Preferred Hobbies ────────────────────────────────────────────────────────

interface HobbyItem {
  id: string;
  label: string;
  source?: string;
}

interface HobbyEntry {
  id: string;
  label: string;
}

interface PreferredHobbies {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  hobbies: HobbyEntry[];
}

interface AddSchoolDialogProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onAdded: (option: AddOrSelectOption) => void;
}

interface AddAwardingBodyDialogProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onAdded: (option: AddOrSelectOption) => void;
}

interface StepHeaderProps {
  title: string;
  isEnabled: boolean;
  onBack: () => void;
  onToggle: () => void;
}

interface DisableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  cancelLabel: string;
  disableLabel: string;
  onCancel: () => void;
  onDisable: () => void;
}

interface StepFooterProps {
  onNext: () => void;
  onCancel: () => void;
}// ─── Project ──────────────────────────────────────────────────────────────────

interface ProjectRef {
  source: 'MASTER' | 'PENDING';
  id: string;
}

interface ProjectEntry {
  relatedIndustry: ProjectRef[];
  organization: ProjectRef[];
  organizationLocations: ProjectRef[];
  startDate: string;
  endDate: string;
}

interface ProjectRequirement {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: ProjectEntry[];
}

interface Project {
  id: string;
  name: string;
  organization: string;
  organizationLocation: string;
  location: string;
  industry: string;
  startDate: string;
  endDate: string;
  durationLabel: string;
  description: string;
  skills: string[];
}

interface ProjectApiData {
  name: string;
  organization: string;
  location: string;
  industry: string;
  startDate: string;
  endDate: string;
  description: string;
  skills: string[];
}

interface ProjectResponse<T> {
  message: string[];
  statusCode: number;
  data: T;
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
  TertiaryEducationRef,
  TertiaryEducationEntry,
  TertiaryEducation,
  AddSchoolDialogProps,
  AddAwardingBodyDialogProps,
  StepHeaderProps,
  DisableDialogProps,
  StepFooterProps,
  SkillItem,
  CareerPathItem,
  SkillCareerPathEntry,
  PreferredSkills,
  LanguageItem,
  LanguageEntry,
  PreferredLanguages,
  CauseItem,
  CauseEntry,
  PreferredCauses,
  HobbyItem,
  HobbyEntry,
  PreferredHobbies,
  ProjectRef,
  ProjectEntry,
  ProjectRequirement,
  Project,
  ProjectApiData,
  ProjectResponse,
};
