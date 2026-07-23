import type {
  AddOrSelectOption,
  CustomizableFormData,
  CustomizableFormFormCard,
  CustomizableFormQuestion,
  JobRequirement,
  LicenseCertRef,
  PatentStatus,
  PreferredHonoursAwardsSchema,
  PreferredPatentsSchema,
  ScheduleVacancy,
  SkillCareerPathEntry,
  VacancyForm,
} from '@/views/vacancies/types';
import { parseLocalDate } from '@/views/vacancies/utils/date-timezone-safe';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// Matches the title input maxLength and the API's 50-character constraint.
// Duplicated vacancies ("Copy of <title>") created before the backend capped
// the prefix can exceed it, so over-long titles are clamped on hydration.
const VACANCY_TITLE_MAX_LENGTH = 50;

function clampVacancyTitle(title: string): string {
  return title.length > VACANCY_TITLE_MAX_LENGTH
    ? title.slice(0, VACANCY_TITLE_MAX_LENGTH)
    : title;
}

function toAddOrSelectOption(ref: unknown): AddOrSelectOption | null {
  if (!isRecord(ref)) {
    return null;
  }

  const id = toSafeString(ref.id);
  const label =
    toSafeString(ref.label) ||
    toSafeString(ref.displayValue) ||
    toSafeString(ref.name) ||
    id;

  if (!id && !label) {
    return null;
  }

  return {
    id,
    source: toSafeString(ref.source) || 'MASTER',
    label,
  };
}

function toOptionArray(input: unknown): AddOrSelectOption[] {
  if (Array.isArray(input)) {
    return input
      .map(item => toAddOrSelectOption(item))
      .filter((item): item is AddOrSelectOption => item !== null);
  }

  const mapped = toAddOrSelectOption(input);
  return mapped ? [mapped] : [];
}

function pickSection(
  source: Record<string, unknown>,
  formKey: string,
  apiKey: string
): unknown {
  const byFormKey = source[formKey];
  if (byFormKey !== undefined) {
    return byFormKey;
  }
  return source[apiKey];
}

// Content is usually nested under `source.content`; older/alternate API
// shapes place it directly under one of `fallbackKeys` instead. Checked in
// order, falling back to an empty array when none match.
function pickRawContent(
  source: Record<string, unknown>,
  ...fallbackKeys: string[]
): unknown[] {
  if (Array.isArray(source.content)) {
    return source.content;
  }

  for (const key of fallbackKeys) {
    if (Array.isArray(source[key])) {
      return source[key] as unknown[];
    }
  }

  return [];
}

function normalizeJobRequirementEntry(entry: unknown): JobRequirement {
  const fallback: JobRequirement = {
    isEnabled: true,
    dataTakenFromCandidate: false,
    discipline: [],
    careerPath: [],
    level: [],
    role: [],
    jobTitle: [],
    employmentType: [],
    workSchedule: [],
    engagementModel: [],
    description: '',
  };

  if (!isRecord(entry)) {
    return fallback;
  }

  const isFormShape =
    Array.isArray(entry.role) ||
    Array.isArray(entry.jobTitle) ||
    Array.isArray(entry.employmentType) ||
    Array.isArray(entry.workSchedule) ||
    Array.isArray(entry.engagementModel);

  return {
    isEnabled:
      typeof entry.isEnabled === 'boolean'
        ? entry.isEnabled
        : fallback.isEnabled,
    dataTakenFromCandidate:
      typeof entry.dataTakenFromCandidate === 'boolean'
        ? entry.dataTakenFromCandidate
        : fallback.dataTakenFromCandidate,
    discipline: toOptionArray(entry.discipline),
    careerPath: toOptionArray(entry.careerPath),
    level: toOptionArray(entry.level),
    role: toOptionArray(isFormShape ? entry.role : entry.roles),
    jobTitle: toOptionArray(isFormShape ? entry.jobTitle : entry.jobTitles),
    employmentType: toOptionArray(
      isFormShape ? entry.employmentType : entry.employmentTypes
    ),
    workSchedule: toOptionArray(
      isFormShape ? entry.workSchedule : entry.workSchedules
    ),
    engagementModel: toOptionArray(
      isFormShape ? entry.engagementModel : entry.engagementModels
    ),
    description:
      typeof entry.description === 'string'
        ? entry.description
        : fallback.description,
  };
}

function normalizeJobRequirementsSection(
  source: Record<string, unknown>,
  fallback: VacancyForm['jobRequirements']
): VacancyForm['jobRequirements'] {
  const rawSection = pickSection(source, 'jobRequirements', 'jobRequirement');

  if (Array.isArray(rawSection)) {
    return rawSection.map(item => normalizeJobRequirementEntry(item));
  }

  if (isRecord(rawSection)) {
    return [normalizeJobRequirementEntry(rawSection)];
  }

  return fallback;
}

function normalizeSelectOption(raw: unknown): { id: string; label: string } {
  if (isRecord(raw)) {
    return {
      id: toSafeString(raw.id),
      label:
        toSafeString(raw.label) ||
        toSafeString(raw.displayValue) ||
        toSafeString(raw.name) ||
        toSafeString(raw.id),
    };
  }
  return { id: '', label: '' };
}

