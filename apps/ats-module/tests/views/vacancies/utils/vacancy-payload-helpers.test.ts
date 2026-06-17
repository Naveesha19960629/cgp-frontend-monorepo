import { describe, expect, it } from 'vitest';

import type { VacancyForm } from '@/views/vacancies/types';
import { toCreateVacancyPayload } from '@/views/vacancies/utils';

function buildBaseForm(overrides?: Partial<VacancyForm>): VacancyForm {
  return {
    title: 'Test Vacancy',
    status: 'draft',
    lastActiveStep: 'secondary-education',
    jobRequirements: [
      {
        isEnabled: true,
        dataTakenFromCandidate: false,
        discipline: [],
        careerPath: [],
        level: [],
        role: [],
        jobTitle: [],
        employmentType: [],
        workSchedule: [],
        engagementModel: [],
        description: '',
      },
    ],
    profileRequirements: {
      isEnabled: false,
      dataTakenFromCandidate: false,
      gender: { id: '', label: '' },
      maritalStatus: { id: '', label: '' },
      addresses: [],
    },
    secondaryEducation: [
      {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            acceptsHomeSchooling: false,
            schools: [],
            schoolLocations: [],
            examinations: [],
            secondaryAwardingBody: [],
            fieldsOfStudy: [],
            grade: 'A',
            startDate: '2026-06-01T18:30:00.000Z',
            endDate: '2026-06-02T18:30:00.000Z',
            result: 'Pass',
          },
        ],
      },
    ],
    tertiaryEducation: [
      {
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      },
    ],
    ...overrides,
  };
}

describe('toCreateVacancyPayload', () => {
  it('normalizes secondary education dates to yyyy-MM-dd for API payload', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());
    const secondaryEducation = payload.data.secondaryEducation;

    expect(secondaryEducation).toBeDefined();
    expect(secondaryEducation).toHaveLength(1);
    const entry = secondaryEducation[0].content[0];

    expect(entry.startDate).toBe('2026-06-01');
    expect(entry.endDate).toBe('2026-06-02');
  });

  it('preserves empty secondary education dates', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                acceptsHomeSchooling: false,
                schools: [],
                schoolLocations: [],
                examinations: [],
                secondaryAwardingBody: [],
                fieldsOfStudy: [],
                grade: 'B',
                startDate: '',
                endDate: '',
                result: 'Pending',
              },
            ],
          },
        ],
      })
    );
    const secondaryEducation = payload.data.secondaryEducation;

    expect(secondaryEducation).toBeDefined();
    expect(secondaryEducation).toHaveLength(1);
    const entry = secondaryEducation[0].content[0];

    expect(entry.startDate).toBe('');
    expect(entry.endDate).toBe('');
  });
});
