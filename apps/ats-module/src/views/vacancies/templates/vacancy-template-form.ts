import {
  TEMPLATE_SECTIONS,
  type TemplateSectionConfig,
} from '@/views/vacancies/templates/vacancy-template-config';

/**
 * Local form state for a single section.
 * `fields` maps each field code to whether its toggle is enabled.
 */
export interface TemplateSectionState {
  dataTakenFromCandidate: boolean;
  fields: Record<string, boolean>;
}

/**
 * Full local state for the Create Template form.
 *
 * The template name is intentionally kept outside this state and managed by the
 * page (derived from the auto-generated name until the recruiter edits it).
 */
export interface TemplateFormState {
  /** section key -> section state */
  sections: Record<string, TemplateSectionState>;
  /** Customizable Form section (toggle only, no fields). */
  customizableForm: boolean;
}

// ── Request payload types (candidate-service CreateVacancyTemplateRequest) ──────

export interface TemplateFieldRequest {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  content: Record<string, boolean>;
}

export interface CustomizableFormSectionRequest {
  isEnabled: boolean;
}

export type TemplateSectionData = Record<
  string,
  TemplateFieldRequest | TemplateFieldRequest[] | CustomizableFormSectionRequest
>;

export interface CreateVacancyTemplateRequest {
  templateName: string;
  refNumber?: string;
  data: TemplateSectionData;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Builds the initial form state: all toggles off, all checkboxes unchecked. */
export function createInitialTemplateFormState(): TemplateFormState {
  const sections: Record<string, TemplateSectionState> = {};
  for (const section of TEMPLATE_SECTIONS) {
    sections[section.key] = {
      dataTakenFromCandidate: false,
      fields: Object.fromEntries(
        section.fields.map(field => [field.code, false])
      ),
    };
  }
  return { sections, customizableForm: false };
}

/** True when a section has at least one field toggled on. */
function hasEnabledField(state: TemplateSectionState): boolean {
  return Object.values(state.fields).some(Boolean);
}

/**
 * Whether the Create button should be enabled: at least one field is toggled on,
 * a section checkbox is selected, or the Customizable Form section is enabled.
 * Mirrors the backend `validateAtLeastOneFieldOrSectionEnabled` rule.
 */
export function hasAnySelection(state: TemplateFormState): boolean {
  if (state.customizableForm) return true;
  return Object.values(state.sections).some(
    section => section.dataTakenFromCandidate || hasEnabledField(section)
  );
}

/**
 * A section is "enabled" when the recruiter opted into candidate data or turned
 * on at least one of its fields. The `content` map carries every field code with
 * its toggle value; the backend flattens it into per-field enablement flags.
 */
function toFieldRequest(state: TemplateSectionState): TemplateFieldRequest {
  // When data is taken from the candidate profile the individual fields are
  // hidden and must be treated as off/disabled, so their toggles are forced to
  // false regardless of any prior state.
  const content = state.dataTakenFromCandidate
    ? Object.fromEntries(Object.keys(state.fields).map(code => [code, false]))
    : { ...state.fields };

  return {
    isEnabled: state.dataTakenFromCandidate || hasEnabledField(state),
    dataTakenFromCandidate: state.dataTakenFromCandidate,
    content,
  };
}

/** Serialises the local form state into the create-template request body. */
export function buildCreateTemplatePayload(
  state: TemplateFormState,
  templateName: string,
  refNumber?: string
): CreateVacancyTemplateRequest {
  const data: TemplateSectionData = {};

  for (const section of TEMPLATE_SECTIONS) {
    const sectionState = state.sections[section.key];
    if (!sectionState) continue;

    const fieldRequest = toFieldRequest(sectionState);
    data[section.key] = section.kind === 'list' ? [fieldRequest] : fieldRequest;
  }

  data.customizedForm = { isEnabled: state.customizableForm };

  const payload: CreateVacancyTemplateRequest = {
    templateName: templateName.trim(),
    data,
  };

  // Send the previewed reference number so the created template keeps the
  // same Template ID that was shown to the recruiter (AC 2.g). When absent,
  // the backend generates one.
  const trimmedRef = refNumber?.trim();
  if (trimmedRef) {
    payload.refNumber = trimmedRef;
  }

  return payload;
}

export type { TemplateSectionConfig };