function normalizeAddress(raw: unknown): {
  city: { id: string; label: string };
  stateProvince: { id: string; label: string };
  country: { id: string; label: string };
  postalCode: string;
  isOpen: boolean;
} {
  const empty = { id: '', label: '' };
  if (!isRecord(raw)) {
    return {
      city: empty,
      stateProvince: empty,
      country: empty,
      postalCode: '',
      isOpen: true,
    };
  }

  // GET response shape: { cityRefId, cityLabel, stateRefId, stateLabel, countryRefId, countryLabel, postalCode }
  // Form/POST shape:    { city: { id, label }, stateProvince: { id, label }, country: { id, label }, postalCode }
  const city = isRecord(raw.city)
    ? normalizeSelectOption(raw.city)
    : { id: toSafeString(raw.cityRefId), label: toSafeString(raw.cityLabel) };

  let stateProvince = {
    id: toSafeString(raw.stateRefId),
    label: toSafeString(raw.stateLabel),
  };
  if (isRecord(raw.stateProvince)) {
    stateProvince = normalizeSelectOption(raw.stateProvince);
  } else if (isRecord(raw.state)) {
    stateProvince = normalizeSelectOption(raw.state);
  }

  const country = isRecord(raw.country)
    ? normalizeSelectOption(raw.country)
    : {
        id: toSafeString(raw.countryRefId),
        label: toSafeString(raw.countryLabel),
      };

  return {
    city,
    stateProvince,
    country,
    postalCode: toSafeString(raw.postalCode),
    isOpen: true,
  };
}

function normalizeProfileRequirementsSection(
  source: Record<string, unknown>,
  fallback: VacancyForm['profileRequirements']
): VacancyForm['profileRequirements'] {
  const rawSection = pickSection(
    source,
    'profileRequirements',
    'profileRequirement'
  );

  // The GET response sends profileRequirement as a flat object:
  // { isEnabled, dataTakenFromCandidate, gender: null|{}, maritalStatus: null|{}, addresses: [] }
  // or wrapped in an array from the POST payload shape.
  const entry: unknown = Array.isArray(rawSection) ? rawSection[0] : rawSection;

  if (!isRecord(entry)) {
    return fallback;
  }

  const addresses = Array.isArray(entry.addresses)
    ? entry.addresses.map(normalizeAddress)
    : [];

  return {
    isEnabled:
      typeof entry.isEnabled === 'boolean'
        ? entry.isEnabled
        : fallback.isEnabled,
    dataTakenFromCandidate:
      typeof entry.dataTakenFromCandidate === 'boolean'
        ? entry.dataTakenFromCandidate
        : fallback.dataTakenFromCandidate,
    gender: normalizeSelectOption(entry.gender),
    maritalStatus: normalizeSelectOption(entry.maritalStatus),
    addresses,
  };
}

function normalizeSecondaryEducationSection(
  rawSection: unknown,
  fallback: VacancyForm['secondaryEducation']
): VacancyForm['secondaryEducation'] {
  if (Array.isArray(rawSection)) {
    if (
      rawSection.length === 0 ||
      (isRecord(rawSection[0]) && Array.isArray(rawSection[0].content))
    ) {
      return rawSection.filter(isRecord).map(item => ({
        ...fallback[0],
        ...item,
        content: Array.isArray(item.content) ? item.content : [],
      }));
    }
  }

  if (!isRecord(rawSection)) {
    return fallback;
  }

  let entries: unknown[] = [];
  if (Array.isArray(rawSection.secondaryEducation)) {
    entries = rawSection.secondaryEducation;
  } else if (Array.isArray(rawSection.content)) {
    entries = rawSection.content;
  }

  return [
    {
      isEnabled:
        typeof rawSection.isEnabled === 'boolean'
          ? rawSection.isEnabled
          : (fallback[0]?.isEnabled ?? false),
      dataTakenFromCandidate:
        typeof rawSection.dataTakenFromCandidate === 'boolean'
          ? rawSection.dataTakenFromCandidate
          : (fallback[0]?.dataTakenFromCandidate ?? false),
      content: entries.filter(isRecord).map(item => ({
        acceptsHomeSchooling: Boolean(item.acceptsHomeSchooling),
        schools: normalizeLicenseRefs(item.schools),
        schoolLocations: normalizeLicenseRefs(item.schoolLocations),
        examinations: normalizeLicenseRefs(item.examinations),
        secondaryAwardingBody: normalizeLicenseRefs(item.secondaryAwardingBody),
        fieldsOfStudy: normalizeLicenseRefs(item.fieldsOfStudy),
        grade: toSafeString(item.grade),
        startDate: toSafeString(item.startDate),
        endDate: toSafeString(item.endDate),
        result: toSafeString(item.result),
      })),
    },
  ];
}

function normalizeTertiaryEducationSection(
  rawSection: unknown,
  fallback: VacancyForm['tertiaryEducation']
): VacancyForm['tertiaryEducation'] {
  if (Array.isArray(rawSection)) {
    if (
      rawSection.length === 0 ||
      (isRecord(rawSection[0]) && Array.isArray(rawSection[0].content))
    ) {
      return rawSection.filter(isRecord).map(item => ({
        ...fallback[0],
        ...item,
        content: Array.isArray(item.content) ? item.content : [],
      }));
    }
  }

  if (!isRecord(rawSection)) {
    return fallback;
  }

  let entries: unknown[] = [];
  if (Array.isArray(rawSection.tertiaryEducation)) {
    entries = rawSection.tertiaryEducation;
  } else if (Array.isArray(rawSection.content)) {
    entries = rawSection.content;
  }

  return [
    {
      isEnabled:
        typeof rawSection.isEnabled === 'boolean'
          ? rawSection.isEnabled
          : (fallback[0]?.isEnabled ?? false),
      dataTakenFromCandidate:
        typeof rawSection.dataTakenFromCandidate === 'boolean'
          ? rawSection.dataTakenFromCandidate
          : (fallback[0]?.dataTakenFromCandidate ?? false),
      content: entries.filter(isRecord).map(item => ({
        qualificationName: normalizeLicenseRefs(item.qualificationName),
        tertiaryAwardingBody: normalizeLicenseRefs(item.tertiaryAwardingBody),
        tertiaryAwardingBodyLocations: normalizeLicenseRefs(
          item.tertiaryAwardingBodyLocations
        ),
        levelOfQualification: normalizeLicenseRefs(item.levelOfQualification),
        specialization: normalizeLicenseRefs(item.specialization),
        studyMode: normalizeLicenseRefs(item.studyMode),
        studyPattern: normalizeLicenseRefs(item.studyPattern),
        deliverySchedule: normalizeLicenseRefs(item.deliverySchedule),
        batch: normalizeLicenseRefs(item.batch),
        department: normalizeLicenseRefs(item.department),
        faculty: normalizeLicenseRefs(item.faculty),
        grade: toSafeString(item.grade),
      })),
    },
  ];
}

