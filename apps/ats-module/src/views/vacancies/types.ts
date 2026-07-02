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
  name?: string;
  label?: string;
  source?: string;
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
  cancelLabel?: string;
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

// ─── Vacancy Filter Options ───────────────────────────────────────────────────

interface VacancyFilterOption {
  id: string;
  label: string;
}

interface VacancyFilterOptionsData {
  disciplines: VacancyFilterOption[];
  careerPaths: VacancyFilterOption[];
  statuses: VacancyFilterOption[];
}

interface VacancyFilterOptionsApiResponse {
  requestId: string;
  success: boolean;
  message: string;
  data: VacancyFilterOptionsData;
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
  source: 'MASTER' | 'PENDING' | 'USER_CREATED';
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
  source: 'MASTER' | 'PENDING' | 'USER_CREATED';
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

type LicenseCertType = 'LICENSE' | 'CERTIFICATION' | 'CERTIFICATE';

interface LicenseCertRef {
  source: 'MASTER' | 'PENDING' | 'USER_CREATED';
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
  schedulePublishAt: string | null;
  expirationAt: string | null;
}

// ─── Customizable Form ──────────────────────────────────────────────────────

interface CustomizableFormQuestionOption {
  id: number;
  value: string;
}

interface CustomizableFormQuestion {
  id: number;
  text: string;
  type:
    | 'SHORT_ANSWER'
    | 'PARAGRAPH'
    | 'MULTIPLE_CHOICE'
    | 'CHECKBOXES'
    | 'DROPDOWN'
    | 'LINEAR_SCALE'
    | '';
  required: boolean;
  options: CustomizableFormQuestionOption[];
  from: number;
  to: number;
  startLabel: string;
  endLabel: string;
}

interface CustomizableFormFormCard {
  id: number;
  title: string;
  questions: CustomizableFormQuestion[];
}

interface CustomizableFormData {
  isEnabled: boolean;
  sectionTitle: string;
  forms: CustomizableFormFormCard[];
}

// ─── Step Form States (wizard context persistence) ───────────────────────────

interface OptionWithSource {
  value: string;
  label: string;
  source: string;
}

interface OptionLabel {
  value: string;
  label: string;
}

interface PublicationFormEntry {
  id: string;
  isOpen: boolean;
  acceptedPublisher: string;
  publishedDateFrom?: string;
  publishedDateTo?: string;
  openDatePopover?: 'publishedDateFrom' | 'publishedDateTo' | null;
}

interface PreferredPublicationsState {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  publications: PublicationFormEntry[];
}

interface ClubSocietyFormEntry {
  id: string;
  isOpen: boolean;
  clubSociety: OptionWithSource[];
  clubSocietySearch: string;
  startDate?: string;
  endDate?: string;
  representedOrganization: OptionWithSource[];
  organizationLocations: OptionLabel[];
  position: string;
}
interface PreferredClubSocietiesState {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  clubSocieties: ClubSocietyFormEntry[];
}

interface SportFormEntry {
  id: string;
  isOpen: boolean;
  sport: OptionWithSource[];
  sportSearch: string;
  levelRepresented: OptionWithSource[];
  representedOrganization: OptionWithSource[];
  organizationLocations: OptionLabel[];
  position: string;
  startDate?: string;
  endDate?: string;
}

interface PreferredSportsState {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  sports: SportFormEntry[];
}

interface VolunteeringFormEntry {
  id: string;
  isOpen: boolean;
  organizationName: OptionWithSource[];
  organizationLocations: OptionLabel[];
  cause: OptionWithSource[];
  causeSearch: string;
  position: string;
  startDate?: string;
  endDate?: string;
  openDatePopover?: 'startDate' | 'endDate' | null;
}

interface PreferredVolunteeringState {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  volunteering: VolunteeringFormEntry[];
}

interface ProjectFormEntry {
  id: string;
  isOpen: boolean;
  startDate?: string;
  endDate?: string;
  relatedIndustry: OptionWithSource[];
  organizationLocations: OptionLabel[];
  organizations: OptionWithSource[];
}

interface ProjectsRequirementsState {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  projects: ProjectFormEntry[];
}

// ─── Vacancy Form ─────────────────────────────────────────────────────────────

interface VacancyForm {
  title: string;
  status: string;
  lastActiveStep: string;
  applicantCount?: number;
  jobRequirements: JobRequirement[];
  profileRequirements: ProfileRequirements;
  secondaryEducation: SecondaryEducation[];
  tertiaryEducation: TertiaryEducation[];
  projectsRequirements?: ProjectsRequirementsState;
  preferredPublications?: PreferredPublicationsState;
  preferredClubSocieties?: PreferredClubSocietiesState;
  preferredSports?: PreferredSportsState;
  preferredVolunteering?: PreferredVolunteeringState;
  preferredSkills?: PreferredSkills;
  preferredLanguages?: PreferredLanguages;
  preferredCauses?: PreferredCauses;
  preferredHobbies?: PreferredHobbies;
  preferredIndustries?: PreferredIndustries;
  patents?: preferredPatentsSchema;
  preferredHonoursAwards?: preferredHonoursAwardsSchema;
  licenseCertificates?: LicenseCertificates[];
  customizableForm?: CustomizableFormData;
  schedule?: ScheduleVacancy;
}
interface VacancyStep {
  readonly key: string;
  readonly label: string;
  readonly component: React.ComponentType<StepProps>;
}
interface StepProps {
  onNext: (data?: Partial<VacancyForm>, completed?: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  mode?: 'create' | 'edit';
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

interface SingleRecordApiResponse<T> {
  requestId: string;
  success: boolean;
  message: string;
  data: T;
}

interface IndustryItem {
  id: string;
  label: string;
  source: string;
}

interface IndustryCreateResponse {
  id: string;
  label: string;
  source: string;
}

interface SocietyItem {
  id: string;
  name?: string;
  label?: string;
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
  name?: string;
  label?: string;
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

// ─── Vacancy Detail (GET /vacancies/:id response) ────────────────────────────

interface VacancyDetailJobRequirementData {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  discipline: AddOrSelectOption | null;
  careerPath: AddOrSelectOption | null;
  level: AddOrSelectOption | null;
  roles: AddOrSelectOption[];
  jobTitles: AddOrSelectOption[];
  employmentTypes: AddOrSelectOption[];
  workSchedules: AddOrSelectOption[];
  engagementModels: AddOrSelectOption[];
  description: string;
}

interface VacancyDetailPatentEntry {
  patentRequirementId: string;
  statuses: PatentStatus[];
  fromDate: string;
  toDate: string;
  relatedIndustry: AddOrSelectOption[];
}

interface VacancyDetailData {
  vacancyId: string;
  baseVacancyId: string;
  title: string;
  status: string;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  applicantCount: number;
  lastActiveStep: string;
  jobRequirement: VacancyDetailJobRequirementData;
  skills: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    skills: AddOrSelectOption[];
  };
  languages: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    languages: AddOrSelectOption[];
  };
  industry: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    industries: AddOrSelectOption[];
  };
  causes: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    causes: AddOrSelectOption[];
  };
  patents: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    patents: VacancyDetailPatentEntry[];
  };
  honoursAndAwards: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    honoursAndAwards: unknown[];
  };
  projects: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    projects: unknown[];
  };
  clubsAndSocieties: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    clubsAndSocieties: unknown[];
  };
  sports: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    sports: unknown[];
  };
  volunteering: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    volunteering: unknown[];
  };
  publications: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    publications: unknown[];
  };
  customizedForm: {
    isEnabled: boolean;
    sectionTitle: string | null;
    forms: unknown[];
  };
  hobbyList: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    hobbyList: unknown[];
  };
  secondaryEducation: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    secondaryEducation: unknown[];
  };
  tertiaryEducation: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    tertiaryEducation: unknown[];
  };
  licensesAndCertifications: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    licensesAndCertifications: unknown[];
  };
  scheduleRequirement: {
    schedulePublishAt: string;
    expirationAt: string;
  } | null;
  profileRequirement: {
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    gender: AddOrSelectOption | null;
    maritalStatus: AddOrSelectOption | null;
    addresses: Address[];
  };
}

