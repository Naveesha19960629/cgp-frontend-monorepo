# Secondary Education Vacancy Step — Implementation Plan

## Figma Design Reference
Node: `1199-181204` — [ATS Handover](https://www.figma.com/design/BFyxZ6AzbRZgVvjLzRFwv3/ATS-Handover?node-id=1199-181204&m=dev)

---

## Design Analysis (from Figma MCP)

### Layout
The Secondary Education step consists of:

1. **Section Header Row** — "Secondary Educational Requirements" label + **Toggle Switch** (`isEnabled`)
2. **Informational Banner** — "Build the Application Form" message (always visible when section is enabled, Notif 1.2.4)
3. **Card: "Secondary Education 01"** — collapsible card with:
   - **Header**: entry label + collapse arrow + delete icon (disabled for now — multiple entries not yet supported)
   - **"Collect information from candidates without specifying requirements"** checkbox → `dataTakenFromCandidate`
   - **"Accepts Home Schooling"** checkbox → `content[0].acceptsHomeSchooling`
   - **4-column grid** (each column ≈ 294px):
     - Row 1: School Name (cols 1–2) | School Location (cols 3–4)
     - Row 2: Grade (col 1) | Start Date (col 2) | End Date (col 3) | *(empty col 4)*
     - Row 3: Examination (cols 1–2) | Awarding Body (cols 3–4)
     - Row 4: Field of Study (cols 1–2) | Results textarea (cols 3–4)
4. **Footer Buttons**: Back | Next

### Field Details (from User Story Data Fields Table)

| Field | Component | `dataTakenFromCandidate` disables | Char limit | API field |
|---|---|---|---|---|
| Collect info from candidates | Checkbox | — | — | `dataTakenFromCandidate` |
| Accepts Home Schooling | Checkbox | ✓ | — | `content[0].acceptsHomeSchooling` |
| School Name | MultipleSelector (creatable) | ✓ | — | `content[0].schools` |
| School Location | MultipleSelector (non-creatable) | ✓ | — | `content[0].schoolLocations` |
| Examination | MultipleSelector (creatable) | ✓ | 100 | `content[0].examinations` |
| Awarding Body | MultipleSelector (creatable) | ✓ | 200 | `content[0].secondaryAwardingBody` |
| Field of Study | MultipleSelector (creatable) | ✓ | 100 | `content[0].fieldsOfStudy` |
| Grade | Input (text) | ✓ | 80 | `content[0].grade` |
| Start Date | Date Picker (Popover + Calendar) | ✓ | — | `content[0].startDate` |
| End Date | Date Picker (Popover + Calendar) | ✓ | — | `content[0].endDate` |
| Results | Textarea | ✓ | 1000 | `content[0].result` |

### Validation Rules
- All fields optional (no mandatory validation on individual fields)
- When `isEnabled = true`: at least one field must be filled OR `dataTakenFromCandidate` must be checked to proceed
- When `dataTakenFromCandidate = true`: all other fields disabled, content = []
- Max 10 selections on all multi-select fields (Notif 1.2.3: "Exceeded maximum of 10 selections.")
- Start Date: past/present only (max = today)
- End Date: must be > Start Date; past/present/future allowed (±100 years)
- Character counters displayed on text fields (e.g., "0/80")

### API Payload

```json
// Toggle OFF
{ "secondaryEducation": [{ "isEnabled": false, "dataTakenFromCandidate": false, "content": [] }] }

// Toggle ON, dataTakenFromCandidate = true
{ "secondaryEducation": [{ "isEnabled": true, "dataTakenFromCandidate": true, "content": [] }] }

// Toggle ON, full data
{
  "secondaryEducation": [{
    "isEnabled": true,
    "dataTakenFromCandidate": false,
    "content": [{
      "acceptsHomeSchooling": false,
      "schools": [{ "source": "MASTER"|"PENDING", "id": "uuid" }],
      "schoolLocations": [{ "source": "MASTER", "id": "uuid" }],
      "examinations": [{ "source": "MASTER"|"PENDING", "id": "uuid" }],
      "secondaryAwardingBody": [{ "source": "MASTER"|"PENDING", "id": "uuid" }],
      "fieldsOfStudy": [{ "source": "MASTER"|"PENDING", "id": "uuid" }],
      "grade": "A+",
      "startDate": "2018-01-10",
      "endDate": "2020-11-30",
      "result": "Passed with distinction"
    }]
  }]
}
```

Note: This step does NOT call the save API — it stores data in `VacancyFormContext` via `onNext(data)`. The full wizard POST happens only on final submit.

---

## Codebase Analysis

### Existing patterns to follow
- All form steps in `apps/ats-module/src/views/vacancies/components/form-steps/` are currently placeholders — this will be the first fully implemented step
- Types live exclusively in `views/vacancies/types.ts`
- Services are plain objects in `views/vacancies/services/<resource>.service.ts` using `httpClient` from `@cgp/data-access`
- Query hooks: `views/vacancies/hooks/queries/use-<resource>-query.ts`
- Mutation hooks: `views/vacancies/hooks/mutations/use-<action>-<resource>-mutation.ts`
- Form hooks: `views/vacancies/hooks/use-<form-name>-form.ts`
- Utilities: `views/vacancies/utils/<name>.ts`
- i18n: `useTranslation('ats')`, keys in `src/app/utils/i18n/locales/en/ats.json`

### Reusable UI Components
- `MultipleSelector` from `@cgp/ui-kit/components/multiple-selector` — multi-select with `creatable`, `maxSelected`, async `onSearch`
- `Checkbox` from `@cgp/ui-kit/components/ui/checkbox`
- `Calendar` from `@cgp/ui-kit/components/ui/calendar` + `Popover/PopoverContent/PopoverTrigger` from `@cgp/ui-kit/components/ui/popover`
- `Input` from `@cgp/ui-kit/components/ui/input`
- `Textarea` from `@cgp/ui-kit/components/ui/textarea`
- `Button` from `@cgp/ui-kit/components/ui/button`
- `Switch` (radix-ui primitive) — no existing wrapper, will use `Switch as SwitchPrimitive from 'radix-ui'` inline following the Checkbox component pattern
- `Label` from `@cgp/ui-kit/components/ui/label`
- `cn` from `@cgp/ui-kit/lib/utils`

### Context
- `VacancyFormContext` (in `context/vacancy-form-context.tsx`) stores `VacancyForm` state
- `StepProps.onNext(data?: Partial<VacancyForm>)` merges data into the form
- `VacancyForm` in `types.ts` needs to be extended with `secondaryEducation` field

---

## Implementation Steps

- [ ] **Step 1: Inspect Figma design using MCP server** ✅ *(Done during planning)*
- [ ] **Step 2: Analyze existing codebase** ✅ *(Done during planning)*

### Step 3: Update TypeScript types in `types.ts`

Add the following types to `apps/ats-module/src/views/vacancies/types.ts`:

```typescript
interface SecondaryEducationRef {
  source: 'MASTER' | 'PENDING';
  id: string;
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

// Lookup item type (reusable for school, examination, etc.)
interface LookupItem {
  id: string;
  label: string;
  source: 'MASTER' | 'PENDING';
}
```

Update `VacancyForm` to include:
```typescript
interface VacancyForm {
  ...existing...
  secondaryEducation: SecondaryEducation[];
}
```

Export all new types from `types.ts`.

- [ ] **Step 3: Add types to `types.ts` and extend `VacancyForm`**

---

### Step 4: Create `secondary-education.service.ts`

**File**: `apps/ats-module/src/views/vacancies/services/secondary-education.service.ts`

```typescript
import { httpClient } from '@cgp/data-access';
import type { ApiResponse, LookupItem } from '@/views/vacancies/types';

export const secondaryEducationService = {
  getSchools: async (search?: string): Promise<ApiResponse<LookupItem[]>> => { ... },
  getSchoolLocations: async (search?: string): Promise<ApiResponse<LookupItem[]>> => { ... },
  getExaminations: async (search?: string): Promise<ApiResponse<LookupItem[]>> => { ... },
  getAwardingBodies: async (search?: string): Promise<ApiResponse<LookupItem[]>> => { ... },
  getFieldsOfStudy: async (search?: string): Promise<ApiResponse<LookupItem[]>> => { ... },
  addSchool: async (label: string): Promise<ApiResponse<LookupItem>> => { ... },
  addExamination: async (label: string): Promise<ApiResponse<LookupItem>> => { ... },
  addAwardingBody: async (label: string): Promise<ApiResponse<LookupItem>> => { ... },
  addFieldOfStudy: async (label: string): Promise<ApiResponse<LookupItem>> => { ... },
};
```

> **Note**: Endpoint paths are assumptions based on the existing `genderService` pattern (`/schools`, `/school-locations`, etc.). Confirm with the backend team.

Update `services/index.ts` to re-export `secondaryEducationService`.

- [ ] **Step 4: Create `secondary-education.service.ts` and update `services/index.ts`**

---

### Step 5: Create query hooks for lookups

Create one file per query in `hooks/queries/`:

- `use-schools-query.ts` — `useSchoolsQuery(search?: string)`
- `use-school-locations-query.ts` — `useSchoolLocationsQuery(search?: string)`
- `use-examinations-query.ts` — `useExaminationsQuery(search?: string)`
- `use-secondary-awarding-bodies-query.ts` — `useSecondaryAwardingBodiesQuery(search?: string)`
- `use-fields-of-study-query.ts` — `useFieldsOfStudyQuery(search?: string)`

Each follows the same pattern as `use-gender-query.ts` with `RESOURCE_QUERY_KEY`.

Update `hooks/queries/index.ts` to re-export all new hooks.

- [ ] **Step 5: Create 5 query hook files and update `hooks/queries/index.ts`**

---

### Step 6: Create mutation hooks for "Add Now"

Create one file per mutation in `hooks/mutations/`:

- `use-add-school-mutation.ts` — `useAddSchoolMutation()`
- `use-add-examination-mutation.ts` — `useAddExaminationMutation()`
- `use-add-awarding-body-mutation.ts` — `useAddAwardingBodyMutation()`
- `use-add-field-of-study-mutation.ts` — `useAddFieldOfStudyMutation()`

Each calls the corresponding `secondaryEducationService.add*()` method and invalidates the relevant query on success.

Update `hooks/mutations/index.ts` to re-export all new hooks.

- [ ] **Step 6: Create 4 mutation hook files and update `hooks/mutations/index.ts`**

---

### Step 7: Create form hook `use-secondary-education-form.ts`

**File**: `apps/ats-module/src/views/vacancies/hooks/use-secondary-education-form.ts`

- Uses `react-hook-form` with `zodResolver`
- Zod schema validates:
  - `isEnabled: z.boolean()`
  - `dataTakenFromCandidate: z.boolean()`
  - `content[0].acceptsHomeSchooling: z.boolean()`
  - `content[0].schools: z.array(...)` (max 10 entries)
  - `content[0].schoolLocations: z.array(...)` (max 10 entries)
  - `content[0].examinations: z.array(...)` (max 10 entries)
  - `content[0].secondaryAwardingBody: z.array(...)` (max 10 entries)
  - `content[0].fieldsOfStudy: z.array(...)` (max 10 entries)
  - `content[0].grade: z.string().max(80)`
  - `content[0].startDate: z.string().optional()`
  - `content[0].endDate: z.string().optional()` + cross-field validation (endDate > startDate)
  - `content[0].result: z.string().max(1000)`
- Default values: `isEnabled = false`, all other fields empty/false/[]
- Exports `useSecondaryEducationForm` and `SecondaryEducationFormValues`

Update `hooks/index.ts` to re-export the new hook.

- [ ] **Step 7: Create `use-secondary-education-form.ts` and update `hooks/index.ts`**

---

### Step 8: Create utility helper `secondary-education-helpers.ts`

**File**: `apps/ats-module/src/views/vacancies/utils/secondary-education-helpers.ts`

```typescript
// Converts form values to the VacancyForm secondaryEducation payload
export function toSecondaryEducationPayload(form: SecondaryEducationFormValues): SecondaryEducation[];

// Pre-populates form from existing VacancyForm data (for session restore)
export function fromSecondaryEducationResponse(data: SecondaryEducation[]): Partial<SecondaryEducationFormValues>;
```

Update `utils/index.ts` to re-export.

- [ ] **Step 8: Create `secondary-education-helpers.ts` and update `utils/index.ts`**

---

### Step 9: Implement `secondary-education-step.tsx`

**File**: `apps/ats-module/src/views/vacancies/components/form-steps/secondary-education-step.tsx`

Replace the current placeholder with the full implementation.

#### Component structure:

```tsx
function SecondaryEducationStep({ onNext, onBack }: StepProps) {
  const { t } = useTranslation('ats');
  const { form: vacancyForm } = useVacancyForm();

  // Pre-populate form from context
  const form = useSecondaryEducationForm(vacancyForm.secondaryEducation);
  const { watch, setValue, handleSubmit, control } = form;

  const isEnabled = watch('isEnabled');
  const dataTakenFromCandidate = watch('dataTakenFromCandidate');

  // Queries (enabled only when section is enabled)
  // Mutations for Add Now

  // Handlers
  const handleNext = handleSubmit((data) => {
    onNext({ secondaryEducation: toSecondaryEducationPayload(data) });
  });

  return (
    <div className="p-8 space-y-6">
      {/* Section Header: label + Toggle */}
      {/* Informational Banner (when isEnabled) */}
      {/* Card: form content (when isEnabled) */}
      {/* Footer: Back | Next buttons */}
    </div>
  );
}
```

#### Subcomponents (co-located in the same file or split if large):

- `SecondaryEducationSectionHeader` — label + Switch toggle
- `SecondaryEducationBanner` — informational message (Notif 1.2.4)
- `SecondaryEducationCard` — the card with all form fields

#### Key behaviors:
1. Toggle OFF → card hidden; `isEnabled = false`; Next sends disabled payload
2. Toggle ON → show banner + card
3. `dataTakenFromCandidate` checked → disable all other fields, `content = []` on submit
4. Character counters on Grade (80), Examination input (100), Awarding Body input (200), Field of Study input (100), Results (1000)
5. Date picker: format display as "12th Jan 2023"; Start Date max = today; End Date must be > Start Date
6. "Add Now" button in MultipleSelector dropdown calls the respective add mutation
7. Max 10 selections enforced with toast/inline error "Exceeded maximum of 10 selections."
8. Validation: if `isEnabled = true` and `dataTakenFromCandidate = false` and no fields filled → show blocking behavior (defer to CGP-1832 step navigation story)
9. Disable state of the "Add" (multiple entries) button — keep visible, keep disabled

- [ ] **Step 9: Implement `secondary-education-step.tsx` with full UI and logic**

---

### Step 10: Update i18n translations

Add keys to `apps/ats-module/src/app/utils/i18n/locales/en/ats.json`:

```json
"secondaryEducation": {
  "title": "Secondary Educational Requirements",
  "sectionTitle": "Secondary Education",
  "collectFromCandidates": "Collect information from candidates without specifying requirements",
  "acceptsHomeSchooling": "Accepts Home Schooling",
  "schoolName": "School Name",
  "schoolLocation": "School Location",
  "examination": "Examination",
  "awardingBody": "Awarding Body",
  "fieldOfStudy": "Field of study",
  "grade": "Grade",
  "startDate": "Start Date",
  "endDate": "End Date",
  "results": "Results",
  "bannerTitle": "Build the Application Form",
  "bannerMessage": "Certain fields in this section are always collected from candidates to support consistent candidate profiles. Any fields you don't select won't be collected.",
  "placeholders": {
    "school": "Select or add school",
    "schoolLocation": "Select location",
    "examination": "Select or add examination",
    "awardingBody": "Select or add awarding body",
    "fieldOfStudy": "Select or add field of study",
    "grade": "Enter grade",
    "startDate": "Select start date",
    "endDate": "Select end date",
    "results": "Enter your results"
  },
  "errors": {
    "maxSelections": "Exceeded maximum of 10 selections."
  }
}
```

- [ ] **Step 10: Add i18n keys to `ats.json`**

---

### Step 11: Update `VacancyFormContext` default form state

In `context/vacancy-form-context.tsx`, update `DEFAULT_FORM` to include:

```typescript
const DEFAULT_FORM: VacancyForm = {
  ...existing,
  secondaryEducation: [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }],
};
```

- [ ] **Step 11: Update `DEFAULT_FORM` in `vacancy-form-context.tsx`**

---

### Step 12: Code cleanup and consistency checks

- Verify all barrel (`index.ts`) files correctly re-export new artifacts
- Check TypeScript errors with `pnpm nx build ats-module --skip-nx-cache`
- Run linter: `pnpm nx eslint:lint ats-module`
- Verify no direct `httpClient` calls in UI components
- Verify no inline type definitions outside `types.ts`
- Confirm all user-facing strings use `t('...')` from `useTranslation('ats')`

- [ ] **Step 12: Code cleanup and consistency checks**

---

## Files Summary

### New files to create

| File | Purpose |
|---|---|
| `services/secondary-education.service.ts` | HTTP lookups + add-new for school, location, examination, awarding body, field of study |
| `hooks/queries/use-schools-query.ts` | School lookup query |
| `hooks/queries/use-school-locations-query.ts` | School location lookup query |
| `hooks/queries/use-examinations-query.ts` | Examination lookup query |
| `hooks/queries/use-secondary-awarding-bodies-query.ts` | Awarding body lookup query |
| `hooks/queries/use-fields-of-study-query.ts` | Field of study lookup query |
| `hooks/mutations/use-add-school-mutation.ts` | Add new school (PENDING) |
| `hooks/mutations/use-add-examination-mutation.ts` | Add new examination (PENDING) |
| `hooks/mutations/use-add-awarding-body-mutation.ts` | Add new awarding body (PENDING) |
| `hooks/mutations/use-add-field-of-study-mutation.ts` | Add new field of study (PENDING) |
| `hooks/use-secondary-education-form.ts` | Form hook (react-hook-form + Zod) |
| `utils/secondary-education-helpers.ts` | `toSecondaryEducationPayload`, `fromSecondaryEducationResponse` |

### Files to modify

| File | Change |
|---|---|
| `types.ts` | Add `SecondaryEducationRef`, `SecondaryEducationEntry`, `SecondaryEducation`, `LookupItem`; extend `VacancyForm` |
| `services/index.ts` | Re-export `secondaryEducationService` |
| `hooks/queries/index.ts` | Re-export 5 new query hooks |
| `hooks/mutations/index.ts` | Re-export 4 new mutation hooks |
| `hooks/index.ts` | Re-export `useSecondaryEducationForm` |
| `utils/index.ts` | Re-export helpers |
| `components/form-steps/secondary-education-step.tsx` | Replace placeholder with full implementation |
| `context/vacancy-form-context.tsx` | Update `DEFAULT_FORM` with `secondaryEducation` |
| `src/app/utils/i18n/locales/en/ats.json` | Add `secondaryEducation` translation keys |

---

## Assumptions & Clarifications Needed

1. **API endpoint paths** — The service uses assumed paths (`/schools`, `/school-locations`, `/examinations`, `/secondary-awarding-bodies`, `/fields-of-study`). Please confirm the correct backend endpoints.
2. **Add Now API** — Adding a new "PENDING" item (school, examination, etc.) is assumed to call a dedicated endpoint. Please confirm if this is a single generic endpoint or resource-specific ones.
3. **School Location source** — Since School Location is non-creatable (dropdown only), it only has `source: "MASTER"` items. Please confirm.
4. **Section toggle behavior on re-visit** — The plan pre-populates from `VacancyFormContext` within the session. No persistent draft load is included (per "in case of network interruption, data may be lost" NFR).
5. **"Add" button** (multiple entries) — The button is rendered but disabled, as per user story note: "The 'Add' button for multiple entries is intentionally retained in the UI but will remain disabled in this phase."
6. **Blocking pop-up modal for incomplete step** — When user tries Next without any field filled (CGP-1832), this plan defers to whatever mechanism CGP-1832 implements. The form hook will expose a `canProceed` boolean for the Next button disabled state.
7. **Data Discard Logic on toggle-off** — The confirmation prompt for disabling a section after entering data (CGP-1817) is noted but not implemented in this story — the plan respects the dependency boundary.
