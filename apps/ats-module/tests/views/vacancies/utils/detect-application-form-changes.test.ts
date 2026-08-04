import { describe, expect, it } from 'vitest';

import type { VacancyForm } from '@/views/vacancies/types';
import { detectApplicationFormChanges } from '@/views/vacancies/utils/detect-application-form-changes';

function buildForm(overrides: Partial<VacancyForm> = {}): VacancyForm {
  return {
    title: 'Software Engineer',
    status: 'on_hold',
    lastActiveStep: 'schedule-vacancy',
    applicantCount: 5,
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
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    tertiaryEducation: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    preferredSkills: {
      isEnabled: true,
      dataTakenFromCandidate: false,
      skills: [
        {
          skillId: 'skill-1',
          skillName: 'React',
          careerPathName: 'Engineering',
          displayValue: 'React',
        },
      ],
    },
    customizableForm: {
      isEnabled: true,
      sectionTitle: 'Extra Questions',
      forms: [
        {
          id: 1,
          title: 'Card 1',
          questions: [],
        },
      ],
    },
    schedule: {
      schedulePublishAt: '2099-12-20T10:00:00 AM',
      expirationAt: '2099-12-30T11:59:59 PM',
    },
    ...overrides,
  };
}

describe('detectApplicationFormChanges', () => {
  it('reports no changes when original and edited forms are identical', () => {
    const original = buildForm();
    const edited = buildForm();

    const result = detectApplicationFormChanges(original, edited);

    expect(result).toEqual({
      hasNewFields: false,
      hasUpdatedPreferredValues: false,
      changedSections: [],
      changedFields: [],
    });
  });

  it('does not flag a change when only the schedule section differs', () => {
    const original = buildForm();
    const edited = buildForm({
      schedule: {
        schedulePublishAt: '2099-11-01T09:00:00 AM',
        expirationAt: '2099-12-30T11:59:59 PM',
      },
    });

    const result = detectApplicationFormChanges(original, edited);

    expect(result.hasNewFields).toBe(false);
    expect(result.hasUpdatedPreferredValues).toBe(false);
    expect(result.changedSections).toEqual([]);
  });

  it('detects a new/changed field in the customizable form section', () => {
    const original = buildForm();
    const edited = buildForm({
      customizableForm: {
        isEnabled: true,
        sectionTitle: 'Extra Questions',
        forms: [
          {
            id: 1,
            title: 'Card 1',
            questions: [
              {
                id: 1,
                text: 'What is your notice period?',
                type: 'SHORT_ANSWER',
                required: true,
                options: [],
                from: 0,
                to: 0,
                startLabel: '',
                endLabel: '',
              },
            ],
          },
        ],
      },
    });

    const result = detectApplicationFormChanges(original, edited);

    expect(result.hasNewFields).toBe(true);
    expect(result.hasUpdatedPreferredValues).toBe(false);
    expect(result.changedSections).toContain('customizableForm');
    expect(
      result.changedFields.some(path => path.startsWith('customizableForm'))
    ).toBe(true);
  });

  it('detects an updated preferred value section', () => {
    const original = buildForm();
    const edited = buildForm({
      preferredSkills: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        skills: [
          {
            skillId: 'skill-1',
            skillName: 'React',
            careerPathName: 'Engineering',
            displayValue: 'React',
          },
          {
            skillId: 'skill-2',
            skillName: 'TypeScript',
            careerPathName: 'Engineering',
            displayValue: 'TypeScript',
          },
        ],
      },
    });

    const result = detectApplicationFormChanges(original, edited);

    expect(result.hasUpdatedPreferredValues).toBe(true);
    expect(result.hasNewFields).toBe(false);
    expect(result.changedSections).toContain('preferredSkills');
    expect(
      result.changedFields.some(path => path.startsWith('preferredSkills'))
    ).toBe(true);
  });

  it('reports both flags and multiple changed sections when several sections differ', () => {
    const original = buildForm();
    const edited = buildForm({
      customizableForm: {
        isEnabled: true,
        sectionTitle: 'Extra Questions Updated',
        forms: [],
      },
      preferredLanguages: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        languages: [{ id: 'lang-1', label: 'English' }],
      },
    });

    const result = detectApplicationFormChanges(original, edited);

    expect(result.hasNewFields).toBe(true);
    expect(result.hasUpdatedPreferredValues).toBe(true);
    expect(result.changedSections).toEqual(
      expect.arrayContaining(['customizableForm', 'preferredLanguages'])
    );
  });
});
