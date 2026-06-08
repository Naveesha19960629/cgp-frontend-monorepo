import type { useReactTable } from '@tanstack/react-table';

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
  description?: string;
}

// ─── Job Requirement Lookup Items ─────────────────────────────────────────────

interface DisciplineItem {
  id: string;
  label: string;
  source: string;
}

interface RoleItem {
  id: string;
  label: string;
  source: string;
}

interface JobTitleItem {
  id: string;
  label: string;
  source: string;
}

interface EmploymentTypeItem {
  id: string;
  label: string;
  source: string;
}

interface WorkScheduleItem {
  id: string;
  label: string;
  source: string;
}

interface EngagementModelItem {
  id: string;
  label: string;
  source: string;
}

interface JobLevelItem {
  id: string;
  name: string;
}

interface MasterRef {
  id: string;
  source: string;
}

interface CreateCareerPathPayload {
  displayValue: string;
  discipline?: MasterRef;
}

interface CreateRolePayload {
  displayValue: string;
  careerPath?: MasterRef;
  level?: MasterRef;
}

interface JobRequirementFormOption {
  value: string;
  label: string;
  source: string;
}

interface StepDisableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

interface Address {
  city: SelectOption;
  stateProvince: SelectOption;
  country: SelectOption;
  postalCode: string;
  isOpen: boolean;
}

interface ProfileRequirements {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  gender: SelectOption;
  maritalStatus: SelectOption;
  addresses: Address[];
}

// ─── Marital Status ───────────────────────────────────────────────────────────

interface MaritalStatusItem {
  id: string;
  label: string;
  source: string;
}

// ─── Places ───────────────────────────────────────────────────────────────────

interface PlaceItem {
  id: string;
  label: string;
}

interface PlaceCityResult {
  city: PlaceItem;
  state?: PlaceItem;
  country: PlaceItem;
}

interface PlaceStateResult {
  state: PlaceItem;
  country: PlaceItem;
}

interface PlaceCountryResult {
  country: PlaceItem;
}

interface PlacesApiResponse<T> {
  requestId: string;
  success: boolean;
  message: string;
  data: T[];
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

// ─── License and Certificates ─────────────────────────────────────────────────

type LicenseCertType = 'LICENSE' | 'CERTIFICATION';

interface LicenseCertRef {
  source: 'MASTER' | 'PENDING';
  id: string;
  name?: string;
  type?: LicenseCertType;
}

interface LicenseCertEntry {
  nameOfLicenseCert: LicenseCertRef[];
  issuingOrganization: LicenseCertRef[];
  organizationLocations: LicenseCertRef[];
  internationallyAccepted: boolean;
  issueDate: string;
  expirationDate: string;
}

interface LicenseCertificates {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: LicenseCertEntry[];
}

interface AddLicenseCertDialogProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onAdded: (option: {
    value: string;
    label: string;
    source: string;
    certType: LicenseCertType;
  }) => void;
}

// ─── Schedule Vacancy ───────────────────────────────────────────────────────

interface ScheduleVacancy {
  schedulePublishAt: string; // ISO date string
  expirationAt: string; // ISO date string
}

interface ScheduleVacancyPayload {
  schedulePublishAt: string;
  expirationAt: string;
}

// ─── Vacancy Form ─────────────────────────────────────────────────────────────

