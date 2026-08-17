import type {
  VacancyCreationSummary,
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

// SECTION_ENABLED's oldValue/newValue carry the flag as the literal string
// "true"/"false" (confirmed from a real API response), not a JS boolean —
// lowercased before comparing so a differently-cased variant from the API
// doesn't silently read as "off".
const parseBooleanFlag = (value: string | null): boolean =>
  (value ?? '').trim().toLowerCase() === 'true';

// Unlike SECTION_ENABLED (its own dedicated changeType), "Data Taken From
// Candidate" — Figma's "'No manual input required' Enabled/Disabled"
// checkbox (node 6536:91081) — arrives as a plain FIELD_VALUE_UPDATED with
// this literal fieldName and the same "true"/"false" string flag (confirmed
// from a real response), so it has to be detected by field name rather than
// changeType.
const isDataTakenFromCandidateChange = (
  change: VacancyVersionHistoryChange
): boolean =>
  change.changeType === 'FIELD_VALUE_UPDATED' &&
  change.fieldName.trim().toLowerCase() === 'data taken from candidate';

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
// pair the API uses for them (the same labels VACANCY_CREATED reports) —
// confirmed from a real response that a POST-creation schedule/expiration
// date update arrives under `sectionName: "Schedule"`, not "Vacancy" (only
// the INITIAL value, set at VACANCY_CREATED time, uses "Vacancy"), even
// though it's the exact same field conceptually — both section names are
// accepted so the update gets the same one-line sentence the initial value
// already does, not the generic section-header treatment.
const VACANCY_SCALAR_SECTION_NAMES = new Set(['vacancy', 'schedule']);
const resolveScalarChangeLabelKey = (change: {
  sectionName: string;
  fieldName: string;
}): 'titleChanged' | 'scheduleDateChanged' | 'expirationDateChanged' | null => {
  if (
    !VACANCY_SCALAR_SECTION_NAMES.has(change.sectionName.trim().toLowerCase())
  ) {
    return null;
  }
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
  change: Pick<
    VacancyVersionHistoryChange,
    'changeType' | 'oldValue' | 'newValue'
  >
): 'added' | 'removed' | 'updated' => {
  if (
    change.changeType === 'FIELD_VALUE_ADDED' ||
    change.changeType === 'VACANCY_CREATED'
  ) {
    return 'added';
  }
  if (change.changeType === 'FIELD_VALUE_REMOVED') return 'removed';
  // Confirmed from a real response: the API sometimes represents a field
  // being cleared as FIELD_VALUE_UPDATED with newValue: null (oldValue still
  // holding the prior value) instead of FIELD_VALUE_REMOVED — e.g. a
  // "Position/Role Held" whose value was deleted. Read the same as an
  // explicit removal so it shows the value that went away in the removed
  // (red) accent, not a meaningless "Updated ... to —" in the added accent.
  if (
    change.changeType === 'FIELD_VALUE_UPDATED' &&
    change.newValue === null &&
    change.oldValue !== null
  ) {
    return 'removed';
  }
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

const isVacancyCreationChange = (
  change: VacancyVersionHistoryChange
): boolean =>
  change.changeType === 'VACANCY_CREATED' &&
  change.sectionName.trim().toLowerCase() === 'vacancy';

// The API sends VACANCY_CREATED's Title/Status/Schedule Date/Expiration Date
// as 4 separate flat entries (confirmed from a real response) — there is no
// combined "creation" entry to read a VacancyCreationSummary from directly,
// so this assembles one from whichever of those 4 flat entries are present
// in the SAME version. Only returns non-null once both `title` and `status`
// are found (the two pieces both confirmed Figma examples require) — a
// version with just a lone Title entry (every existing sample/test fixture
// bar the real one) falls back to the plain per-field rendering unchanged.
const buildVacancyCreationSummary = (
  changes: VacancyVersionHistoryChange[]
): VacancyCreationSummary | null => {
  const byField = (match: (field: string) => boolean) =>
    changes.find(change => match(change.fieldName.trim().toLowerCase()));
  const titleChange = byField(field => field === 'title');
  const statusChange = byField(field => field === 'status');
  if (!titleChange || !statusChange) return null;

  const scheduleChange = byField(field => field.includes('schedule'));
  const expirationChange = byField(field => field.includes('expiration'));
  const title = getSingleScalar(titleChange.newValue);
  const status = getSingleScalar(statusChange.newValue);
  if (title === null || status === null) return null;

  return {
    title,
    status,
    scheduleDate: scheduleChange
      ? getSingleScalar(scheduleChange.newValue)
      : null,
    expirationDate: expirationChange
      ? getSingleScalar(expirationChange.newValue)
      : null,
  };
};

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

  const creationChanges = version.changes.user.filter(isVacancyCreationChange);
  const creationSummary = buildVacancyCreationSummary(creationChanges);
  // Once grouped into one card, the individual Title/Status/Schedule/
  // Expiration entries no longer render as their own separate cards too.
  const userChanges = creationSummary
    ? version.changes.user.filter(change => !creationChanges.includes(change))
    : version.changes.user;
  // Title is always present whenever creationSummary is non-null (it's one
  // of the two required fields) — used as the grouped entry's representative
  // `change` so callers keying off `change.changeType`/`sectionName` still
  // see a VACANCY_CREATED/'Vacancy' pair, same as the ungrouped case.
  const titleChange = creationChanges.find(
    change => change.fieldName.trim().toLowerCase() === 'title'
  );

  return [
    ...(creationSummary && titleChange
      ? [
          {
            change: titleChange,
            attribution: actorIsSystem ? SYSTEM_ACTOR : actor,
            isSystem: actorIsSystem,
            updatedAt: version.updatedAt,
            profilePicture: actorIsSystem ? null : version.profilePicture,
            vacancyCreationSummary: creationSummary,
          },
        ]
      : []),
    // `changes.user` vs `changes.system` is the API's own signal for
    // "a deliberate action by an actor" vs "an automatic side effect" — even
    // for STATUS_CHANGED, which previously was force-attributed to "System"
    // unconditionally regardless of which array it arrived in. That was
    // itself a deliberate fix for an earlier real report (a status change
    // that WAS a system side effect showed as a person's raw email because
    // the API happened to file it under `changes.user` alongside other
    // edits in that version) — but this app has real manual status actions
    // (VacancyOnholdUpdateDialog, VacancyToggleStatusDialog), and a later
    // real report showed the opposite failure: a status change from
    // clicking one of those genuinely showed "System" instead of the
    // person who did it. Trusting the array split for every change type
    // (not just STATUS_CHANGED) resolves both — `changes.system` entries
    // are still unconditionally "System" below, unaffected by this.
    ...userChanges.map(change => ({
      change,
      attribution: actorIsSystem ? SYSTEM_ACTOR : actor,
      isSystem: actorIsSystem,
      updatedAt: version.updatedAt,
      profilePicture: actorIsSystem ? null : version.profilePicture,
    })),
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
  parseBooleanFlag,
  isDataTakenFromCandidateChange,
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
  buildVacancyCreationSummary,
  SYSTEM_ACTOR,
};
