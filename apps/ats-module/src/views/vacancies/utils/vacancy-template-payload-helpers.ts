import type {
  CreateVacancyTemplateRequest,
  TemplateFieldRequest,
  TemplateFormState,
  TemplateSectionData,
  TemplateSectionState,
} from '@/views/vacancies/types';
import { TEMPLATE_SECTIONS } from '@/views/vacancies/utils/vacancy-template-config';

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
export function toCreateTemplatePayload(
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
