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

function normalizeProfileRequirementsSection(
  source: Record<string, unknown>,
  fallback: VacancyForm['profileRequirements']
): VacancyForm['profileRequirements'] {
  const rawSection = pickSection(
    source,
    'profileRequirements',
    'profileRequirement'
  );

  if (Array.isArray(rawSection)) {
    const first: unknown = rawSection[0];
    if (!isRecord(first)) {
      return fallback;
    }

    const content = isRecord(first.content) ? first.content : first;
    return {
      ...fallback,
      ...content,
      isEnabled:
        typeof first.isEnabled === 'boolean'
          ? first.isEnabled
          : fallback.isEnabled,
      dataTakenFromCandidate:
        typeof first.dataTakenFromCandidate === 'boolean'
          ? first.dataTakenFromCandidate
          : fallback.dataTakenFromCandidate,
    };
  }

  if (isRecord(rawSection)) {
    return {
      ...fallback,
      ...rawSection,
    };
  }

  return fallback;
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

function normalizeVacancyStatus(
  status: unknown,
  fallback: VacancyForm['status']
): VacancyForm['status'] {
  if (typeof status !== 'string') {
    return fallback;
  }

  const normalized = status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  const allowed = ['draft', 'unpublished', 'live', 'expired', 'on_hold'];
  if (!allowed.includes(normalized)) {
    return fallback;
  }

  return normalized;
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
