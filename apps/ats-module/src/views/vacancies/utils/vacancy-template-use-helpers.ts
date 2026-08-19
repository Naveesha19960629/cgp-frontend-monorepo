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
 *
 * The template's `dataTakenFromCandidate` flag is deliberately NOT carried over
 * (DQCGP-3661): the "data will be taken from the candidate profile" checkbox is
 * always presented unticked so the recruiter opts in explicitly. Only the
 * template's field VISIBILITY is inherited.
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

function readContentFlags(
  section: Record<string, unknown>
): Record<string, boolean> {
  if (!isRecord(section.content)) return {};
  const out: Record<string, boolean> = {};
  collectFieldFlags(section.content, out);
  return out;
}

/** The two section-level flags every `VacancyForm` section shares. */
interface SectionToggles {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
}

/**
 * Per backend section key, locate the matching `VacancyForm` section. Returns
 * undefined when the form has no such section, in which case there is nothing
 * to enable. List-shaped sections are represented by their first entry.
 */
const SECTION_TARGETS: Record<
  string,
  (form: VacancyForm) => SectionToggles | undefined
> = {
  jobRequirement: form => form.jobRequirements[0],
  profileRequirement: form => form.profileRequirements,
  secondaryEducation: form => form.secondaryEducation[0],
  tertiaryEducation: form => form.tertiaryEducation[0],
  projects: form => form.projectsRequirements,
  publications: form => form.preferredPublications,
  clubsAndSocieties: form => form.preferredClubSocieties,
  sports: form => form.preferredSports,
  volunteering: form => form.preferredVolunteering,
  patents: form => form.patents,
  honoursAndAwards: form => form.preferredHonoursAwards,
  licensesAndCertifications: form => form.licenseCertificates?.[0],
  skills: form => form.preferredSkills,
  languages: form => form.preferredLanguages,
  causes: form => form.preferredCauses,
  hobbyList: form => form.preferredHobbies,
  industry: form => form.preferredIndustries,
};

/**
 * Marks a section enabled (AC 8.2 — template sections are on by default) and
 * leaves its values empty for the recruiter to fill in. The candidate-profile
 * checkbox is always reset to unticked (DQCGP-3661) so the recruiter opts in
 * explicitly rather than inheriting the template's choice.
 */
function enableSection(form: VacancyForm, sectionKey: string): void {
  const section = SECTION_TARGETS[sectionKey]?.(form);
  if (!section) return;

  section.isEnabled = true;
  section.dataTakenFromCandidate = false;
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

  enableSection(form, sectionKey);
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

    // Job Requirements is a mandatory step: always shown and enabled, all
    // fields visible, regardless of the template section's isEnabled flag.
    if (sectionKey === 'jobRequirement') {
      enableSection(form, 'jobRequirement');
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
