import type { ReactNode } from 'react';

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

/**
 * Preferred-skill payload item: a skill-career-path ref plus the selected level.
 * Matches the backend `SkillCareerPathLevelInput` schema.
 */
interface SkillLevelRef {
  id: string;
  source: string;
  levelId: string;
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

type EntitySourceType = 'MASTER' | 'PENDING' | 'USER_CREATED';

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
  source: EntitySourceType;
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
  source: EntitySourceType;
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
  source: EntitySourceType;
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
  patents?: PreferredPatentsSchema;
  preferredHonoursAwards?: PreferredHonoursAwardsSchema;
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
  fromDate?: Date;
  toDate?: Date;
  isOpen: boolean;
}

interface PreferredPatentsSchema {
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
  issuedDateFrom?: Date | null;
  issuedDateTo?: Date | null;
  associatedOrganizations: HonourOrganizationSchemaType[];
  organizationLocations: HonourLocationSchemaType[];
  isOpen: boolean;
}

interface PreferredHonoursAwardsSchema {
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
  levelId?: string;
  levelName?: string;
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
  vacancyIdHashtag?: string | null;
  baseVacancyId: string;
  vacancyTemplateId?: string | null;
  title: string;
  status: string;
  version: string;
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

interface TemplateDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

interface SimpleDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  titleKey: string;
  descriptionKey: string;
  cancelLabelKey: string;
  confirmLabelKey: string;
}

interface VacancyEditCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

interface TemplateCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

interface SimpleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  titleKey: string;
  descriptionKey: string;
  cancelLabelKey: string;
  confirmLabelKey: string;
  isConfirming?: boolean;
}

interface VacancyRescheduleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isConfirming?: boolean;
}

interface VacancyNoRescheduleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isConfirming?: boolean;
}

type VacancyToggleAction = 'ACTIVATE' | 'DEACTIVATE';

interface VacancyToggleActiveData {
  vacancyId: string;
  status: string;
  isManuallyOnhold: boolean;
}

interface VacancyToggleStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: VacancyToggleAction;
  onConfirm: () => void;
  onSchedule: () => void;
  isToggling?: boolean;
}

interface VacancyOnholdUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPublishDateChanged: boolean;
  hasApplicants: boolean;
  isConfirming?: boolean;
}

// DQCGP-3611: Live vacancy update confirmation — mirrors VacancyOnholdUpdateDialogProps.
// hasApplicants is kept generic (not hardcoded false) so CGP-2550 can pass true later
// without needing to touch this component's shape again.
interface VacancyLiveUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPublishDateChanged: boolean;
  hasApplicants: boolean;
  isConfirming?: boolean;
}

// ─── Applicant Notification (Onhold vacancy with applicants) ────────────────

/** Result of diffing the original vs. edited VacancyForm's applicant-facing sections. */
interface ApplicationFormChanges {
  /** A "Customizable Form" question was added, removed, or edited. */
  hasNewFields: boolean;
  /** Any "preferred value" section (skills, languages, education, etc.) changed. */
  hasUpdatedPreferredValues: boolean;
  /** VacancyForm keys whose content differs from the original snapshot. */
  changedSections: string[];
  /** `section.path` identifiers for the specific fields that differ within changedSections. */
  changedFields: string[];
}

type ApplicationFieldChangeType =
  | 'Added'
  | 'Updated'
  | 'PreferredValuesUpdated';

/** Human-facing description of a single changed application field, derived from ApplicationFormChanges. */
interface ApplicationFieldChange {
  formName: string;
  fieldName: string;
  changeType: ApplicationFieldChangeType;
}

interface NotifyApplicantsPayload {
  vacancyId: string;
  changedSections: string[];
  changedFields: string[];
  publishDateTime: string;
}

