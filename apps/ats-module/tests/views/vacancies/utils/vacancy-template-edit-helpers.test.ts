import { describe, expect, it } from 'vitest';

import type { VacancyTemplateUseRequestBody } from '@/views/vacancies/types';
import {
  toTemplateFormStateFromResponse,
  toUpdateTemplatePayload,
} from '@/views/vacancies/utils/vacancy-template-payload-helpers';

function makeRequestBody(
  data: Record<string, unknown>
): VacancyTemplateUseRequestBody {
  return {
    title: '',
    status: 'new',
    lastActiveStep: 'job-requirements',
    templateId: 't-1',
    data,
  };
}

describe('toTemplateFormStateFromResponse', () => {
  it('rehydrates per-field toggle state from a section content map', () => {
    const state = toTemplateFormStateFromResponse(
      makeRequestBody({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: { schools: true, grade: true, result: false },
          },
        ],
      })
    );

    expect(state.sections.secondaryEducation.dataTakenFromCandidate).toBe(
      false
    );
    expect(state.sections.secondaryEducation.fields.schools).toBe(true);
    expect(state.sections.secondaryEducation.fields.grade).toBe(true);
    expect(state.sections.secondaryEducation.fields.result).toBe(false);
    // A field absent from the content map defaults to off.
    expect(state.sections.secondaryEducation.fields.startDate).toBe(false);
  });

  it('lifts nested profileRequirement address flags onto their field codes', () => {
    const state = toTemplateFormStateFromResponse(
      makeRequestBody({
        profileRequirement: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: {
              gender: true,
              maritalStatus: false,
              addresses: [
                {
                  cityRefId: false,
                  stateRefId: true,
                  countryRefId: true,
                  postalCode: false,
                },
              ],
            },
          },
        ],
      })
    );

    expect(state.sections.profileRequirement.fields).toMatchObject({
      gender: true,
      maritalStatus: false,
      cityRefId: false,
      stateRefId: true,
      countryRefId: true,
      postalCode: false,
    });
  });

  it('forces all field toggles off when dataTakenFromCandidate is set (AC 5.3.1)', () => {
    const state = toTemplateFormStateFromResponse(
      makeRequestBody({
        skills: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          content: { skillCareerPath: false },
        },
      })
    );

    expect(state.sections.skills.dataTakenFromCandidate).toBe(true);
    expect(state.sections.skills.fields.skillCareerPath).toBe(false);
  });

  it('reads the Customizable Form section toggle and defaults missing sections to off', () => {
    const enabled = toTemplateFormStateFromResponse(
      makeRequestBody({ customizedForm: { isEnabled: true } })
    );
    expect(enabled.customizableForm).toBe(true);
    // Sections not present in the payload stay fully disabled.
    expect(enabled.sections.patents.fields.statuses).toBe(false);

    const disabled = toTemplateFormStateFromResponse(
      makeRequestBody({ customizedForm: { isEnabled: false } })
    );
    expect(disabled.customizableForm).toBe(false);
  });

  it('round-trips through the update payload builder', () => {
    const original = toTemplateFormStateFromResponse(
      makeRequestBody({
        languages: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: { language: true },
        },
        customizedForm: { isEnabled: true },
      })
    );

    const payload = toUpdateTemplatePayload(original, '  My Template  ');
    expect(payload.templateName).toBe('My Template');

    const rebuilt = toTemplateFormStateFromResponse(
      makeRequestBody(payload.data as Record<string, unknown>)
    );
    expect(rebuilt.sections.languages.fields.language).toBe(true);
    expect(rebuilt.customizableForm).toBe(true);
  });
});