interface VacancyForm {
  title: string;
  status: string;
  lastActiveStep: string;
  jobRequirements: JobRequirement[];
  profileRequirements: ProfileRequirements;
  secondaryEducation: SecondaryEducation[];
  tertiaryEducation: TertiaryEducation[];
  preferredSkills?: PreferredSkills;
  preferredLanguages?: PreferredLanguages;
  preferredCauses?: PreferredCauses;
  preferredHobbies?: PreferredHobbies;
  preferredIndustries?: PreferredIndustries;
  patents?: preferredPatentsSchema;
  preferredHonoursAwards?: preferredHonoursAwardsSchema;
  licenseCertificates?: LicenseCertificates[];
  schedule?: ScheduleVacancy;
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
interface IndustryItem {
  id: string;
  label: string;
  source: string;
}

interface SingleApiResponse<T> {
  requestId: string;
  success: boolean;
  message: string;
  data: T;
}

interface IndustryCreateResponse {
  id: string;
  label: string;
  source: string;
}

interface SocietyItem {
  id: string;
  name: string;
  source: string;
}

interface SocietyCreateResponse {
  id: string;
  pendingId?: string;
  name: string;
  source: string;
}

interface SportItem {
  id: string;
  name: string;
  source: string;
}

type PatentStatus = 'PATENT_PENDING' | 'PATENT_ISSUED';

interface PatentIndustryOption {
  value: string;
  label: string;
  source: string;
}

interface PatentStatusOption {
  value: PatentStatus;
  label: string;
}

interface PatentIndustrySchemaType {
  value: string;
  label: string;
  source: string;
}

interface PatentStatusSchemaType {
  value: 'PATENT_PENDING' | 'PATENT_ISSUED';
  label: string;
}

interface PatentEntrySchemaType {
  relatedIndustries: PatentIndustrySchemaType[];
  statuses: PatentStatusSchemaType[];
  fromDate?: Date | undefined;
  toDate?: Date | undefined;
  isOpen: boolean;
}

interface preferredPatentsSchema {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  patents: PatentEntrySchemaType[];
}

interface HonourOrganizationSchemaType {
  value: string;
  label: string;
  source: string;
}

interface HonourLocationSchemaType {
  value: string;
  label: string;
}

interface HonourEntrySchemaType {
  title: string;
  issuedBy: string;
  issuedDateFrom?: Date | undefined;
  issuedDateTo?: Date | undefined;
  associatedOrganizations: HonourOrganizationSchemaType[];
  organizationLocations: HonourLocationSchemaType[];
  isOpen: boolean;
}

interface preferredHonoursAwardsSchema {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  honoursAndAwards: HonourEntrySchemaType[];
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
  source?: string;
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
  source?: string;
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
  source?: string;
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
  source?: string;
}

interface PreferredHobbies {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  hobbies: HobbyEntry[];
}

// ─── Preferred Industries ─────────────────────────────────────────────────────

interface IndustryEntry {
  id: string;
  label: string;
  source?: string;
}

interface PreferredIndustries {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  industries: IndustryEntry[];
}

interface AddSchoolDialogProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onAdded: (option: {
    value: string;
    label: string;
    source: string;
    locationId?: string;
    url?: string;
  }) => void;
}

interface AddAwardingBodyDialogProps {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onAdded: (option: {
    value: string;
    label: string;
    source: string;
    locationId?: string;
    url?: string;
  }) => void;
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
} // ─── Project ──────────────────────────────────────────────────────────────────

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

// ─── Publication ──────────────────────────────────────────────────────────────

interface PublicationRef {
  source: 'MASTER' | 'PENDING';
  id: string;
}

interface PublicationEntry {
  acceptedPublisher: string;
  publishedDateFrom: string;
  publishedDateTo: string;
}

interface PublicationRequirement {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: PublicationEntry[];
}

interface Publication {
  id: string;
  title: string;
  publisher: string;
  publicationDate: string;
  publicationDateLabel: string;
  coAuthors: string[];
  publicationUrl: string;
  description: string;
  skills: {
    visibleToEveryone: string[];
    hiddenFromPublic: string[];
  };
}

interface PublicationApiData {
  title: string;
  publisher: string;
  publicationDate: string;
  coAuthors: string[];
  publicationUrl: string;
  description: string;
}

interface PublicationResponse<T> {
  message: string[];
  statusCode: number;
  data: T;
}

interface VacancyCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSaveAsDraft: () => void;
}

interface VacancyTableColumn {
  vacancyId: string;
  title: string;
  jobTitle: string;
  discipline: string;
  careerPath: string;
  role: string;
  createdAt: string;
  createdAtLabel: string;
  createdBy: string;
  schedulePublishAt: string;
  schedulePublishAtLabel: string;
  expirationAt: string;
  expirationAtLabel: string;
  applicantCount: number;
  updatedAt: string;
  updatedAtLabel: string;
  updatedBy: string;
  version: number;
  status: string;
  availableActions: string[];
}

