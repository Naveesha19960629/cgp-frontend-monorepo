import type {
  ApplicationFormChanges,
  VacancyForm,
} from '@/views/vacancies/types';

/** VacancyForm sections that represent the "Customizable Form" — new question fields the recruiter can add. */
const NEW_FIELDS_SECTION = 'customizableForm' as const;

/**
 * VacancyForm sections that represent applicant-facing "preferred value" data —
 * changing any of these is what the Onhold-with-applicants dialog copy means by
 * "new preferred values have been added" / "updated preferred values".
 */
const PREFERRED_VALUE_SECTIONS = [
  'secondaryEducation',
  'tertiaryEducation',
  'projectsRequirements',
  'preferredPublications',
  'preferredClubSocieties',
  'preferredSports',
  'preferredVolunteering',
  'patents',
  'preferredHonoursAwards',
  'licenseCertificates',
  'preferredSkills',
  'preferredLanguages',
  'preferredCauses',
  'preferredHobbies',
  'preferredIndustries',
] as const satisfies readonly (keyof VacancyForm)[];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((item, index) => deepEqual(item, b[index]))
    );
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every(key => deepEqual(a[key], b[key]));
  }

  return false;
}

/**
 * Recursively collects dot-path identifiers for every leaf value that differs
 * between `original` and `edited`, prefixed with `path`. Recursion (rather than
 * manually nested loops) keeps this generic across every section shape.
 */
function collectChangedPaths(
  original: unknown,
  edited: unknown,
  path: string
): string[] {
  if (deepEqual(original, edited)) return [];

  const bothArrays = Array.isArray(original) && Array.isArray(edited);
  const bothObjects = isPlainObject(original) && isPlainObject(edited);

  if (!bothArrays && !bothObjects) {
    return [path];
  }

  if (bothArrays) {
    if (original.length !== edited.length) return [path];
    return original.flatMap((item, index) =>
      collectChangedPaths(item, edited[index], `${path}[${index}]`)
    );
  }

  const originalRecord = original as Record<string, unknown>;
  const editedRecord = edited as Record<string, unknown>;
  const keys = [
    ...new Set([...Object.keys(originalRecord), ...Object.keys(editedRecord)]),
  ];
  return keys.flatMap(key =>
    collectChangedPaths(
      originalRecord[key],
      editedRecord[key],
      `${path}.${key}`
    )
  );
}

/**
 * Diffs the applicant-facing sections of `original` (the vacancy as loaded,
 * before edits) against `edited` (the form the recruiter is about to submit).
 * Used to decide whether the Onhold-with-applicants "Scheduled Publish Date
 * changed" flow needs to notify past applicants.
 */
function detectApplicationFormChanges(
  original: VacancyForm,
  edited: VacancyForm
): ApplicationFormChanges {
  const hasNewFields = !deepEqual(
    original[NEW_FIELDS_SECTION],
    edited[NEW_FIELDS_SECTION]
  );
  const changedSections: string[] = [];
  const changedFields: string[] = [];

  if (hasNewFields) {
    changedSections.push(NEW_FIELDS_SECTION);
    changedFields.push(
      ...collectChangedPaths(
        original[NEW_FIELDS_SECTION],
        edited[NEW_FIELDS_SECTION],
        NEW_FIELDS_SECTION
      )
    );
  }

  let hasUpdatedPreferredValues = false;
  for (const section of PREFERRED_VALUE_SECTIONS) {
    if (deepEqual(original[section], edited[section])) continue;
    hasUpdatedPreferredValues = true;
    changedSections.push(section);
    changedFields.push(
      ...collectChangedPaths(original[section], edited[section], section)
    );
  }

  return {
    hasNewFields,
    hasUpdatedPreferredValues,
    changedSections,
    changedFields,
  };
}

export { detectApplicationFormChanges };
