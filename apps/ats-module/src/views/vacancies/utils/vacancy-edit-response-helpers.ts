import type {
  AddOrSelectOption,
  JobRequirement,
  VacancyForm,
} from '@/views/vacancies/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
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

  const stateProvince = isRecord(raw.stateProvince)
    ? normalizeSelectOption(raw.stateProvince)
    : isRecord(raw.state)
      ? normalizeSelectOption(raw.state)
      : {
          id: toSafeString(raw.stateRefId),
          label: toSafeString(raw.stateLabel),
        };

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
  source: Record<string, unknown>,
  fallback: VacancyForm['secondaryEducation']
): VacancyForm['secondaryEducation'] {
  const rawSection = source.secondaryEducation;
  if (!Array.isArray(rawSection)) {
    return fallback;
  }

  return rawSection.filter(isRecord).map(item => ({
    ...fallback[0],
    ...item,
    content: Array.isArray(item.content) ? item.content : [],
  }));
}

function normalizeTertiaryEducationSection(
  source: Record<string, unknown>,
  fallback: VacancyForm['tertiaryEducation']
): VacancyForm['tertiaryEducation'] {
  const rawSection = source.tertiaryEducation;
  if (!Array.isArray(rawSection)) {
    return fallback;
  }

  return rawSection.filter(isRecord).map(item => ({
    ...fallback[0],
    ...item,
    content: Array.isArray(item.content) ? item.content : [],
  }));
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

function toVacancyFormFromResponse(
  rawVacancy: Record<string, unknown>,
  previousForm: VacancyForm
): VacancyForm {
  const sectionSource = isRecord(rawVacancy.data)
    ? rawVacancy.data
    : rawVacancy;

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
    title:
      (typeof rawVacancy.title === 'string' && rawVacancy.title.trim()) ||
      !normalizedTitle
        ? toSafeString(rawVacancy.title) || previousForm.title
        : normalizedTitle,
    status: normalizeVacancyStatus(rawVacancy.status, previousForm.status),
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
      sectionSource,
      previousForm.secondaryEducation
    ),
    tertiaryEducation: normalizeTertiaryEducationSection(
      sectionSource,
      previousForm.tertiaryEducation
    ),
  };
}

export { toVacancyFormFromResponse };
