import type {
  CustomFormChangeSummary,
  CustomFormFieldItem,
  CustomFormLinearScaleRow,
  CustomFormOptionGroup,
  CustomFormSummaryItem,
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

// The API enum is ONHOLD (no underscore) but a status can also reach the UI
// already humanised ("On Hold"), so collapse both to the on_hold config key.
const normalizeStatusKey = (status: string): string => {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, '_');
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

// ── Customizable Forms (DQCGP-2235) ─────────────────────────────────────────
// sectionName "Customizable Forms" carries its own object shapes in
// oldValue/newValue rather than the generic scalar/object-array values every
// other section uses (see the CustomForm* types in types.ts) — parsed here
// into a render-ready CustomFormChangeSummary rather than widening the
// generic renderer to understand them.

type CustomFormFieldKind =
  | 'form'
  | 'question'
  | 'questionText'
  | 'questionType'
  | 'option'
  | 'optionValue'
  | 'required'
  | 'linearScaleStartValue'
  | 'linearScaleEndValue'
  | 'linearScaleStartLabel'
  | 'linearScaleEndLabel';

const CUSTOM_FORMS_SECTION_NAME = 'customizable forms';

const CUSTOM_FORM_FIELD_KINDS: Record<string, CustomFormFieldKind> = {
  form: 'form',
  question: 'question',
  'question text': 'questionText',
  'question type': 'questionType',
  option: 'option',
  'option value': 'optionValue',
  required: 'required',
  'linear scale start value': 'linearScaleStartValue',
  'linear scale end value': 'linearScaleEndValue',
  'linear scale start label': 'linearScaleStartLabel',
  'linear scale end label': 'linearScaleEndLabel',
};

const resolveCustomFormFieldKind = (
  fieldName: string
): CustomFormFieldKind | null =>
  CUSTOM_FORM_FIELD_KINDS[fieldName.trim().toLowerCase()] ?? null;

const isCustomFormChange = (change: VacancyVersionHistoryChange): boolean =>
  change.sectionName.trim().toLowerCase() === CUSTOM_FORMS_SECTION_NAME &&
  resolveCustomFormFieldKind(change.fieldName) !== null;

const LINEAR_SCALE_FIELD_ORDER: CustomFormLinearScaleRow['field'][] = [
  'startValue',
  'endValue',
  'startLabel',
  'endLabel',
];

const LINEAR_SCALE_KIND_TO_ROW_FIELD: Partial<
  Record<CustomFormFieldKind, CustomFormLinearScaleRow['field']>
> = {
  linearScaleStartValue: 'startValue',
  linearScaleEndValue: 'endValue',
  linearScaleStartLabel: 'startLabel',
  linearScaleEndLabel: 'endLabel',
};

const asCustomFormSummaryItems = (
  value: unknown[] | null
): CustomFormSummaryItem[] =>
  (value ?? []).filter(
    (item): item is CustomFormSummaryItem =>
      typeof item === 'object' &&
      item !== null &&
      'formTitle' in item &&
      'questionCount' in item
  );

const asCustomFormFieldItems = (
  value: unknown[] | null
): CustomFormFieldItem[] =>
  (value ?? []).filter(
    (item): item is CustomFormFieldItem =>
      typeof item === 'object' &&
      item !== null &&
      'formTitle' in item &&
      'value' in item &&
      'changeIndex' in item
  );

// Options belonging to the same question share one `changeIndex` (confirmed
// from the one real sample with 3 options across 3 different questions, each
// tagged with its own index) — grouped into one card per question rather
// than one card per option.
const groupCustomFormItemsByQuestion = (
  items: CustomFormFieldItem[]
): CustomFormOptionGroup[] => {
  const groups: CustomFormOptionGroup[] = [];
  const groupIndexByChangeIndex = new Map<number, number>();
  items.forEach(item => {
    let groupIndex = groupIndexByChangeIndex.get(item.changeIndex);
    if (groupIndex === undefined) {
      groupIndex = groups.length;
      groupIndexByChangeIndex.set(item.changeIndex, groupIndex);
      groups.push({ questionText: item.questionText ?? '', options: [] });
    }
    groups[groupIndex].options.push(item.value);
  });
  return groups;
};

/**
 * Parses the "Customizable Forms" change starting at `changes[index]` into a
 * render-ready CustomFormChangeSummary. Every kind consumes exactly 1 raw
 * change EXCEPT Linear Scale, which merges up to 4 consecutive changes
 * sharing the same form+question into one card (Figma node 4229:230027 draws
 * Start/End Value and Start/End Label as one card with stacked rows, but the
 * API reports each as its own flat FIELD_VALUE_UPDATED entry) — returns how
 * many raw entries it consumed so the caller can skip past them. Returns
 * null when the item shape doesn't match what's expected (missing
 * questionText where required, empty arrays, etc.), letting the caller fall
 * back to the generic renderer rather than showing a broken card.
 */
const buildCustomFormChangeSummary = (
  changes: VacancyVersionHistoryChange[],
  index: number
): { summary: CustomFormChangeSummary; consumed: number } | null => {
  const change = changes[index];
  const kind = resolveCustomFormFieldKind(change.fieldName);
  if (!kind) return null;
  const isRemoval = change.changeType === 'FIELD_VALUE_REMOVED';

  if (kind === 'form') {
    const items = asCustomFormSummaryItems(
      isRemoval ? change.oldValue : change.newValue
    );
    if (items.length === 0) return null;
    return {
      summary: {
        kind: isRemoval ? 'formsRemoved' : 'formsAdded',
        forms: items,
      },
      consumed: 1,
    };
  }

  if (kind === 'question') {
    const items = asCustomFormFieldItems(
      isRemoval ? change.oldValue : change.newValue
    );
    if (items.length === 0) return null;
    return {
      summary: {
        kind: isRemoval ? 'questionsRemoved' : 'questionsAdded',
        formTitle: items[0].formTitle,
        questions: items.map(item => ({
          text: item.value,
          questionType: item.questionType,
          required: item.required,
        })),
      },
      consumed: 1,
    };
  }

  if (kind === 'questionText') {
    const before = asCustomFormFieldItems(change.oldValue)[0];
    const after = asCustomFormFieldItems(change.newValue)[0];
    if (!before || !after) return null;
    return {
      summary: {
        kind: 'questionTextUpdated',
        formTitle: after.formTitle,
        before: before.value,
        after: after.value,
      },
      consumed: 1,
    };
  }

  if (kind === 'questionType') {
    const before = asCustomFormFieldItems(change.oldValue)[0];
    const after = asCustomFormFieldItems(change.newValue)[0];
    if (!before || !after || !after.questionText) return null;
    return {
      summary: {
        kind: 'questionTypeUpdated',
        formTitle: after.formTitle,
        questionText: after.questionText,
        before: before.value,
        after: after.value,
      },
      consumed: 1,
    };
  }

  if (kind === 'option') {
    const items = asCustomFormFieldItems(
      isRemoval ? change.oldValue : change.newValue
    );
    if (items.length === 0) return null;
    return {
      summary: {
        kind: isRemoval ? 'optionsRemoved' : 'optionsAdded',
        formTitle: items[0].formTitle,
        groups: groupCustomFormItemsByQuestion(items),
      },
      consumed: 1,
    };
  }

  if (kind === 'optionValue') {
    const before = asCustomFormFieldItems(change.oldValue)[0];
    const after = asCustomFormFieldItems(change.newValue)[0];
    if (!before || !after || !after.questionText) return null;
    return {
      summary: {
        kind: 'optionValueUpdated',
        formTitle: after.formTitle,
        questionText: after.questionText,
        before: before.value,
        after: after.value,
      },
      consumed: 1,
    };
  }

  if (kind === 'required') {
    const before = asCustomFormFieldItems(change.oldValue)[0];
    const after = asCustomFormFieldItems(change.newValue)[0];
    if (!before || !after || !after.questionText) return null;
    return {
      summary: {
        kind: 'requiredToggleChanged',
        formTitle: after.formTitle,
        questionText: after.questionText,
        before: parseBooleanFlag(before.value),
        after: parseBooleanFlag(after.value),
      },
      consumed: 1,
    };
  }

  const rowField = LINEAR_SCALE_KIND_TO_ROW_FIELD[kind];
  if (!rowField) return null;

  const firstAfter = asCustomFormFieldItems(change.newValue)[0];
  if (!firstAfter || !firstAfter.questionText) return null;
  const { formTitle, questionText } = firstAfter;

  const rowsByField = new Map<
    CustomFormLinearScaleRow['field'],
    CustomFormLinearScaleRow
  >();
  let consumed = 0;
  for (let cursor = index; cursor < changes.length; cursor += 1) {
    const candidate = changes[cursor];
    const candidateKind = resolveCustomFormFieldKind(candidate.fieldName);
    const candidateRowField = candidateKind
      ? LINEAR_SCALE_KIND_TO_ROW_FIELD[candidateKind]
      : undefined;
    if (!candidateRowField) break;
    const before = asCustomFormFieldItems(candidate.oldValue)[0];
    const after = asCustomFormFieldItems(candidate.newValue)[0];
    if (
      !before ||
      !after ||
      after.formTitle !== formTitle ||
      after.questionText !== questionText
    ) {
      break;
    }
    rowsByField.set(candidateRowField, {
      field: candidateRowField,
      before: before.value,
      after: after.value,
    });
    consumed += 1;
  }
  if (consumed === 0) return null;

  return {
    summary: {
      kind: 'linearScaleUpdated',
      formTitle,
      questionText,
      rows: LINEAR_SCALE_FIELD_ORDER.filter(field =>
        rowsByField.has(field)
      ).map(field => rowsByField.get(field) as CustomFormLinearScaleRow),
    },
    consumed,
  };
};

// Maps a flat change list into render-ready entries, folding Customizable
// Forms changes through buildCustomFormChangeSummary() above (which may
// consume more than one raw change) instead of the plain 1:1 mapping used
// for every other section.
const buildChangeEntries = (
  changes: VacancyVersionHistoryChange[],
  attribution: string,
  isSystem: boolean,
  updatedAt: string,
  profilePicture: string | null
): VersionHistoryEntry[] => {
  const entries: VersionHistoryEntry[] = [];
  let index = 0;
  while (index < changes.length) {
    const change = changes[index];
    if (isCustomFormChange(change)) {
      const result = buildCustomFormChangeSummary(changes, index);
      if (result) {
        entries.push({
          change,
          attribution,
          isSystem,
          updatedAt,
          profilePicture,
          customFormChange: result.summary,
        });
        index += result.consumed;
        continue;
      }
    }
    entries.push({ change, attribution, isSystem, updatedAt, profilePicture });
    index += 1;
  }
  return entries;
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
    ...buildChangeEntries(
      userChanges,
      actorIsSystem ? SYSTEM_ACTOR : actor,
      actorIsSystem,
      version.updatedAt,
      actorIsSystem ? null : version.profilePicture
    ),
    ...buildChangeEntries(
      version.changes.system,
      SYSTEM_ACTOR,
      true,
      version.updatedAt,
      null
    ),
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
  resolveCustomFormFieldKind,
  isCustomFormChange,
  buildCustomFormChangeSummary,
  SYSTEM_ACTOR,
};