interface VacancyCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSaveAsDraft: () => void;
  isSavingDraft?: boolean;
}

interface VacancyDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

interface VacancyEditCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
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
  onRowClick?: (row: TData) => void;
}

interface VacancyTableActionProps {
  vacancy: {
    id: string;
    status: string;
    applicantCount: number;
    availableActions?: string[];
  };
  onVersionHistory?: () => void;
  onMatchCandidate?: () => void;
  onCopyLink?: () => void;
  onMakeACopy?: () => void;
  onEdit?: () => void;
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
  onView: (vacancyId: string) => void;
  onEdit: (vacancyId: string) => void;
  onDelete: (vacancyId: string) => void;
  onMakeACopy: (vacancyId: string) => void;
  t: (key: string) => string;
}

interface VacancyViewJobRequirement {
  discipline: string[];
  careerPath: string[];
  level: string[];
  role: string[];
  jobTitle: string[];
  employmentType: string[];
  workSchedule: string[];
  engagementModel: string[];
  description: string;
}

interface VacancyViewProfileRequirement {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  gender: string;
  maritalStatus: string;
  addresses: {
    city: string;
    stateProvince: string;
    country: string;
    postalCode: string;
  }[];
}

interface VacancyViewSecondaryEducation {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: {
    acceptsHomeSchooling: boolean;
    schools: string[];
    schoolLocations: string[];
    examinations: string[];
    secondaryAwardingBody: string[];
    fieldsOfStudy: string[];
    grade: string;
    startDate: string;
    endDate: string;
    result: string;
  }[];
}

