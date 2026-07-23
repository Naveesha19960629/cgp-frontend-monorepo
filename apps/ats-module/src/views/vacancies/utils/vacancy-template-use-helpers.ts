/**
 * Maps the `requestBody` returned by GET /vacancy-templates/{id} (the "Use
 * Template" payload) into the local `VacancyForm` plus the two structures the
 * template-scoped wizard needs:
 *
 *  - `visibleStepKeys`   — which wizard steps appear in the navigator
 *                          (mandatory steps + the sections the template included).
 *  - `templateFieldVisibility` — per section, which field codes are visible.
 *
 * IMPORTANT: the `content` booleans in the payload are field-VISIBILITY flags,
 * not values. This mapper only records them into `templateFieldVisibility` and
 * marks each present section enabled; all form values stay empty so the recruiter
 * fills them in. `customizedForm` is the exception — it carries actual copied
 * form data, reused verbatim via `normalizeCustomizableFormSection`.
 */
import type {
  VacancyForm,
  VacancyTemplateUseRequestBody,
} from '@/views/vacancies/types';
import { normalizeCustomizableFormSection } from '@/views/vacancies/utils/vacancy-edit-response-helpers';
import {
  MANDATORY_TEMPLATE_STEP_KEYS,
  SECTION_KEY_TO_STEP_KEY,
} from '@/views/vacancies/utils/vacancy-template-config';
import {
  collectFieldFlags,
  isRecord,
  unwrapSection,
} from '@/views/vacancies/utils/vacancy-template-tree-helpers';

interface TemplateUseMapResult {
  form: VacancyForm;
  visibleStepKeys: string[];
  templateFieldVisibility: Record<string, Record<string, boolean>>;
}

interface SectionFlags {
  dataTakenFromCandidate: boolean;
}

function readContentFlags(
  section: Record<string, unknown>
): Record<string, boolean> {
  if (!isRecord(section.content)) return {};
  const out: Record<string, boolean> = {};
  collectFieldFlags(section.content, out);
  return out;
}

/**
 * Per backend section key, mark the matching `VacancyForm` section enabled and
 * carry over the candidate-profile flag. Values are intentionally left empty.
 */
const SECTION_APPLIERS: Record<
  string,
  (form: VacancyForm, flags: SectionFlags) => void