function readSectionValue(
  rawVacancy: Record<string, unknown>,
  sectionSource: Record<string, unknown>,
  keys: string[]
): unknown {
  for (const key of keys) {
    const inData = sectionSource[key];
    if (inData !== undefined) {
      return inData;
    }

    const inRoot = rawVacancy[key];
    if (inRoot !== undefined) {
      return inRoot;
    }
  }

  return undefined;
}

function normalizeLicenseRefWithType(raw: unknown): LicenseCertRef | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = toSafeString(raw.id);
  const source = toSafeString(raw.source) || 'MASTER';
  if (!id) {
    return null;
  }

  return {
    id,
    source: source as 'MASTER' | 'PENDING' | 'USER_CREATED',
    name:
      toSafeString(raw.name) ||
      toSafeString(raw.label) ||
      toSafeString(raw.displayValue) ||
      id,
    type:
      raw.type === 'LICENSE' ||
      raw.type === 'CERTIFICATION' ||
      raw.type === 'CERTIFICATE'
        ? raw.type
        : undefined,
  };
}

function normalizeLicenseRefs(raw: unknown): LicenseCertRef[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map(item => normalizeLicenseRefWithType(item))
    .filter((item): item is LicenseCertRef => item !== null);
}

function mapLicenseGroup(
  item: Record<string, unknown>,
  fallback: VacancyForm['licenseCertificates']
) {
  const content = Array.isArray(item.content) ? item.content : [];

  return {
    isEnabled:
      typeof item.isEnabled === 'boolean'
        ? item.isEnabled
        : (fallback?.[0]?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof item.dataTakenFromCandidate === 'boolean'
        ? item.dataTakenFromCandidate
        : (fallback?.[0]?.dataTakenFromCandidate ?? false),
    content: content.filter(isRecord).map(entry => ({
      nameOfLicenseCert: normalizeLicenseRefs(entry.nameOfLicenseCert),
      issuingOrganization: normalizeLicenseRefs(entry.issuingOrganization),
      organizationLocations: normalizeLicenseRefs(entry.organizationLocations),
      internationallyAccepted:
        typeof entry.internationallyAccepted === 'boolean'
          ? entry.internationallyAccepted
          : false,
      issueDate: toSafeString(entry.issueDate),
      expirationDate: toSafeString(entry.expirationDate),
    })),
  };
}

function mapLicenseContentOnly(
  contentArray: unknown[],
  fallback: VacancyForm['licenseCertificates'],
  flags?: {
    isEnabled?: unknown;
    dataTakenFromCandidate?: unknown;
  }
) {
  const isEnabled =
    typeof flags?.isEnabled === 'boolean'
      ? flags.isEnabled
      : (fallback?.[0]?.isEnabled ?? true);
  const dataTakenFromCandidate =
    typeof flags?.dataTakenFromCandidate === 'boolean'
      ? flags.dataTakenFromCandidate
      : (fallback?.[0]?.dataTakenFromCandidate ?? false);

  return [
    {
      isEnabled,
      dataTakenFromCandidate,
      content: contentArray.filter(isRecord).map(entry => ({
        nameOfLicenseCert: normalizeLicenseRefs(entry.nameOfLicenseCert),
        issuingOrganization: normalizeLicenseRefs(entry.issuingOrganization),
        organizationLocations: normalizeLicenseRefs(
          entry.organizationLocations
        ),
        internationallyAccepted:
          typeof entry.internationallyAccepted === 'boolean'
            ? entry.internationallyAccepted
            : false,
        issueDate: toSafeString(entry.issueDate),
        expirationDate: toSafeString(entry.expirationDate),
      })),
    },
  ];
}

// True when the first entry of a license/certificate array looks like flat
// "content" rows (has one of the content-item fields) rather than a group
// wrapper — or when the array is empty, since there's nothing to
// disambiguate and it should be treated as flat content.
function isLicenseContentShape(candidate: unknown[]): boolean {
  return (
    candidate.length === 0 ||
    (isRecord(candidate[0]) &&
      (candidate[0].nameOfLicenseCert !== undefined ||
        candidate[0].issuingOrganization !== undefined ||
        candidate[0].organizationLocations !== undefined))
  );
}

// Shared handling for the `licenseCertificates` / `licensesAndCertifications`
// keyed-array shapes: either flat content rows (disambiguated via
// isLicenseContentShape) or a nested section re-normalized recursively.
function resolveLicenseCertificatesFromKeyedArray(
  keyedArray: unknown[],
  rawSection: Record<string, unknown>,
  fallback: VacancyForm['licenseCertificates']
): VacancyForm['licenseCertificates'] {
  if (isLicenseContentShape(keyedArray)) {
    // An empty array has no groups to disambiguate — treat it as flat
    // content so the sibling isEnabled/dataTakenFromCandidate flags
    // (e.g. when dataTakenFromCandidate is true and content is always
    // sent empty) aren't discarded by the recursive call below.
    return mapLicenseContentOnly(keyedArray, fallback, {
      isEnabled: rawSection.isEnabled,
      dataTakenFromCandidate: rawSection.dataTakenFromCandidate,
    });
  }

  return normalizeLicenseCertificatesSection(keyedArray, fallback);
}

function normalizeLicenseCertificatesSection(
  rawSection: unknown,
  fallback: VacancyForm['licenseCertificates']
): VacancyForm['licenseCertificates'] {
  if (Array.isArray(rawSection)) {
    if (
      rawSection.length > 0 &&
      isRecord(rawSection[0]) &&
      (rawSection[0].nameOfLicenseCert !== undefined ||
        rawSection[0].issuingOrganization !== undefined ||
        rawSection[0].organizationLocations !== undefined)
    ) {
      return mapLicenseContentOnly(rawSection, fallback);
    }

    return rawSection
      .filter(isRecord)
      .map(item => mapLicenseGroup(item, fallback));
  }

  if (isRecord(rawSection)) {
    if (Array.isArray(rawSection.licenseCertificates)) {
      return resolveLicenseCertificatesFromKeyedArray(
        rawSection.licenseCertificates,
        rawSection,
        fallback
      );
    }

    if (Array.isArray(rawSection.licensesAndCertifications)) {
      return resolveLicenseCertificatesFromKeyedArray(
        rawSection.licensesAndCertifications,
        rawSection,
        fallback
      );
    }

    if (
      rawSection.nameOfLicenseCert !== undefined ||
      rawSection.issuingOrganization !== undefined ||
      rawSection.organizationLocations !== undefined
    ) {
      return mapLicenseContentOnly([rawSection], fallback, {
        isEnabled: rawSection.isEnabled,
        dataTakenFromCandidate: rawSection.dataTakenFromCandidate,
      });
    }

    return [mapLicenseGroup(rawSection, fallback)];
  }

  return fallback;
}

function normalizeIndustryEntry(raw: unknown): {
  id: string;
  label: string;
  source?: string;
} | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = toSafeString(raw.id);
  const label =
    toSafeString(raw.label) ||
    toSafeString(raw.displayValue) ||
    toSafeString(raw.name) ||
    id;

  if (!id && !label) {
    return null;
  }

  return {
    id,
    label,
    source: toSafeString(raw.source) || 'MASTER',
  };
}