interface VacancyViewTertiaryEducation {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: {
    qualificationName: string[];
    tertiaryAwardingBody: string[];
    tertiaryAwardingBodyLocations: string[];
    levelOfQualification: string[];
    specialization: string[];
    studyMode: string[];
    studyPattern: string[];
    deliverySchedule: string[];
    batch: string[];
    department: string[];
    faculty: string[];
    grade: string;
  }[];
}

interface VacancyViewLicenseCertificates {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: {
    nameOfLicenseCert: string[];
    issuingOrganization: string[];
    organizationLocations: string[];
    internationallyAccepted: boolean;
    issueDate: string;
    expirationDate: string;
  }[];
}

interface VacancyViewPublications {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: {
    acceptedPublisherName: string;
    publishedDateFrom: string;
    publishedDateTo: string;
  }[];
}

interface VacancyViewClubSocieties {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: {
    clubSociety: string[];
    organization: string[];
    organizationLocations: string[];
    positionRoleHeld: string;
    startDate: string;
    endDate: string;
  }[];
}

interface VacancyViewSports {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: {
    nameOfSport: string[];
    representedOrganization: string[];
    organizationLocations: string[];
    levelRepresented: string[];
    positionRoleHeld: string;
    startDate: string;
    endDate: string;
  }[];
}

interface VacancyViewVolunteering {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: {
    organization: string[];
    organizationLocations: string[];
    positionRole: string;
    cause: string[];
    startDate: string;
    endDate: string;
  }[];
}

interface VacancyViewProjects {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: {
    startDate: string;
    endDate: string;
    relatedIndustry: string[];
    organizationLocations: string[];
    organization: string[];
  }[];
}

interface VacancyViewHonoursAwards {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: {
    title: string;
    associatedOrganizations: string[];
    organizationLocations: string[];
    issuedBy: string;
    issuedFromDate: string;
    issuedToDate: string;
  }[];
}

interface VacancyViewPatentEntry {
  relatedIndustry: string[];
  statuses: string[];
  fromDate: string;
  toDate: string;
}

interface VacancyViewPreferredPatents {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: VacancyViewPatentEntry[];
}

interface VacancyViewSkills {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: string[];
}

interface VacancyViewLanguages {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: string[];
}

interface VacancyViewCauses {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: string[];
}

interface VacancyViewHobbies {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: string[];
}

interface VacancyViewIndustries {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: string[];
}

interface VacancyViewScheduledVacancy {
  schedulePublishAt: string;
  expirationAt: string;
  vacancyLink: string;
}

interface VacancyViewCustomizableFormQuestion {
  text: string;
  type:
    | 'SHORT_ANSWER'
    | 'PARAGRAPH'
    | 'MULTIPLE_CHOICE'
    | 'CHECKBOXES'
    | 'DROPDOWN'
    | 'LINEAR_SCALE'
    | '';
  required: boolean;
  options: string[];
  scaleFrom: number;
  scaleTo: number;
  startLabel: string;
  endLabel: string;
}

interface VacancyViewCustomizableFormCard {
  title: string;
  questions: VacancyViewCustomizableFormQuestion[];
}

interface VacancyViewCustomizableForm {
  isEnabled: boolean;
  sectionTitle: string;
  forms: VacancyViewCustomizableFormCard[];
}

