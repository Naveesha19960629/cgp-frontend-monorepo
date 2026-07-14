import { describe, expect, it } from 'vitest';

import { DEFAULT_FORM } from '@/views/vacancies/context/vacancy-form-context';
import type { VacancyTemplateUseRequestBody } from '@/views/vacancies/types';
import { toVacancyFormFromTemplateUsePayload } from '@/views/vacancies/utils/vacancy-template-use-helpers';

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

describe('toVacancyFormFromTemplateUsePayload', () => {
  it('lifts nested profileRequirement address field flags to the top-level visibility map', () => {
    const requestBody = makeRequestBody({
      profileRequirement: [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: {
            gender: false,
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
    });

    const { templateFieldVisibility } = toVacancyFormFromTemplateUsePayload(
      requestBody,
      DEFAULT_FORM
    );

    expect(templateFieldVisibility.profileRequirement).toEqual({
      gender: false,
      maritalStatus: false,
      cityRefId: false,
      stateRefId: true,
      countryRefId: true,
      postalCode: false,
    });
  });
});