function normalizeIndustryEntries(raw: unknown):
  | {
      id: string;
      label: string;
      source?: string;
    }[]
  | [] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map(item => normalizeIndustryEntry(item))
    .filter(
      (
        item
      ): item is {
        id: string;
        label: string;
        source?: string;
      } => item !== null
    );
}

function normalizeOptionWithSource(raw: unknown): {
  value: string;
  label: string;
  source: string;
} | null {
  if (!isRecord(raw)) {
    return null;
  }

  const value = toSafeString(raw.id) || toSafeString(raw.value);
  const label =
    toSafeString(raw.label) ||
    toSafeString(raw.displayValue) ||
    toSafeString(raw.name) ||
    value;
  const source = toSafeString(raw.source) || 'MASTER';

  if (!value && !label) {
    return null;
  }

  return { value, label, source };
}

function normalizeOptionWithSourceArray(raw: unknown): Array<{
  value: string;
  label: string;
  source: string;
}> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map(item => normalizeOptionWithSource(item))
    .filter(
      (
        item
      ): item is {
        value: string;
        label: string;
        source: string;
      } => item !== null
    );
}

function normalizeOptionLabel(
  raw: unknown
): { value: string; label: string } | null {
  if (!isRecord(raw)) {
    return null;
  }

  const value = toSafeString(raw.id) || toSafeString(raw.value);
  const label =
    toSafeString(raw.label) ||
    toSafeString(raw.displayValue) ||
    toSafeString(raw.name) ||
    value;

  if (!value && !label) {
    return null;
  }

  return { value, label };
}

function normalizeOptionLabelArray(
  raw: unknown
): Array<{ value: string; label: string }> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map(item => normalizeOptionLabel(item))
    .filter(
      (
        item
      ): item is {
        value: string;
        label: string;
      } => item !== null
    );
}

function normalizeProjectsRequirementsSection(
  rawSection: unknown,
  fallback: VacancyForm['projectsRequirements']
): VacancyForm['projectsRequirements'] {
  if (!isRecord(rawSection)) {
    return fallback;
  }

  const projects = Array.isArray(rawSection.projects)
    ? rawSection.projects
    : [];

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    projects: projects.filter(isRecord).map((item, index) => ({
      id:
        toSafeString(item.projectRequirementId) ||
        toSafeString(item.id) ||
        `project-${index + 1}`,
      isOpen: true,
      startDate: toSafeString(item.startDate) || undefined,
      endDate: toSafeString(item.endDate) || undefined,
      relatedIndustry: normalizeOptionWithSourceArray(item.relatedIndustry),
      organizationLocations: normalizeOptionLabelArray(
        item.organizationLocations
      ),
      organizations:
        normalizeOptionWithSourceArray(item.organization).length > 0
          ? normalizeOptionWithSourceArray(item.organization)
          : normalizeOptionWithSourceArray(item.organizations),
    })),
  };
}

function normalizePreferredPublicationsSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredPublications']
): VacancyForm['preferredPublications'] {
  if (!isRecord(rawSection)) {
    return fallback;
  }

  const publications = Array.isArray(rawSection.publications)
    ? rawSection.publications
    : [];

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    publications: publications.filter(isRecord).map((item, index) => ({
      id:
        toSafeString(item.publicationRequirementId) ||
        toSafeString(item.id) ||
        `publication-${index + 1}`,
      isOpen: true,
      acceptedPublisher:
        toSafeString(item.acceptedPublisherName) ||
        toSafeString(item.acceptedPublisher),
      publishedDateFrom: toSafeString(item.publishedDateFrom) || undefined,
      publishedDateTo: toSafeString(item.publishedDateTo) || undefined,
      openDatePopover: null,
    })),
  };
}

function normalizePreferredClubSocietiesSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredClubSocieties']
): VacancyForm['preferredClubSocieties'] {
  if (!isRecord(rawSection)) {
    return fallback;
  }

  let entries: unknown[] = [];
  if (Array.isArray(rawSection.clubsAndSocieties)) {
    entries = rawSection.clubsAndSocieties;
  } else if (Array.isArray(rawSection.clubSocieties)) {
    entries = rawSection.clubSocieties;
  }

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    clubSocieties: entries.filter(isRecord).map((item, index) => ({
      id:
        toSafeString(item.clubSocietyRequirementId) ||
        toSafeString(item.id) ||
        `club-${index + 1}`,
      isOpen: true,
      clubSociety: normalizeOptionWithSourceArray(item.clubSociety),
      clubSocietySearch: '',
      startDate: toSafeString(item.startDate) || undefined,
      endDate: toSafeString(item.endDate) || undefined,
      representedOrganization:
        normalizeOptionWithSourceArray(item.organization).length > 0
          ? normalizeOptionWithSourceArray(item.organization)
          : normalizeOptionWithSourceArray(item.representedOrganization),
      organizationLocations: normalizeOptionLabelArray(
        item.organizationLocations
      ),
      position:
        toSafeString(item.positionRoleHeld) || toSafeString(item.position),
    })),
  };
}

function normalizePreferredSportsSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredSports']
): VacancyForm['preferredSports'] {
  if (!isRecord(rawSection)) {
    return fallback;
  }

  const entries = Array.isArray(rawSection.sports) ? rawSection.sports : [];

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    sports: entries.filter(isRecord).map((item, index) => ({
      id:
        toSafeString(item.sportRequirementId) ||
        toSafeString(item.id) ||
        `sport-${index + 1}`,
      isOpen: true,
      sport:
        normalizeOptionWithSourceArray(item.nameOfSport).length > 0
          ? normalizeOptionWithSourceArray(item.nameOfSport)
          : normalizeOptionWithSourceArray(item.sport),
      sportSearch: '',
      levelRepresented: normalizeOptionWithSourceArray(item.levelRepresented),
      representedOrganization:
        normalizeOptionWithSourceArray(item.representedOrganization).length > 0
          ? normalizeOptionWithSourceArray(item.representedOrganization)
          : normalizeOptionWithSourceArray(item.organization),
      organizationLocations: normalizeOptionLabelArray(
        item.organizationLocations
      ),
      position:
        toSafeString(item.positionRoleHeld) || toSafeString(item.position),
      startDate: toSafeString(item.startDate) || undefined,
      endDate: toSafeString(item.endDate) || undefined,
    })),
  };
}

function normalizePreferredVolunteeringSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredVolunteering']
): VacancyForm['preferredVolunteering'] {
  if (!isRecord(rawSection)) {
    return fallback;
  }

  const entries = Array.isArray(rawSection.volunteering)
    ? rawSection.volunteering
    : [];

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    volunteering: entries.filter(isRecord).map((item, index) => ({
      id:
        toSafeString(item.volunteeringRequirementId) ||
        toSafeString(item.id) ||
        `volunteering-${index + 1}`,
      isOpen: true,
      organizationName:
        normalizeOptionWithSourceArray(item.organization).length > 0
          ? normalizeOptionWithSourceArray(item.organization)
          : normalizeOptionWithSourceArray(item.organizationName),
      organizationLocations: normalizeOptionLabelArray(
        item.organizationLocations
      ),
      cause: normalizeOptionWithSourceArray(item.cause),
      causeSearch: '',
      position: toSafeString(item.positionRole) || toSafeString(item.position),
      startDate: toSafeString(item.startDate) || undefined,
      endDate: toSafeString(item.endDate) || undefined,
      openDatePopover: null,
    })),
  };
}

function normalizeSkillEntry(raw: unknown): SkillCareerPathEntry | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = toSafeString(raw.id);
  const label =
    toSafeString(raw.label) ||
    toSafeString(raw.displayValue) ||
    toSafeString(raw.name) ||
    id;
  const source = toSafeString(raw.source) || 'MASTER';

  // The API returns skills as { id, label/displayValue, source }
  // The form expects SkillCareerPathEntry with skillId, skillName, etc.
  // The displayValue from API looks like "SkillName - CareerPath"
  const sepMatch = /\s[\u2013\u2014-]\s/.exec(label);
  const skillName = sepMatch ? label.slice(0, sepMatch.index) : label;
  const careerPathName = sepMatch
    ? label.slice(sepMatch.index + sepMatch[0].length)
    : '';

  if (!id && !label) {
    return null;
  }

  return {
    skillId: id,
    skillName,
    careerPathId: toSafeString(raw.careerPathId) || undefined,
    careerPathName,
    displayValue: label,
    source,
    // Legacy skills (created before skill levels existed) have no levelId; leave
    // it empty so the recruiter is forced to re-select a level in edit mode.
    levelId: toSafeString(raw.levelId) || undefined,
    levelName: toSafeString(raw.levelName) || undefined,
  };
}

function normalizePreferredSkillsSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredSkills']
): VacancyForm['preferredSkills'] {
  if (!isRecord(rawSection)) {
    return fallback;
  }

  const contentRaw = pickRawContent(rawSection, 'skills');

  const skills = contentRaw
    .map(item => normalizeSkillEntry(item))
    .filter((item): item is SkillCareerPathEntry => item !== null);

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    skills,
  };
}

function normalizePreferredIndustriesSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredIndustries']
): VacancyForm['preferredIndustries'] {
  if (Array.isArray(rawSection)) {
    return {
      isEnabled: fallback?.isEnabled ?? true,
      dataTakenFromCandidate: fallback?.dataTakenFromCandidate ?? false,
      industries: normalizeIndustryEntries(rawSection),
    };
  }

  if (!isRecord(rawSection)) {
    return fallback;
  }

  const contentEntries = normalizeIndustryEntries(rawSection.content);
  const formEntries = normalizeIndustryEntries(rawSection.industries);

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    industries: contentEntries.length > 0 ? contentEntries : formEntries,
  };
}

const PATENT_STATUS_LABEL_MAP: Record<PatentStatus, string> = {
  PATENT_PENDING: 'Patent Pending',
  PATENT_ISSUED: 'Patent Issued',
};

function normalizePatentsSection(
  rawSection: unknown,
  fallback: VacancyForm['patents']
): PreferredPatentsSchema {
  const fallbackValue: PreferredPatentsSchema = fallback ?? {
    isEnabled: false,
    dataTakenFromCandidate: false,
    patents: [],
  };

  if (!isRecord(rawSection)) {
    return fallbackValue;
  }

  const entries = Array.isArray(rawSection.patents) ? rawSection.patents : [];

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : fallbackValue.isEnabled,
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : fallbackValue.dataTakenFromCandidate,
    patents: entries.filter(isRecord).map(item => {
      const apiStatuses = Array.isArray(item.statuses) ? item.statuses : [];
      const apiIndustries = Array.isArray(item.relatedIndustry)
        ? item.relatedIndustry
        : [];

      return {
        relatedIndustries: apiIndustries.filter(isRecord).map(ind => ({
          value: toSafeString(ind.id),
          label:
            toSafeString(ind.label) ||
            toSafeString(ind.displayValue) ||
            toSafeString(ind.id),
          source: toSafeString(ind.source) || 'MASTER',
        })),
        statuses: apiStatuses
          .filter(
            (s): s is PatentStatus =>
              s === 'PATENT_PENDING' || s === 'PATENT_ISSUED'
          )
          .map(s => ({
            value: s,
            label: PATENT_STATUS_LABEL_MAP[s],
          })),
        fromDate:
          parseLocalDate(toSafeString(item.fromDate) || undefined) ?? undefined,
        toDate:
          parseLocalDate(toSafeString(item.toDate) || undefined) ?? undefined,
        isOpen: true,
      };
    }),
  };
}

function normalizePreferredHonoursAwardsSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredHonoursAwards']
): PreferredHonoursAwardsSchema {
  const fallbackValue: PreferredHonoursAwardsSchema = fallback ?? {
    isEnabled: false,
    dataTakenFromCandidate: false,
    honoursAndAwards: [],
  };

  if (!isRecord(rawSection)) {
    return fallbackValue;
  }

  const entries = pickRawContent(rawSection, 'honoursAndAwards');

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : fallbackValue.isEnabled,
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : fallbackValue.dataTakenFromCandidate,
    honoursAndAwards: entries.filter(isRecord).map(item => ({
      title: toSafeString(item.title),
      issuedBy: toSafeString(item.issuedBy),
      issuedDateFrom:
        parseLocalDate(
          toSafeString(item.issuedFromDate || item.issuedDateFrom) || undefined
        ) ?? undefined,
      issuedDateTo:
        parseLocalDate(
          toSafeString(item.issuedToDate || item.issuedDateTo) || undefined
        ) ?? undefined,
      associatedOrganizations: normalizeOptionWithSourceArray(
        item.associatedOrganizations
      ),
      organizationLocations: normalizeOptionLabelArray(
        item.organizationLocations
      ),
      isOpen: true,
    })),
  };
}

function normalizePreferredLanguagesSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredLanguages']
): VacancyForm['preferredLanguages'] {
  if (!isRecord(rawSection)) {
    return fallback;
  }

  const contentEntries = normalizeIndustryEntries(
    rawSection.content ?? rawSection.languages
  );

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    languages: contentEntries.map(e => ({
      id: e.id,
      label: e.label,
      source: e.source,
    })),
  };
}

function normalizePreferredCausesSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredCauses']
): VacancyForm['preferredCauses'] {
  if (!isRecord(rawSection)) {
    return fallback;
  }

  const contentEntries = normalizeIndustryEntries(
    rawSection.content ?? rawSection.causes
  );

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    causes: contentEntries.map(e => ({
      id: e.id,
      label: e.label,
      source: e.source,
    })),
  };
}