interface VacancyViewModel {
  title: string;
  status: string;
  applicantCount: number;
  jobRequirement: VacancyViewJobRequirement;
  profileRequirement: VacancyViewProfileRequirement;
  scheduledVacancy?: VacancyViewScheduledVacancy;
  customizableForm?: VacancyViewCustomizableForm;
  secondaryEducation?: VacancyViewSecondaryEducation;
  tertiaryEducation?: VacancyViewTertiaryEducation;
  licenseCertificates?: VacancyViewLicenseCertificates;
  preferredPublications?: VacancyViewPublications;
  preferredClubSocieties?: VacancyViewClubSocieties;
  preferredSports?: VacancyViewSports;
  preferredVolunteering?: VacancyViewVolunteering;
  preferredProjects?: VacancyViewProjects;
  preferredHonoursAwards?: VacancyViewHonoursAwards;
  preferredPatents?: VacancyViewPreferredPatents;
  preferredSkills?: VacancyViewSkills;
  preferredLanguages?: VacancyViewLanguages;
  preferredCauses?: VacancyViewCauses;
  preferredHobbies?: VacancyViewHobbies;
  preferredIndustries?: VacancyViewIndustries;
}

interface VacancyActiveToggleProps {
  isActive: boolean;
  onToggle?: (isActive: boolean) => void;
}

interface StatusConfig {
  bg: string;
  border: string;
  text: string;
  labelKey: string;
}

type VacancyStatus = 'draft' | 'unpublished' | 'live' | 'expired' | 'on_hold';

interface VacancyStatusBadgeProps {
  status: string;
  applicantCount?: number;
}

interface JobRequirementApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  discipline?: MasterRef;
  careerPath?: MasterRef;
  level?: MasterRef;
  roles: MasterRef[];
  jobTitles: MasterRef[];
  employmentTypes?: MasterRef[];
  workSchedules?: MasterRef[];
  engagementModels?: MasterRef[];
  description?: string;
}

interface PatentContentApiPayload {
  statuses?: string[];
  fromDate?: string;
  toDate?: string;
  relatedIndustry: MasterRef[];
}

interface PatentGroupApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: PatentContentApiPayload[];
}

interface HonourContentApiPayload {
  title: string;
  associatedOrganizations: MasterRef[];
  organizationLocations: MasterRef[];
  issuedBy: string;
  issuedFromDate?: string;
  issuedToDate?: string;
}

interface HonoursGroupApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: HonourContentApiPayload[];
}

interface ProjectContentApiPayload {
  relatedIndustry: MasterRef[];
  organization: MasterRef[];
  organizationLocations: MasterRef[];
  startDate: string;
  endDate: string;
}

interface ProjectGroupApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: ProjectContentApiPayload[];
}

interface PublicationContentApiPayload {
  acceptedPublisherName: string;
  publishedDateFrom: string;
  publishedDateTo: string;
}

interface PublicationGroupApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: PublicationContentApiPayload[];
}

interface ClubSocietyContentApiPayload {
  clubSociety: MasterRef[];
  organization: MasterRef[];
  organizationLocations: MasterRef[];
  positionRoleHeld: string;
  startDate: string;
  endDate: string;
}

interface ClubSocietiesGroupApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: ClubSocietyContentApiPayload[];
}

interface SportContentApiPayload {
  nameOfSport: MasterRef[];
  representedOrganization: MasterRef[];
  organizationLocations: MasterRef[];
  levelRepresented: MasterRef[];
  positionRoleHeld: string;
  startDate: string;
  endDate: string;
}

interface SportsGroupApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: SportContentApiPayload[];
}

interface VolunteeringContentApiPayload {
  organization: MasterRef[];
  organizationLocations: MasterRef[];
  positionRole: string;
  cause: MasterRef[];
  startDate: string;
  endDate: string;
}

interface VolunteeringGroupApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: VolunteeringContentApiPayload[];
}

interface CustomizedFormQuestionApiPayload {
  questionText: string;
  questionType: string;
  required: boolean;
  displayOrder: number;
  options?: { value: string; displayOrder: number }[];
  linearScale?: {
    startValue: number;
    endValue: number;
    startLabel: string;
    endLabel: string;
  };
}

interface CustomizedFormApiPayload {
  isEnabled: boolean;
  sectionTitle: string | null;
  forms: {
    title: string;
    displayOrder: number;
    questions: CustomizedFormQuestionApiPayload[];
  }[];
}

interface IndustryApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: MasterRef[];
}

interface SkillsApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: MasterRef[];
}

interface LanguagesApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: MasterRef[];
}

interface CausesApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: MasterRef[];
}

interface HobbiesApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: MasterRef[];
}