interface VacancyFilteringSectionProps {
  search: string;
  onSearchChange: (value: string) => void;
  careerPathFilter: string;
  onCareerPathChange: (value: string) => void;
  disciplineFilter: string;
  onDisciplineChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

interface VacancyQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  careerPath?: string;
  discipline?: string;
  status?: string;
}

interface VacanciesPaginatedData {
  content: VacancyTableColumn[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface VacanciesApiResponse {
  requestId: string;
  success: boolean;
  message: string;
  data: VacanciesPaginatedData;
}
interface DataTableFacetedFilterProps {
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  hideSearch?: boolean;
}

interface VacancyDataTableProps<TData> {
  table: ReturnType<typeof useReactTable<TData>>;
  isLoading?: boolean;
}

interface VacancyTableActionProps {
  vacancy: {
    id: string;
  };
  onVersionHistory?: () => void;
  onMatchCandidate?: () => void;
  onCopyLink?: () => void;
  onMakeACopy?: () => void;
  onEdit?: () => void;
  onEditJD?: () => void;
  onDelete?: () => void;
}

interface SortableHeaderProps {
  label: string;
  columnKey: string;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc' | null;
  onSort: (columnKey: string) => void;
}

interface VacancyTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface CreateColumnsOptions {
  sortBy: string;
  sortOrder: 'asc' | 'desc' | null;
  onSort: (columnKey: string) => void;
  t: (key: string) => string;
}

export type {
  CreateColumnsOptions,
  VacancyTablePaginationProps,
  SortableHeaderProps,
  VacancyTableActionProps,
  VacancyDataTableProps,
  DataTableFacetedFilterProps,
  VacancyFilteringSectionProps,
  AddOrSelectOption,
  SelectOption,
  RoleItem,
  JobTitleItem,
  EmploymentTypeItem,
  WorkScheduleItem,
  EngagementModelItem,
  JobLevelItem,
  MasterRef,
  CreateCareerPathPayload,
  CreateRolePayload,
  JobRequirementFormOption,
  Address,
  JobRequirement,
  ProfileRequirements,
  VacancyForm,
  StepProps,
  VacancyStep,
  GenderItem,
  ApiResponse,
  SingleApiResponse,
  IndustryItem,
  IndustryCreateResponse,
  SocietyItem,
  SocietyCreateResponse,
  SportItem,
  PatentStatus,
  PatentIndustryOption,
  PatentStatusOption,
  StepDisableDialogProps,
  preferredPatentsSchema,
  PatentEntrySchemaType,
  PatentIndustrySchemaType,
  PatentStatusSchemaType,
  preferredHonoursAwardsSchema,
  HonourEntrySchemaType,
  HonourOrganizationSchemaType,
  HonourLocationSchemaType,
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
  LicenseCertType,
  LicenseCertRef,
  LicenseCertEntry,
  LicenseCertificates,
  AddLicenseCertDialogProps,
  StepHeaderProps,
  DisableDialogProps,
  StepFooterProps,
  SkillItem,
  CareerPathItem,
  DisciplineItem,
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
  IndustryEntry,
  PreferredIndustries,
  ProjectRef,
  ProjectEntry,
  ProjectRequirement,
  Project,
  ProjectApiData,
  ProjectResponse,
  PublicationRef,
  PublicationEntry,
  PublicationRequirement,
  Publication,
  PublicationApiData,
  PublicationResponse,
  VacancyCancelDialogProps,
  VacancyTableColumn,
  VacancyQueryParams,
  VacanciesPaginatedData,
  VacanciesApiResponse,
  MaritalStatusItem,
  ScheduleVacancy,
  ScheduleVacancyPayload,
  PlaceItem,
  PlaceCityResult,
  PlaceStateResult,
  PlaceCountryResult,
  PlacesApiResponse,
};