> = {
  jobRequirement: (form, flags) => {
    const entry = form.jobRequirements[0];
    if (entry) {
      entry.isEnabled = true;
      entry.dataTakenFromCandidate = flags.dataTakenFromCandidate;
    }
  },
  profileRequirement: (form, flags) => {
    form.profileRequirements.isEnabled = true;
    form.profileRequirements.dataTakenFromCandidate =
      flags.dataTakenFromCandidate;
  },
  secondaryEducation: (form, flags) => {
    const entry = form.secondaryEducation[0];
    if (entry) {
      entry.isEnabled = true;
      entry.dataTakenFromCandidate = flags.dataTakenFromCandidate;
    }
  },
  tertiaryEducation: (form, flags) => {
    const entry = form.tertiaryEducation[0];
    if (entry) {
      entry.isEnabled = true;
      entry.dataTakenFromCandidate = flags.dataTakenFromCandidate;
    }
  },
  projects: (form, flags) => {
    if (form.projectsRequirements) {
      form.projectsRequirements.isEnabled = true;
      form.projectsRequirements.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  publications: (form, flags) => {
    if (form.preferredPublications) {
      form.preferredPublications.isEnabled = true;
      form.preferredPublications.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  clubsAndSocieties: (form, flags) => {
    if (form.preferredClubSocieties) {
      form.preferredClubSocieties.isEnabled = true;
      form.preferredClubSocieties.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  sports: (form, flags) => {
    if (form.preferredSports) {
      form.preferredSports.isEnabled = true;
      form.preferredSports.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  volunteering: (form, flags) => {
    if (form.preferredVolunteering) {
      form.preferredVolunteering.isEnabled = true;
      form.preferredVolunteering.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  patents: (form, flags) => {
    if (form.patents) {
      form.patents.isEnabled = true;
      form.patents.dataTakenFromCandidate = flags.dataTakenFromCandidate;
    }
  },
  honoursAndAwards: (form, flags) => {
    if (form.preferredHonoursAwards) {
      form.preferredHonoursAwards.isEnabled = true;
      form.preferredHonoursAwards.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  licensesAndCertifications: (form, flags) => {
    const entry = form.licenseCertificates?.[0];
    if (entry) {
      entry.isEnabled = true;
      entry.dataTakenFromCandidate = flags.dataTakenFromCandidate;
    }
  },
  skills: (form, flags) => {
    if (form.preferredSkills) {
      form.preferredSkills.isEnabled = true;
      form.preferredSkills.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  languages: (form, flags) => {
    if (form.preferredLanguages) {
      form.preferredLanguages.isEnabled = true;
      form.preferredLanguages.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  causes: (form, flags) => {
    if (form.preferredCauses) {
      form.preferredCauses.isEnabled = true;
      form.preferredCauses.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  hobbyList: (form, flags) => {
    if (form.preferredHobbies) {
      form.preferredHobbies.isEnabled = true;
      form.preferredHobbies.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
  industry: (form, flags) => {
    if (form.preferredIndustries) {
      form.preferredIndustries.isEnabled = true;
      form.preferredIndustries.dataTakenFromCandidate =
        flags.dataTakenFromCandidate;
    }
  },
};

// Job Requirements is a mandatory step: always shown and enabled, all fields
// visible, regardless of the template section's isEnabled flag.
function applyJobRequirementSection(
  form: VacancyForm,
  rawValue: unknown
): void {
  const jobSection = unwrapSection(rawValue);
  SECTION_APPLIERS.jobRequirement(form, {
    dataTakenFromCandidate: Boolean(jobSection?.dataTakenFromCandidate),
  });
}

// Customizable Forms carry real copied data — reuse the edit-flow normaliser.
// Only include the section when the template has it enabled. Returns whether
// the section was included, so the caller can add its step key.
function applyCustomizedFormSection(
  form: VacancyForm,
  rawValue: unknown
): boolean {
  const customizedForm = normalizeCustomizableFormSection(rawValue, {
    isEnabled: false,
    sectionTitle: '',
    forms: [],
  });
  if (!customizedForm.isEnabled) return false;

  form.customizableForm = customizedForm;
  return true;
}

// Handles every remaining (optional) section key: applies it to `form` when
// enabled, and records the step key / field-visibility map for the navigator.
function applyOptionalSection(
  sectionKey: string,
  rawValue: unknown,
  form: VacancyForm,
  visibleStepKeys: Set<string>,
  templateFieldVisibility: Record<string, Record<string, boolean>>
): void {
  const section = unwrapSection(rawValue);
  if (!section) return;

  // Optional sections appear in the navigator ONLY if the template enabled them
  // (AC 7.1 / 7.7). A present-but-disabled section is treated as not included.
  if (section.isEnabled !== true) return;

  const stepKey = SECTION_KEY_TO_STEP_KEY[sectionKey];
  if (stepKey) visibleStepKeys.add(stepKey);

  SECTION_APPLIERS[sectionKey]?.(form, {
    dataTakenFromCandidate: Boolean(section.dataTakenFromCandidate),
  });
  templateFieldVisibility[sectionKey] = readContentFlags(section);
}

function toVacancyFormFromTemplateUsePayload(
  requestBody: VacancyTemplateUseRequestBody,
  prev: VacancyForm
): TemplateUseMapResult {
  const form = structuredClone(prev);
  form.title = '';
  form.status = 'new';
  form.lastActiveStep = 'job-requirements';

  const visibleStepKeys = new Set<string>(MANDATORY_TEMPLATE_STEP_KEYS);
  const templateFieldVisibility: Record<string, Record<string, boolean>> = {};

  const data = isRecord(requestBody.data) ? requestBody.data : {};

  for (const [sectionKey, rawValue] of Object.entries(data)) {
    if (rawValue === null || rawValue === undefined) continue;

    if (sectionKey === 'jobRequirement') {
      applyJobRequirementSection(form, rawValue);
      continue;
    }

    // Schedule is a mandatory step: always shown, no field-visibility map.
    if (sectionKey === 'schedule') continue;

    if (sectionKey === 'customizedForm') {
      if (applyCustomizedFormSection(form, rawValue)) {
        visibleStepKeys.add('customizable-form');
      }
      continue;
    }

    applyOptionalSection(
      sectionKey,
      rawValue,
      form,
      visibleStepKeys,
      templateFieldVisibility
    );
  }

  return {
    form,
    visibleStepKeys: Array.from(visibleStepKeys),
    templateFieldVisibility,
  };
}

export { toVacancyFormFromTemplateUsePayload };
export type { TemplateUseMapResult };