function normalizePreferredHobbiesSection(
  rawSection: unknown,
  fallback: VacancyForm['preferredHobbies']
): VacancyForm['preferredHobbies'] {
  if (!isRecord(rawSection)) {
    return fallback;
  }

  const contentEntries = normalizeIndustryEntries(
    rawSection.content ?? rawSection.hobbies ?? rawSection.hobbyList
  );

  return {
    isEnabled:
      typeof rawSection.isEnabled === 'boolean'
        ? rawSection.isEnabled
        : (fallback?.isEnabled ?? false),
    dataTakenFromCandidate:
      typeof rawSection.dataTakenFromCandidate === 'boolean'
        ? rawSection.dataTakenFromCandidate
        : (fallback?.dataTakenFromCandidate ?? false),
    hobbies: contentEntries.map(e => ({
      id: e.id,
      label: e.label,
      source: e.source,
    })),
  };
}

// Explicit map from API enum values → form state values.
// ONHOLD (no underscore) is the API enum; on_hold is the form/UI key.
const API_STATUS_TO_FORM: Record<string, string> = {
  DRAFT: 'draft',
  UNPUBLISHED: 'unpublished',
  LIVE: 'live',
  EXPIRED: 'expired',
  ONHOLD: 'on_hold',
};

function normalizeVacancyStatus(
  status: unknown,
  fallback: VacancyForm['status']
): VacancyForm['status'] {
  if (typeof status !== 'string') {
    return fallback;
  }

  const mapped = API_STATUS_TO_FORM[status.trim().toUpperCase()];
  if (!mapped) {
    return fallback;
  }

  return mapped;
}

const VALID_CUSTOMIZABLE_QUESTION_TYPES = new Set([
  'SHORT_ANSWER',
  'PARAGRAPH',
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'DROPDOWN',
  'LINEAR_SCALE',
]);

function toCustomizableQuestionType(
  value: unknown
): CustomizableFormQuestion['type'] {
  const normalized = toSafeString(value).toUpperCase();
  return VALID_CUSTOMIZABLE_QUESTION_TYPES.has(normalized)
    ? (normalized as CustomizableFormQuestion['type'])
    : '';
}