interface ProfileRequirementAddressApiPayload {
  cityRefId: string;
  stateRefId: string;
  countryRefId: string;
  postalCode: string;
}

interface ProfileRequirementContentApiPayload {
  gender: string;
  maritalStatus: string;
  addresses: ProfileRequirementAddressApiPayload[];
}

interface ProfileRequirementApiPayload {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: ProfileRequirementContentApiPayload;
}

interface CreateVacancyPayload {
  title: string;
  status: string;
  lastActiveStep: string;
  data: {
    jobRequirement: JobRequirementApiPayload;
    profileRequirement: ProfileRequirementApiPayload[];
    secondaryEducation: VacancyForm['secondaryEducation'];
    tertiaryEducation: VacancyForm['tertiaryEducation'];
    skills: SkillsApiPayload;
    languages: LanguagesApiPayload;
    causes: CausesApiPayload[];
    hobbyList: HobbiesApiPayload[];
    industry: IndustryApiPayload;
    schedule: ScheduleVacancyPayload;
    customizedForm: CustomizedFormApiPayload;
    projects: ProjectGroupApiPayload[];
    publications: PublicationGroupApiPayload[];
    clubsAndSocieties: ClubSocietiesGroupApiPayload[];
    sports: SportsGroupApiPayload[];
    volunteering: VolunteeringGroupApiPayload[];
    patents: PatentGroupApiPayload[];
    honoursAndAwards: HonoursGroupApiPayload[];
    licensesAndCertifications: LicenseCertificates[];
  };
}

export type {
  CreateVacancyPayload,
  JobRequirementApiPayload,
  PatentContentApiPayload,
  PatentGroupApiPayload,
  HonourContentApiPayload,
  HonoursGroupApiPayload,
  ProjectContentApiPayload,
  ProjectGroupApiPayload,
  PublicationContentApiPayload,
  PublicationGroupApiPayload,
  ClubSocietyContentApiPayload,
  ClubSocietiesGroupApiPayload,
  SportContentApiPayload,
  SportsGroupApiPayload,
  VolunteeringContentApiPayload,
  VolunteeringGroupApiPayload,
  CustomizedFormQuestionApiPayload,
  CustomizedFormApiPayload,
  IndustryApiPayload,
  SkillsApiPayload,
  LanguagesApiPayload,
  CausesApiPayload,
  HobbiesApiPayload,
  ProfileRequirementApiPayload,
  ProfileRequirementContentApiPayload,
  ProfileRequirementAddressApiPayload,
  StatusConfig,
  VacancyStatus,
  VacancyStatusBadgeProps,
  VacancyActiveToggleProps,
  CreateColumnsOptions,
  VacancyViewModel,
  VacancyViewScheduledVacancy,
  VacancyViewCustomizableForm,
  VacancyViewCustomizableFormCard,
  VacancyViewCustomizableFormQuestion,
  VacancyViewJobRequirement,
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
  SingleRecordApiResponse,
  PreferredLanguages,
  CauseItem,
  CauseEntry,
  PreferredCauses,
  HobbyItem,
  HobbyEntry,
  PreferredHobbies,
  IndustryEntry,
  PreferredIndustries,
  OptionWithSource,
  OptionLabel,
  PublicationFormEntry,
  PreferredPublicationsState,
  ClubSocietyFormEntry,
  PreferredClubSocietiesState,
  SportFormEntry,
  PreferredSportsState,
  VolunteeringFormEntry,
  PreferredVolunteeringState,
  ProjectFormEntry,
  ProjectsRequirementsState,
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
  VacancyDeleteDialogProps,
  VacancyEditCancelDialogProps,
  VacancyDetailJobRequirementData,
  VacancyDetailPatentEntry,
  VacancyDetailData,
  VacancyTableColumn,
  VacancyQueryParams,
  VacanciesPaginatedData,
  VacanciesApiResponse,
  MaritalStatusItem,
  CustomizableFormQuestionOption,
  CustomizableFormQuestion,
  CustomizableFormFormCard,
  CustomizableFormData,
  ScheduleVacancy,
  ScheduleVacancyPayload,
  PlaceItem,
  PlaceCityResult,
  PlaceStateResult,
  PlaceCountryResult,
  PlacesApiResponse,
  VacancyFilterOption,
  VacancyFilterOptionsData,
  VacancyFilterOptionsApiResponse,
  VacancyViewPatentEntry,
  VacancyViewPreferredPatents,
};
