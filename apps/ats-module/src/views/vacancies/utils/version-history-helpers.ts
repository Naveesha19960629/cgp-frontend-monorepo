import type {
  VacancyVersionHistoryChange,
  VacancyVersionHistoryVersion,
  VersionHistoryEntry,
  VersionHistoryGridItem,
} from '@/views/vacancies/types';

// Shared between the PDF generator (version-history-pdf.ts) and the
// on-screen Activity Log components — both need to interpret the same
// oldValue/newValue array shapes from a VacancyVersionHistoryChange, so this
// logic lives here once instead of being duplicated (and drifting) in JSX
// and pdfkit draw calls separately.

const normalizeStatusKey = (status: string): string => {
  const normalized = status.toLowerCase();
  return normalized === 'onhold' ? 'on_hold' : normalized;
};

const getSingleScalar = (value: unknown[] | null): string | null => {
  if (!value || value.length === 0) return null;
  const [first] = value;
  if (typeof first === 'object' && first !== null) return null;
  return String(first);
};

const isObjectArray = (
  value: unknown[] | null
): value is Record<string, unknown>[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  typeof value[0] === 'object' &&
  value[0] !== null;

// A plain (non-object) array with more than one entry needs the same
// multi-item box grid as an object array — a single getSingleScalar() call
// would otherwise silently drop every value but the first (e.g. a
// multi-select "Causes" or "Industries" change).
const shouldRenderAsGrid = (value: unknown[] | null): value is unknown[] =>
  isObjectArray(value) || (Array.isArray(value) && value.length > 1);

const toGridItem = (item: Record<string, unknown>): VersionHistoryGridItem => {
  const entries = Object.entries(item).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );
  const [firstEntry, secondEntry] = entries;
  return {
    title: firstEntry ? String(firstEntry[1]) : '—',
    subtitle: secondEntry ? String(secondEntry[1]) : undefined,
  };
};

const toGridItems = (value: unknown[]): VersionHistoryGridItem[] =>
  isObjectArray(value)
    ? value.map(toGridItem)
    : value.map(item => ({ title: String(item) }));

// Object-shaped values (a school + its location) carry a title AND subtitle,
// so they need the bordered two-column box grid; isObjectArray() is the test
// for that. Plain multi-select strings (Causes, Skills, Industries…) are
// single short labels and render as chips instead — matching Figma's Causes
// example and the chip inputs the vacancy form itself uses for exactly these
// fields. (Figma's Patents/Industries example draws plain strings as boxes
// instead; its own two examples disagree, so the rule is taken from the field
// type rather than from either single example.)
const toChipItems = (value: unknown[]): string[] => value.map(String);

// Figma writes the change summary with a plural field name ("Added New 2
// School Names"). The API only supplies the singular field label ("School"),
// so it is pluralized here — skipping names that already end in "s"
// ("Causes", "Industries") to avoid "Causess".
const pluralizeFieldName = (fieldName: string, count: number): string => {
  if (count === 1 || /s$/i.test(fieldName)) return fieldName;
  return `${fieldName}s`;
};

// Vacancy-level scalar edits get their own sentence in Figma instead of the
// generic "Section Name - X │ Updated…" header. Matched on the section/field
// pair the API uses for them (the same labels VACANCY_CREATED reports).
const resolveScalarChangeLabelKey = (change: {
  sectionName: string;
  fieldName: string;
}): 'titleChanged' | 'scheduleDateChanged' | 'expirationDateChanged' | null => {
  if (change.sectionName.trim().toLowerCase() !== 'vacancy') return null;
  const field = change.fieldName.trim().toLowerCase();
  if (field === 'title') return 'titleChanged';
  if (field.includes('schedule')) return 'scheduleDateChanged';
  if (field.includes('expiration')) return 'expirationDateChanged';
  return null;
};

// Which accent a change is presented in: additions and the initial creation
// read as green, removals as red, everything else as an update (also green
// per Figma, which uses one accent family for both added and updated values).
const resolveChangeVariant = (
  changeType: VacancyVersionHistoryChange['changeType']
): 'added' | 'removed' | 'updated' => {
  if (changeType === 'FIELD_VALUE_ADDED' || changeType === 'VACANCY_CREATED') {
    return 'added';
  }
  if (changeType === 'FIELD_VALUE_REMOVED') return 'removed';
  return 'updated';
};

const SYSTEM_ACTOR = 'SYSTEM';

const isSystemActor = (actor: string | null | undefined): boolean =>
  (actor ?? '').trim().toUpperCase() === SYSTEM_ACTOR;

// A version's `updatedBy` is the actor for the whole version, and for the
// initial version it is recorded as "SYSTEM" even though a recruiter
// performed the creation (the vacancy is written by the Draft/Schedule
// flow, not by a person hitting Update). Attributing that version's
// `changes.user` entries to "System" made EVERY entry read as a system
// change; the vacancy's own `createdBy` is the real actor, so it is used as
// the fallback. `changes.system` entries are always "System" regardless.
const resolveVersionActor = (
  version: VacancyVersionHistoryVersion,
  createdBy: string
): string =>
  isSystemActor(version.updatedBy) && !isSystemActor(createdBy) && createdBy
    ? createdBy
    : version.updatedBy;

// A status transition is always the system's own doing — the vacancy going
// Live/Expired/On Hold is a side effect of a schedule or of the recruiter
// pressing Activate, never a field the recruiter typed. The API nonetheless
// files STATUS_CHANGED under `changes.user` on versions where a person also
// made edits (version 2 of the sample payload), which would otherwise
// attribute it to that person's email. Figma shows this entry with the
// monitor/"System" avatar, so changeType decides it, not which array it
// arrived in.
const isSystemChange = (change: VacancyVersionHistoryChange): boolean =>
  change.changeType === 'STATUS_CHANGED';

// Flattens a version into render-ready entries. "user" vs "system" is NOT
// "human vs machine" — it separates direct field edits from automatic
// side-effect changes — so the split is carried through as an explicit
// `isSystem` flag instead of being re-derived from the attribution string by
// each renderer.
const resolveVersionEntries = (
  version: VacancyVersionHistoryVersion | undefined,
  createdBy: string
): VersionHistoryEntry[] => {
  if (!version) return [];
  const actor = resolveVersionActor(version, createdBy);
  const actorIsSystem = isSystemActor(actor);

  return [
    ...version.changes.user.map(change => {
      const systemChange = actorIsSystem || isSystemChange(change);
      return {
        change,
        attribution: systemChange ? SYSTEM_ACTOR : actor,
        isSystem: systemChange,
        updatedAt: version.updatedAt,
        profilePicture: systemChange ? null : version.profilePicture,
      };
    }),
    ...version.changes.system.map(change => ({
      change,
      attribution: SYSTEM_ACTOR,
      isSystem: true,
      updatedAt: version.updatedAt,
      profilePicture: null,
    })),
  ];
};

export {
  normalizeStatusKey,
  getSingleScalar,
  isObjectArray,
  shouldRenderAsGrid,
  toGridItem,
  toGridItems,
  toChipItems,
  pluralizeFieldName,
  resolveScalarChangeLabelKey,
  resolveChangeVariant,
  isSystemActor,
  resolveVersionActor,
  resolveVersionEntries,
  SYSTEM_ACTOR,
};