function toSafeInt(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function normalizeCustomizableFormSection(
  raw: unknown,
  fallback: CustomizableFormData
): CustomizableFormData {
  const entry: unknown = Array.isArray(raw) ? raw[0] : raw;
  if (!isRecord(entry)) return fallback;

  const isEnabled =
    typeof entry.isEnabled === 'boolean' ? entry.isEnabled : false;
  const sectionTitle = toSafeString(entry.sectionTitle);
  const rawForms = Array.isArray(entry.forms) ? entry.forms : [];

  let formCounter = 1;
  const forms: CustomizableFormFormCard[] = rawForms
    .filter(isRecord)
    .map(form => {
      const rawQuestions = Array.isArray(form.questions) ? form.questions : [];
      let questionCounter = 1;

      const questions: CustomizableFormQuestion[] = rawQuestions
        .filter(isRecord)
        .map(question => {
          const linearScale = isRecord(question.linearScale)
            ? question.linearScale
            : {};
          const rawOptions = Array.isArray(question.options)
            ? question.options
            : [];

          let optionCounter = 1;
          const options = rawOptions
            .map(opt => ({
              id: optionCounter++,
              value: isRecord(opt)
                ? toSafeString(opt.value ?? opt.label)
                : toSafeString(opt),
            }))
            .filter(o => o.value);

          return {
            id: questionCounter++,
            text: toSafeString(question.questionText ?? question.text),
            type: toCustomizableQuestionType(
              question.questionType ?? question.type
            ),
            required:
              typeof question.required === 'boolean'
                ? question.required
                : false,
            options: options.length ? options : [{ id: 1, value: '' }],
            from: toSafeInt(linearScale.startValue ?? question.from),
            to: toSafeInt(linearScale.endValue ?? question.to) || 2,
            startLabel: toSafeString(
              linearScale.startLabel ?? question.startLabel
            ),
            endLabel: toSafeString(linearScale.endLabel ?? question.endLabel),
          };
        });

      return {
        id: formCounter++,
        title: toSafeString(form.title),
        questions,
      };
    });

  if (!isEnabled && !sectionTitle && forms.length === 0) return fallback;

  return { isEnabled, sectionTitle, forms };
}

function normalizeSchedule(raw: unknown): ScheduleVacancy | undefined {
  if (!isRecord(raw)) return undefined;
  const publishAt = toSafeString(raw.schedulePublishAt);
  const expirationAt = toSafeString(raw.expirationAt);
  if (!publishAt || !expirationAt) return undefined;
  return { schedulePublishAt: publishAt, expirationAt };
}

function toVacancyFormFromResponse(
  rawVacancy: Record<string, unknown>,
  previousForm: VacancyForm
): VacancyForm {
  const sectionSource = isRecord(rawVacancy.data)
    ? rawVacancy.data
    : rawVacancy;

  const secondaryEducationSection = readSectionValue(
    rawVacancy,
    sectionSource,
    ['secondaryEducation']
  );
  const tertiaryEducationSection = readSectionValue(rawVacancy, sectionSource, [
    'tertiaryEducation',
  ]);
  const licenseCertificatesSection = readSectionValue(
    rawVacancy,
    sectionSource,
    ['licenseCertificates', 'licensesAndCertifications']
  );
  const preferredIndustriesSection = readSectionValue(
    rawVacancy,
    sectionSource,
    ['preferredIndustries', 'industry']
  );
  const projectsRequirementsSection = readSectionValue(
    rawVacancy,
    sectionSource,
    ['projectsRequirements', 'projects']
  );
  const preferredPublicationsSection = readSectionValue(
    rawVacancy,
    sectionSource,
    ['preferredPublications', 'publications']
  );
  const preferredClubSocietiesSection = readSectionValue(
    rawVacancy,
    sectionSource,
    ['preferredClubSocieties', 'clubsAndSocieties']
  );
  const preferredSportsSection = readSectionValue(rawVacancy, sectionSource, [
    'preferredSports',
    'sports',
  ]);
  const preferredVolunteeringSection = readSectionValue(
    rawVacancy,
    sectionSource,
    ['preferredVolunteering', 'volunteering']
  );
  const patentsSection = readSectionValue(rawVacancy, sectionSource, [
    'patents',
  ]);
  const preferredHonoursAwardsSection = readSectionValue(
    rawVacancy,
    sectionSource,
    ['preferredHonoursAwards', 'honoursAndAwards']
  );
  const scheduleSection = readSectionValue(rawVacancy, sectionSource, [
    'schedule',
    'scheduleRequirement',
  ]);
  const preferredSkillsSection = readSectionValue(rawVacancy, sectionSource, [
    'preferredSkills',
    'skills',
  ]);
  const preferredLanguagesSection = readSectionValue(
    rawVacancy,
    sectionSource,
    ['preferredLanguages', 'languages']
  );
  const preferredCausesSection = readSectionValue(rawVacancy, sectionSource, [
    'preferredCauses',
    'causes',
  ]);
  const preferredHobbiesSection = readSectionValue(rawVacancy, sectionSource, [
    'preferredHobbies',
    'hobbyList',
    'hobbies',
  ]);
  const customizableFormSection = readSectionValue(rawVacancy, sectionSource, [
    'customizedForm',
    'customizableForm',
    'customizableForms',
    'customizedForms',
  ]);

  // Explicit whitelist: only pick known scalar top-level form fields.
  // Avoids carrying unknown API keys into context state.
  const normalizedTitle = [
    rawVacancy.title,
    rawVacancy.vacancyTitle,
    rawVacancy.vacancy_name,
    rawVacancy.name,
  ].find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0
  );

  const lastActiveStep =
    typeof rawVacancy.lastActiveStep === 'string'
      ? rawVacancy.lastActiveStep
      : previousForm.lastActiveStep;

  return {
    ...previousForm,
    title: clampVacancyTitle(
      (typeof rawVacancy.title === 'string' && rawVacancy.title.trim()) ||
        !normalizedTitle
        ? toSafeString(rawVacancy.title) || previousForm.title
        : normalizedTitle
    ),
    status: normalizeVacancyStatus(rawVacancy.status, previousForm.status),
    applicantCount:
      typeof rawVacancy.applicantCount === 'number'
        ? rawVacancy.applicantCount
        : previousForm.applicantCount,
    lastActiveStep,
    jobRequirements: normalizeJobRequirementsSection(
      sectionSource,
      previousForm.jobRequirements
    ),
    profileRequirements: normalizeProfileRequirementsSection(
      sectionSource,
      previousForm.profileRequirements
    ),
    secondaryEducation: normalizeSecondaryEducationSection(
      secondaryEducationSection,
      previousForm.secondaryEducation
    ),
    tertiaryEducation: normalizeTertiaryEducationSection(
      tertiaryEducationSection,
      previousForm.tertiaryEducation
    ),
    projectsRequirements: normalizeProjectsRequirementsSection(
      projectsRequirementsSection,
      previousForm.projectsRequirements
    ),
    preferredPublications: normalizePreferredPublicationsSection(
      preferredPublicationsSection,
      previousForm.preferredPublications
    ),
    preferredClubSocieties: normalizePreferredClubSocietiesSection(
      preferredClubSocietiesSection,
      previousForm.preferredClubSocieties
    ),
    preferredSports: normalizePreferredSportsSection(
      preferredSportsSection,
      previousForm.preferredSports
    ),
    preferredVolunteering: normalizePreferredVolunteeringSection(
      preferredVolunteeringSection,
      previousForm.preferredVolunteering
    ),
    licenseCertificates: normalizeLicenseCertificatesSection(
      licenseCertificatesSection,
      previousForm.licenseCertificates
    ),
    preferredIndustries: normalizePreferredIndustriesSection(
      preferredIndustriesSection,
      previousForm.preferredIndustries
    ),
    patents: normalizePatentsSection(patentsSection, previousForm.patents),
    preferredHonoursAwards: normalizePreferredHonoursAwardsSection(
      preferredHonoursAwardsSection,
      previousForm.preferredHonoursAwards
    ),
    schedule: normalizeSchedule(scheduleSection) ?? previousForm.schedule,
    preferredSkills: normalizePreferredSkillsSection(
      preferredSkillsSection,
      previousForm.preferredSkills
    ),
    preferredLanguages: normalizePreferredLanguagesSection(
      preferredLanguagesSection,
      previousForm.preferredLanguages
    ),
    preferredCauses: normalizePreferredCausesSection(
      preferredCausesSection,
      previousForm.preferredCauses
    ),
    preferredHobbies: normalizePreferredHobbiesSection(
      preferredHobbiesSection,
      previousForm.preferredHobbies
    ),
    customizableForm: normalizeCustomizableFormSection(
      customizableFormSection,
      previousForm.customizableForm ?? {
        isEnabled: false,
        sectionTitle: '',
        forms: [],
      }
    ),
  };
}

export { toVacancyFormFromResponse, normalizeCustomizableFormSection };
