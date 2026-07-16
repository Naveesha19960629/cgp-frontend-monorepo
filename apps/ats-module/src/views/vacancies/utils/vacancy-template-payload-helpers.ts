import type {
  CreateVacancyTemplateRequest,
  TemplateFieldRequest,
  TemplateFormState,
  TemplateSectionData,
  TemplateSectionState,
  UpdateVacancyTemplateRequest,
  VacancyTemplateUseRequestBody,
} from '@/views/vacancies/types';
import {
  AUTO_INCLUDED_SECTION_FIELD_CODES,
  TEMPLATE_SECTIONS,
} from '@/views/vacancies/utils/vacancy-template-config';

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

/**
 * Serialises the per-section form state into the template request `data` map.
 * Shared by the create (POST) and update (PUT) payload builders — both send the
 * exact same section structure; only the envelope (refNumber) differs.
 */
function buildTemplateData(state: TemplateFormState): TemplateSectionData {
  const data: TemplateSectionData = {};

  for (const section of TEMPLATE_SECTIONS) {
    const sectionState = state.sections[section.key];
    if (!sectionState) continue;

    const fieldRequest = toFieldRequest(sectionState);
    data[section.key] = section.kind === 'list' ? [fieldRequest] : fieldRequest;
  }

  // Job Requirement and Schedule are not shown on the form but must always be
  // included in the template with every field enabled (AC Out of Scope #2).
  // `dataTakenFromCandidate` stays false — these are template-level fields,
  // never sourced from the candidate profile.
  for (const [key, fieldCodes] of Object.entries(
    AUTO_INCLUDED_SECTION_FIELD_CODES
  )) {
    data[key] = {
      isEnabled: true,
      dataTakenFromCandidate: false,
      content: Object.fromEntries(fieldCodes.map(code => [code, true])),
    };
  }

  data.customizedForm = { isEnabled: state.customizableForm };

  return data;
}

/** Serialises the local form state into the create-template request body. */
export function toCreateTemplatePayload(
  state: TemplateFormState,
  templateName: string,
  refNumber?: string
): CreateVacancyTemplateRequest {
  const payload: CreateVacancyTemplateRequest = {
    templateName: templateName.trim(),
    data: buildTemplateData(state),
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

/**
 * Serialises the local form state into the update-template request body (PUT
 * /vacancy-templates/{id}). Same section structure as create; the Template ID
 * lives in the URL and the reference number is immutable, so neither is sent.
 */
export function toUpdateTemplatePayload(
  state: TemplateFormState,
  templateName: string
): UpdateVacancyTemplateRequest {
  return {
    templateName: templateName.trim(),
    data: buildTemplateData(state),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Flattens a section `content` map into `fieldCode -> enabled`. Most fields sit
 * at the top level, but some sections nest fields inside a group array/object
 * (e.g. `profileRequirement` wraps the address fields in a `content.addresses`
 * array). We descend into nested objects/arrays and lift every leaf boolean up
 * by its field code — mirrors `collectFieldFlags` in the Use-Template mapper.
 */
function collectFieldFlags(
  node: Record<string, unknown>,
  out: Record<string, boolean>
): void {
  for (const [code, value] of Object.entries(node)) {
    if (typeof value === 'boolean') {
      out[code] = value;
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (isRecord(item)) collectFieldFlags(item, out);
      }
    } else if (isRecord(value)) {
      collectFieldFlags(value, out);
    }
  }
}

/**
 * Reverse of {@link buildTemplateData}: rehydrates the Edit Template form state
 * from the `requestBody` returned by GET /vacancy-templates/{id}.
 *
 * The `content` booleans are field-enablement flags, so they map straight back
 * onto each field toggle. A section serialises as a single object or a one-item
 * array; both are unwrapped. Sections absent or `null` in the payload keep their
 * default (all toggles off). When a section had `dataTakenFromCandidate` set, its
 * individual field toggles are forced off (AC 5.3.1) — the checkbox alone
 * represents that section.
 */
export function toTemplateFormStateFromResponse(
  requestBody: VacancyTemplateUseRequestBody
): TemplateFormState {
  const state = createInitialTemplateFormState();
  const data = isRecord(requestBody?.data) ? requestBody.data : {};

  for (const section of TEMPLATE_SECTIONS) {
    const raw = data[section.key];
    const entry = isRecord(Array.isArray(raw) ? raw[0] : raw)
      ? ((Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>)
      : null;
    if (!entry) continue;

    const sectionState = state.sections[section.key];
    if (!sectionState) continue;

    sectionState.dataTakenFromCandidate = Boolean(entry.dataTakenFromCandidate);

    const flags: Record<string, boolean> = {};
    if (isRecord(entry.content)) collectFieldFlags(entry.content, flags);

    for (const field of section.fields) {
      sectionState.fields[field.code] = sectionState.dataTakenFromCandidate
        ? false
        : Boolean(flags[field.code]);
    }
  }

  const customized = data.customizedForm;
  state.customizableForm = Boolean(
    isRecord(customized) && customized.isEnabled === true
  );

  return state;
}