interface VacancyTableColumn {
  vacancyId: string;
  vacancyIdHashtag?: string | null;
  title: string;
  jobTitle: string[];
  discipline: string;
  careerPath: string;
  role: string[];
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
  version: string;
  status: string;
  availableActions: string[];
  vacancyLink: string;
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
  onEditJd?: () => void;
  onSaveAsTemplate?: () => void;
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
  onSaveAsTemplate: (vacancyId: string) => void;
  onToggleActive: (vacancyId: string, action: VacancyToggleAction) => void;
  onCopyLink: (vacancyLink: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
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
  disabled?: boolean;
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
  title: string | null;
  associatedOrganizations: MasterRef[];
  organizationLocations: MasterRef[];
  issuedBy: string | null;
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
  acceptedPublisherName: string | null;
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
  positionRoleHeld: string | null;
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
  positionRoleHeld: string | null;
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
  positionRole: string | null;
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
  content: SkillLevelRef[];
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
  /** Set when the vacancy is created from a template, for server-side lineage. */
  templateId?: string;
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

// ── Vacancy Template ────────────────────────────────────────────────────────

/** Whether a template section serialises to a single object or a one-item array. */
type TemplateSectionKind = 'list' | 'single';

interface TemplateFieldConfig {
  /** Backend fieldCode persisted in the template (content map key). */
  code: string;
  /** i18n key for the field label. */
  labelKey: string;
}

interface TemplateSectionConfig {
  /** Section key in the request `data` object. */
  key: string;
  kind: TemplateSectionKind;
  /** i18n key for the section title. */
  titleKey: string;
  fields: TemplateFieldConfig[];
}

/** Local form state for a single template section. */
interface TemplateSectionState {
  dataTakenFromCandidate: boolean;
  /** field code -> whether its toggle is enabled */
  fields: Record<string, boolean>;
}

/**
 * Full local state for the Create Template form. The template name is kept
 * outside this state and managed by the page.
 */
interface TemplateFormState {
  sections: Record<string, TemplateSectionState>;
  /** Customizable Form section (toggle only, no fields). */
  customizableForm: boolean;
}

interface TemplateFieldRequest {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: Record<string, boolean>;
}

interface CustomizableFormSectionRequest {
  isEnabled: boolean;
}

type TemplateSectionData = Record<
  string,
  TemplateFieldRequest | TemplateFieldRequest[] | CustomizableFormSectionRequest
>;

interface CreateVacancyTemplateRequest {
  templateName: string;
  refNumber?: string;
  data: TemplateSectionData;
}

/**
 * Body of PUT /vacancy-templates/{id}. Same section structure as create; the
 * Template ID is in the URL and the reference number is immutable, so neither
 * is included here.
 */
interface UpdateVacancyTemplateRequest {
  templateName: string;
  data: TemplateSectionData;
}

interface NextTemplateName {
  templateName: string;
  refNumber?: string;
}

interface CreatedVacancyTemplate {
  vacancyTemplateId: string;
  templateName: string;
  refNumber: string;
  createdAt?: string;
}

// ── Vacancy Template list (search) ──────────────────────────────────────────

/** Sort direction for the Templates list (maps to the backend `sortOrder`). */
type TemplateSortOrder = 'NEWEST' | 'OLDEST';

interface VacancyTemplateSearchItem {
  vacancyTemplateId: string;
  templateName: string;
  refNumber: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface VacancyTemplateSearchPage {
  content: VacancyTemplateSearchItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  empty: boolean;
}

interface VacancyTemplateQueryParams {
  page?: number;
  size?: number;
  search?: string;
  sortOrder?: TemplateSortOrder;
}

// ── Edit Job Description ────────────────────────────────────────────────────

interface JobDescriptionField {
  fieldKey: string;
  isVisible: boolean;
}

interface JobDescriptionSection {
  sectionKey: string;
  fields: JobDescriptionField[];
}

interface VacancyJobDescription {
  vacancyId: string;
  sections: JobDescriptionSection[];
}

/** Local form state: sectionKey -> fieldKey -> toggle value. */
type JobDescriptionFormState = Record<string, Record<string, boolean>>;

interface JobDescriptionFieldVisibilityUpdate {
  sectionKey: string;
  fieldKey: string;
  isVisible: boolean;
}

interface UpdateVacancyJobDescriptionRequest {
  fields: JobDescriptionFieldVisibilityUpdate[];
}

// ── Use Template (create vacancy from template) ─────────────────────────────

/**
 * Pre-built POST /v1/vacancies skeleton returned by getTemplateById. Each key in
 * `data` is either `null` (section not configured in the template → hide it) or a
 * section object/array whose `content` map holds field-VISIBILITY booleans (true =
 * render that field). `customizedForm` carries actual copied form data. The mapper
 * `toVacancyFormFromTemplateUsePayload` interprets it defensively, so `data` is typed
 * loosely here.
 */
interface VacancyTemplateUseRequestBody {
  title: string;
  status: string;
  lastActiveStep: string;
  templateId: string;
  data: Record<string, unknown>;
}

/** Response payload of GET /vacancy-templates/{id} used in the "Use Template" flow. */
interface VacancyTemplateUseResponse {
  templateId: string;
  templateName: string;
  refNumber: string;
  requestBody: VacancyTemplateUseRequestBody;
}

// ── Save Vacancy as Template (quick save from the vacancy list) ────────────

interface SaveVacancyAsTemplatePayload {
  vacancyId: string;
  templateName: string;
}

interface VacancySaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  onTemplateNameChange: (value: string) => void;
  onConfirm: () => void;
  isSaving?: boolean;
  isTemplateNameLoading?: boolean;
}

// ── Vacancy Version History (Download as PDF) ──────────────────────────────

type VacancyVersionHistoryChangeType =
  | 'STATUS_CHANGED'
  | 'FIELD_VALUE_ADDED'
  | 'FIELD_VALUE_REMOVED'
  | 'FIELD_VALUE_UPDATED'
  | 'VACANCY_CREATED'
  | 'SECTION_ENABLED'
  | 'SECTION_DISABLED';

interface VacancyVersionHistoryChange {
  changeType: VacancyVersionHistoryChangeType;
  sectionName: string;
  fieldName: string;
  oldValue: unknown[] | null;
  newValue: unknown[] | null;
}

interface VacancyVersionHistoryVersion {
  versionNumber: string;
  updatedAt: string;
  updatedBy: string;
  profilePicture: string | null;
  changes: {
    user: VacancyVersionHistoryChange[];
    system: VacancyVersionHistoryChange[];
  };
}

interface VacancyVersionHistoryData {
  vacancyTitle: string;
  status: string;
  createdAt: string;
  createdBy: string;
  lastUpdatedAt: string;
  totalVersions: number;
  versions: VacancyVersionHistoryVersion[];
}

// ── Vacancy Version History — Customizable Forms (DQCGP-2235) ──────────────
// sectionName "Customizable Forms" carries its own object shapes in
// oldValue/newValue (confirmed from real API responses) instead of the
// generic scalar/object-array values every other section uses — narrowed via
// buildCustomFormChangeSummary() in version-history-helpers.ts rather than
// widening VacancyVersionHistoryChange's own oldValue/newValue type.

/** One array item for fieldName "Form" (added/removed) — Figma nodes
 * 4229:229674 / 4229:229703. */
interface CustomFormSummaryItem {
  formTitle: string;
  questionCount: number;
}

/** `value` is overloaded by fieldName: question text, a type enum, an
 * option value, or a linear-scale number/label. `questionText` is populated
 * only when the item needs to reference an EXISTING question in its header
 * (Option / Option Value / Required / Linear Scale); it's null when the item
 * itself IS the question (Question Added/Removed/Text Updated). */
interface CustomFormFieldItem {
  formTitle: string;
  questionText: string | null;
  value: string;
  questionType: string | null;
  required: boolean | null;
  changeIndex: number;
}

interface CustomFormQuestionCardData {
  text: string;
  questionType: string | null;
  required: boolean | null;
}

interface CustomFormOptionGroup {
  questionText: string;
  options: string[];
}

interface CustomFormOptionValueGroup {
  questionText: string;
  rows: { before: string; after: string }[];
}

interface CustomFormLinearScaleRow {
  field: 'startValue' | 'endValue' | 'startLabel' | 'endLabel';
  before: string;
  after: string;
}

/** Render-ready shape for one "Customizable Forms" card, built by
 * buildCustomFormChangeSummary() and attached to a VersionHistoryEntry in
 * place of its raw `change` — unlike every other section, one card here can
 * summarize MULTIPLE raw API change entries (Linear Scale merges up to 4) or
 * split one raw entry's array into several per-question groups (Option
 * Added/Removed). */
type CustomFormChangeSummary =
  | { kind: 'formsAdded' | 'formsRemoved'; forms: CustomFormSummaryItem[] }
  | {
      kind: 'questionsAdded' | 'questionsRemoved';
      formTitle: string;
      questions: CustomFormQuestionCardData[];
    }
  | {
      kind: 'questionTextUpdated';
      formTitle: string;
      before: string;
      after: string;
    }
  | {
      kind: 'questionTypeUpdated';
      formTitle: string;
      questionText: string;
      before: string; // raw type enum, resolved to a label at render time
      after: string;
    }
  | {
      kind: 'optionsAdded' | 'optionsRemoved';
      formTitle: string;
      groups: CustomFormOptionGroup[];
    }
  | {
      kind: 'optionValueUpdated';
      formTitle: string;
      groups: CustomFormOptionValueGroup[];
    }
  | {
      kind: 'requiredToggleChanged';
      formTitle: string;
      questionText: string;
      before: boolean;
      after: boolean;
    }
  | {
      kind: 'linearScaleUpdated';
      formTitle: string;
      questionText: string;
      rows: CustomFormLinearScaleRow[];
    };

/** A single item in the "added/removed/updated N items" box grid — shared by
 * the PDF generator and the on-screen Activity Log (see
 * utils/version-history-helpers.ts). */
interface VersionHistoryGridItem {
  title: string;
  subtitle?: string;
}

/** All of a version's VACANCY_CREATED sub-fields (Title/Status/Schedule
 * Date/Expiration Date) combined into the single card Figma shows (nodes
 * 4229:230488 "Scheduled for publishing" / 4229:230451 "Saved as {status}")
 * instead of one card per field. The API itself sends these as 4 SEPARATE
 * flat VACANCY_CREATED entries (confirmed from a real response) — there is
 * no combined entry shape to read this from directly, so it's assembled at
 * display time by buildVacancyCreationSummary() in
 * utils/version-history-helpers.ts, only when both `title` and `status` are
 * present (the two pieces both Figma examples require); otherwise a
 * version's VACANCY_CREATED entries fall back to rendering one per field, as
 * they always have. */
interface VacancyCreationSummary {
  title: string;
  status: string;
  scheduleDate: string | null;
  expirationDate: string | null;
}

/** A change entry paired with who made it, ready to render — built by
 * resolveVersionEntries() in utils/version-history-helpers.ts, which both
 * the on-screen Activity Log and the PDF generator call so attribution can
 * never drift between the two renderers. */
interface VersionHistoryEntry {
  change: VacancyVersionHistoryChange;
  /** Display identifier for whoever performed this change — an email/username
   * for user changes, or the literal marker "SYSTEM" for system changes.
   * Resolved to a translated label at render time, not pre-translated. */
  attribution: string;
  /** True only for entries from `changes.system` (automatic, side-effect
   * changes). Checked explicitly rather than by comparing `attribution`
   * against "SYSTEM", so a user whose email merely looks system-ish can
   * never be mislabeled — and so a version whose `updatedBy` is "SYSTEM"
   * still renders its user changes as user changes. */
  isSystem: boolean;
  updatedAt: string;
  profilePicture: string | null;
  /** Present only when `change.changeType === 'VACANCY_CREATED'` AND this
   * version's creation entries were groupable (see VacancyCreationSummary
   * above) — renderers check this, not `change.changeType` alone, to choose
   * between the combined card and the plain per-field fallback. */
  vacancyCreationSummary?: VacancyCreationSummary;
  /** Present only when `change.sectionName === 'Customizable Forms'` — see
   * CustomFormChangeSummary above. Renderers check this, not `change`
   * directly, since one card here can represent multiple raw API changes. */
  customFormChange?: CustomFormChangeSummary;
}

interface VersionHistorySidebarProps {
  versions: VacancyVersionHistoryVersion[];
  selectedVersionNumber: string;
  onSelectVersion: (versionNumber: string) => void;
  /** Fallback actor for versions recorded with `updatedBy: "SYSTEM"` — see
   * resolveVersionActor() in utils/version-history-helpers.ts. */
  createdBy: string;
}

interface VersionHistoryActivityLogProps {
  version: VacancyVersionHistoryVersion | undefined;
  createdBy: string;
}

interface VersionHistoryChangeEntryProps {
  entry: VersionHistoryEntry;
}

interface VersionHistoryStatusPillProps {
  status: string;
  className?: string;
}

interface VersionHistoryValueBoxGridProps {
  items: VersionHistoryGridItem[];
  variant: 'added' | 'removed' | 'updated';
}

/** Plain multi-select values (Causes, Skills, Industries…) render as chips
 * rather than the bordered box grid used for object-shaped values. */
interface VersionHistoryChipListProps {
  items: string[];
}

/** The "{Section Name - X} │ {Added} {New 2 Schools}" header line above a
 * change's values. `verb` takes the variant's accent colour; `detail` stays
 * slate — see VersionHistoryChangeSummary. */
interface VersionHistoryChangeSummaryProps {
  sectionName: string;
  verb: string;
  detail?: string;
  variant: 'added' | 'removed' | 'updated';
}

/** A field-value update with both a before and an after: rendered as two
 * side-by-side boxes joined by an arrow (Figma node 4229:229804) rather than
 * the compact single-line InlineDiffRow reserved for short vacancy-level
 * fields (status, title, schedule/expiration dates). */
interface VersionHistoryScalarDiffProps {
  field: string;
  // ReactNode (not just string) so Required Toggle Changed can pass a
  // VersionHistoryToggleSwitch in place of plain text (DQCGP-2235).
  before: ReactNode;
  after: ReactNode;
}

/** The on/off switch drawn for a SECTION_ENABLED change (Figma node
 * 4229:229289) — mirrors renderToggleSwitch in utils/version-history-pdf.ts.
 * `size` defaults to the SECTION_ENABLED toggle's own 48x28 ("lg"); the
 * Customizable Forms "Required Toggle Changed" card (Figma node 4229:229985)
 * is a visibly smaller 48x24 toggle, passed explicitly as "md". */
interface VersionHistoryToggleSwitchProps {
  isOn: boolean;
  size?: 'md' | 'lg';
}

/** The checkbox drawn for a "Data Taken From Candidate" change (Figma node
 * 6536:91081) — mirrors renderCheckboxIndicator in
 * utils/version-history-pdf.ts. A distinct indicator from
 * VersionHistoryToggleSwitch: this field arrives as a plain
 * FIELD_VALUE_UPDATED (not its own changeType) and Figma draws it as a
 * checkbox, not a toggle switch. */
interface VersionHistoryCheckboxIndicatorProps {
  isChecked: boolean;
}

export type {
  CreateVacancyPayload,
  TemplateSectionKind,
  TemplateFieldConfig,
  TemplateSectionConfig,
  TemplateSectionState,
  TemplateFormState,
  TemplateFieldRequest,
  CustomizableFormSectionRequest,
  TemplateSectionData,
  CreateVacancyTemplateRequest,
  UpdateVacancyTemplateRequest,
  NextTemplateName,
  CreatedVacancyTemplate,
  TemplateSortOrder,
  VacancyTemplateSearchItem,
  VacancyTemplateSearchPage,
  VacancyTemplateQueryParams,
  JobDescriptionField,
  JobDescriptionSection,
  VacancyJobDescription,
  JobDescriptionFormState,
  JobDescriptionFieldVisibilityUpdate,
  UpdateVacancyJobDescriptionRequest,
  VacancyTemplateUseRequestBody,
  VacancyTemplateUseResponse,
  SaveVacancyAsTemplatePayload,
  VacancySaveAsTemplateDialogProps,
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
  PreferredPatentsSchema,
  PatentEntrySchemaType,
  PatentIndustrySchemaType,
  PatentStatusSchemaType,
  PreferredHonoursAwardsSchema,
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
  VacancyVersionHistoryChangeType,
  VacancyVersionHistoryChange,
  VacancyVersionHistoryVersion,
  VacancyVersionHistoryData,
  VersionHistoryGridItem,
  VacancyCreationSummary,
  CustomFormSummaryItem,
  CustomFormFieldItem,
  CustomFormQuestionCardData,
  CustomFormOptionGroup,
  CustomFormOptionValueGroup,
  CustomFormLinearScaleRow,
  CustomFormChangeSummary,
  VersionHistoryEntry,
  VersionHistorySidebarProps,
  VersionHistoryActivityLogProps,
  VersionHistoryChangeEntryProps,
  VersionHistoryStatusPillProps,
  VersionHistoryValueBoxGridProps,
  VersionHistoryChipListProps,
  VersionHistoryChangeSummaryProps,
  VersionHistoryScalarDiffProps,
  VersionHistoryToggleSwitchProps,
  VersionHistoryCheckboxIndicatorProps,
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
  TemplateCancelDialogProps,
  SimpleConfirmDialogProps,
  SimpleDeleteConfirmDialogProps,
  VacancyRescheduleConfirmDialogProps,
  VacancyNoRescheduleConfirmDialogProps,
  VacancyToggleAction,
  VacancyToggleActiveData,
  VacancyToggleStatusDialogProps,
  VacancyOnholdUpdateDialogProps,
  VacancyLiveUpdateDialogProps,
  ApplicationFormChanges,
  ApplicationFieldChangeType,
  ApplicationFieldChange,
  NotifyApplicantsPayload,
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
  TemplateDeleteDialogProps,
};
