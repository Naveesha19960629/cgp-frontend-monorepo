import { describe, expect, it } from 'vitest';

import type { VacancyForm } from '@/views/vacancies/types';
import {
  getApplicationFieldChanges,
  shouldNotifyApplicants,
} from '@/views/vacancies/utils/get-application-field-changes';

function buildForm(overrides: Partial<VacancyForm> = {}): VacancyForm {
  return {
    title: 'Software Engineer',
    status: 'live',
    lastActiveStep: 'schedule-vacancy',
    applicantCount: 5,
    jobRequirements: [],
    profileRequirements: {
      isEnabled: false,
      dataTakenFromCandidate: false,
      gender: { id: '', label: '' },
      maritalStatus: { id: '', label: '' },
      addresses: [],
    },
    secondaryEducation: [],
    tertiaryEducation: [],
    customizableForm: {
      isEnabled: true,
      sectionTitle: 'Extra Questions',
      forms: [{ id: 1, title: 'Personal Details', questions: [] }],
    },
    schedule: {
      schedulePublishAt: '2099-12-20T10:00:00 AM',
      expirationAt: '2099-12-30T11:59:59 PM',
    },
    ...overrides,
  };
}

describe('getApplicationFieldChanges', () => {
  it('returns an empty array when nothing changed', () => {
    const form = buildForm();
    expect(getApplicationFieldChanges(form, form)).toEqual([]);
  });

  it('classifies a new question on an existing form card as Added', () => {
    const original = buildForm();
    const edited = buildForm({
      customizableForm: {
        isEnabled: true,
        sectionTitle: 'Extra Questions',
        forms: [
          {
            id: 1,
            title: 'Personal Details',
            questions: [
              {
                id: 1,
                text: 'Nationality',
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

    expect(getApplicationFieldChanges(original, edited)).toContainEqual({
      formName: 'Personal Details',
      fieldName: 'questions',
      changeType: 'Added',
    });
  });

  it('classifies an edit to an existing question as Updated', () => {
    const original = buildForm({
      customizableForm: {
        isEnabled: true,
        sectionTitle: 'Extra Questions',
        forms: [
          {
            id: 1,
            title: 'Personal Details',
            questions: [
              {
                id: 1,
                text: 'Nationality',
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
    const edited = buildForm({
      customizableForm: {
        isEnabled: true,
        sectionTitle: 'Extra Questions',
        forms: [
          {
            id: 1,
            title: 'Personal Details',
            questions: [
              {
                id: 1,
                text: 'Country of Origin',
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

    expect(getApplicationFieldChanges(original, edited)).toContainEqual({
      formName: 'Personal Details',
      fieldName: 'text',
      changeType: 'Updated',
    });
  });

  it('classifies a brand new form card as Added', () => {
    const original = buildForm();
    const edited = buildForm({
      customizableForm: {
        isEnabled: true,
        sectionTitle: 'Extra Questions',
        forms: [
          { id: 1, title: 'Personal Details', questions: [] },
          { id: 2, title: 'Education', questions: [] },
        ],
      },
    });

    expect(getApplicationFieldChanges(original, edited)).toContainEqual({
      formName: 'customizableForm',
      fieldName: 'forms',
      changeType: 'Added',
    });
  });

  it('classifies a changed preferred-value section as PreferredValuesUpdated', () => {
    const original = buildForm({
      secondaryEducation: [
        { isEnabled: false, dataTakenFromCandidate: false, content: [] },
      ],
    });
    const edited = buildForm({
      secondaryEducation: [
        { isEnabled: true, dataTakenFromCandidate: false, content: [] },
      ],
    });

    expect(getApplicationFieldChanges(original, edited)).toContainEqual({
      formName: 'secondaryEducation',
      fieldName: 'isEnabled',
      changeType: 'PreferredValuesUpdated',
    });
  });
});

describe('shouldNotifyApplicants', () => {
  const change = {
    formName: 'secondaryEducation',
    fieldName: 'isEnabled',
    changeType: 'PreferredValuesUpdated' as const,
  };

  it('returns true when there are applicants and at least one field changed', () => {
    expect(shouldNotifyApplicants(true, [change])).toBe(true);
  });

  it('returns false when there are no applicants even if fields changed', () => {
    expect(shouldNotifyApplicants(false, [change])).toBe(false);
  });

  it('returns false when there are applicants but nothing changed', () => {
    expect(shouldNotifyApplicants(true, [])).toBe(false);
  });
});
