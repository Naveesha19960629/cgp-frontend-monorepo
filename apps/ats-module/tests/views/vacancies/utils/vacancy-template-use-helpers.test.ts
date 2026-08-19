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

  it('leaves the candidate-profile checkbox unticked while still inheriting field visibility (DQCGP-3661)', () => {
    const requestBody = makeRequestBody({
      profileRequirement: [
        {
          isEnabled: true,
          dataTakenFromCandidate: true,
          content: { gender: true, maritalStatus: false },
        },
      ],
    });

    const { form, templateFieldVisibility, visibleStepKeys } =
      toVacancyFormFromTemplateUsePayload(requestBody, DEFAULT_FORM);

    // The section is still included and enabled by default (AC 8.2)...
    expect(visibleStepKeys).toContain('profile-requirements');
    expect(form.profileRequirements.isEnabled).toBe(true);
    // ...and its field visibility is still inherited from the template (AC 7.2)...
    expect(templateFieldVisibility.profileRequirement).toEqual({
      gender: true,
      maritalStatus: false,
    });
    // ...but the recruiter opts into the candidate-profile option themselves.
    expect(form.profileRequirements.dataTakenFromCandidate).toBe(false);
  });

  it('always includes the mandatory step keys even when data is empty', () => {
    const requestBody = makeRequestBody({});

    const { visibleStepKeys, templateFieldVisibility, form } =
      toVacancyFormFromTemplateUsePayload(requestBody, DEFAULT_FORM);

    expect(visibleStepKeys).toEqual(
      expect.arrayContaining(['job-requirements', 'schedule-vacancy'])
    );
    expect(visibleStepKeys).toHaveLength(2);
    expect(templateFieldVisibility).toEqual({});
    expect(form.title).toBe('');
    expect(form.status).toBe('new');
    expect(form.lastActiveStep).toBe('job-requirements');
  });

  it('ignores null/undefined section values in the data map', () => {
    const requestBody = makeRequestBody({
      skills: null,
      languages: undefined,
    });

    const { visibleStepKeys, form } = toVacancyFormFromTemplateUsePayload(
      requestBody,
      DEFAULT_FORM
    );

    expect(visibleStepKeys).not.toContain('preferred-skills');
    expect(visibleStepKeys).not.toContain('preferred-languages');
    expect(form.preferredSkills?.isEnabled).toBe(false);
    expect(form.preferredLanguages?.isEnabled).toBe(false);
  });

  it('always enables job requirements from the payload, mandatory regardless of isEnabled', () => {
    const requestBody = makeRequestBody({
      jobRequirement: [
        {
          isEnabled: false,
          dataTakenFromCandidate: true,
          content: { discipline: true },
        },
      ],
    });

    const { form, visibleStepKeys } = toVacancyFormFromTemplateUsePayload(
      requestBody,
      DEFAULT_FORM
    );

    expect(form.jobRequirements[0].isEnabled).toBe(true);
    // DQCGP-3661: the template's flag is never carried over.
    expect(form.jobRequirements[0].dataTakenFromCandidate).toBe(false);
    expect(visibleStepKeys).toContain('job-requirements');
  });

  it('skips the schedule section entirely (mandatory step, no visibility map)', () => {
    const requestBody = makeRequestBody({
      schedule: { isEnabled: true, content: { schedulePublishAt: true } },
    });

    const { templateFieldVisibility, visibleStepKeys } =
      toVacancyFormFromTemplateUsePayload(requestBody, DEFAULT_FORM);

    expect(templateFieldVisibility.schedule).toBeUndefined();
    expect(visibleStepKeys).toEqual(
      expect.arrayContaining(['job-requirements', 'schedule-vacancy'])
    );
  });

  it('includes the customizable form step and copies its data when enabled', () => {
    const requestBody = makeRequestBody({
      customizedForm: {
        isEnabled: true,
        sectionTitle: 'Extra Questions',
        forms: [],
      },
    });

    const { form, visibleStepKeys } = toVacancyFormFromTemplateUsePayload(
      requestBody,
      DEFAULT_FORM
    );

    expect(visibleStepKeys).toContain('customizable-form');
    expect(form.customizableForm!.isEnabled).toBe(true);
    expect(form.customizableForm!.sectionTitle).toBe('Extra Questions');
  });

  it('does not add the customizable form step when the section is disabled', () => {
    const requestBody = makeRequestBody({
      customizedForm: {
        isEnabled: false,
        sectionTitle: 'Extra Questions',
        forms: [],
      },
    });

    const { form, visibleStepKeys } = toVacancyFormFromTemplateUsePayload(
      requestBody,
      DEFAULT_FORM
    );

    expect(visibleStepKeys).not.toContain('customizable-form');
    expect(form.customizableForm!.isEnabled).toBe(false);
  });

  it('treats a present-but-disabled optional section as not included', () => {
    const requestBody = makeRequestBody({
      skills: [
        {
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: { skillCareerPath: true },
        },
      ],
    });

    const { visibleStepKeys, templateFieldVisibility, form } =
      toVacancyFormFromTemplateUsePayload(requestBody, DEFAULT_FORM);

    expect(visibleStepKeys).not.toContain('preferred-skills');
    expect(templateFieldVisibility.skills).toBeUndefined();
    expect(form.preferredSkills?.isEnabled).toBe(false);
  });

  it('ignores a section value that unwraps to a non-record (e.g. a plain string)', () => {
    const requestBody = makeRequestBody({
      skills: 'not-a-record',
    });

    const { visibleStepKeys } = toVacancyFormFromTemplateUsePayload(
      requestBody,
      DEFAULT_FORM
    );

    expect(visibleStepKeys).not.toContain('preferred-skills');
  });

  it('enables every optional section applier and records its field visibility and step key', () => {
    const optionalSectionsData: Record<string, unknown> = {
      secondaryEducation: [
        {
          isEnabled: true,
          dataTakenFromCandidate: true,
          content: { schools: true },
        },
      ],
      tertiaryEducation: [
        {
          isEnabled: true,
          dataTakenFromCandidate: true,
          content: { qualificationName: true },
        },
      ],
      projects: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { organization: true },
      },
      publications: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { acceptedPublisherName: true },
      },
      clubsAndSocieties: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { clubSociety: true },
      },
      sports: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { nameOfSport: true },
      },
      volunteering: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { organization: true },
      },
      patents: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { relatedIndustry: true },
      },
      honoursAndAwards: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { title: true },
      },
      licensesAndCertifications: [
        {
          isEnabled: true,
          dataTakenFromCandidate: true,
          content: { nameOfLicenseCert: true },
        },
      ],
      skills: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { skillCareerPath: true },
      },
      languages: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { language: true },
      },
      causes: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { cause: true },
      },
      hobbyList: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { hobby: true },
      },
      industry: {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { industry: true },
      },
    };

    const requestBody = makeRequestBody(optionalSectionsData);

    const { form, visibleStepKeys, templateFieldVisibility } =
      toVacancyFormFromTemplateUsePayload(requestBody, DEFAULT_FORM);

    expect(form.secondaryEducation[0].isEnabled).toBe(true);
    expect(form.secondaryEducation[0].dataTakenFromCandidate).toBe(false);
    expect(form.tertiaryEducation[0].isEnabled).toBe(true);
    expect(form.projectsRequirements?.isEnabled).toBe(true);
    expect(form.preferredPublications?.isEnabled).toBe(true);
    expect(form.preferredClubSocieties?.isEnabled).toBe(true);
    expect(form.preferredSports?.isEnabled).toBe(true);
    expect(form.preferredVolunteering?.isEnabled).toBe(true);
    expect(form.patents?.isEnabled).toBe(true);
    expect(form.preferredHonoursAwards?.isEnabled).toBe(true);
    expect(form.licenseCertificates?.[0].isEnabled).toBe(true);
    expect(form.preferredSkills?.isEnabled).toBe(true);
    expect(form.preferredLanguages?.isEnabled).toBe(true);
    expect(form.preferredCauses?.isEnabled).toBe(true);
    expect(form.preferredHobbies?.isEnabled).toBe(true);
    expect(form.preferredIndustries?.isEnabled).toBe(true);

    // DQCGP-3661: every section in this fixture has dataTakenFromCandidate:true,
    // yet the recruiter must always start with the checkbox unticked.
    expect(form.tertiaryEducation[0].dataTakenFromCandidate).toBe(false);
    expect(form.projectsRequirements?.dataTakenFromCandidate).toBe(false);
    expect(form.preferredPublications?.dataTakenFromCandidate).toBe(false);
    expect(form.preferredClubSocieties?.dataTakenFromCandidate).toBe(false);
    expect(form.preferredSports?.dataTakenFromCandidate).toBe(false);
    expect(form.preferredVolunteering?.dataTakenFromCandidate).toBe(false);
    expect(form.patents?.dataTakenFromCandidate).toBe(false);
    expect(form.preferredHonoursAwards?.dataTakenFromCandidate).toBe(false);
    expect(form.licenseCertificates?.[0].dataTakenFromCandidate).toBe(false);
    expect(form.preferredSkills?.dataTakenFromCandidate).toBe(false);
    expect(form.preferredLanguages?.dataTakenFromCandidate).toBe(false);
    expect(form.preferredCauses?.dataTakenFromCandidate).toBe(false);
    expect(form.preferredHobbies?.dataTakenFromCandidate).toBe(false);
    expect(form.preferredIndustries?.dataTakenFromCandidate).toBe(false);

    const expectedStepKeys = [
      'job-requirements',
      'schedule-vacancy',
      'secondary-education',
      'tertiary-education',
      'projects-requirements',
      'preferred-publications',
      'preferred-club-societies',
      'preferred-sports',
      'preferred-volunteering',
      'preferred-patents',
      'preferred-honours-awards',
      'license-certificates',
      'preferred-skills',
      'preferred-languages',
      'preferred-causes',
      'preferred-hobbies',
      'preferred-industry',
    ];
    expect(visibleStepKeys).toEqual(expect.arrayContaining(expectedStepKeys));
    expect(visibleStepKeys).toHaveLength(expectedStepKeys.length);

    for (const key of Object.keys(optionalSectionsData)) {
      expect(templateFieldVisibility[key]).toBeDefined();
    }
    expect(templateFieldVisibility.skills).toEqual({ skillCareerPath: true });
  });

  it('is a no-op applier when the matching form entry is absent (defensive branches)', () => {
    const prevWithoutOptionalEntries = structuredClone(DEFAULT_FORM);
    prevWithoutOptionalEntries.secondaryEducation = [];
    prevWithoutOptionalEntries.tertiaryEducation = [];
    prevWithoutOptionalEntries.licenseCertificates = [];
    prevWithoutOptionalEntries.projectsRequirements = undefined;
    prevWithoutOptionalEntries.preferredPublications = undefined;
    prevWithoutOptionalEntries.preferredClubSocieties = undefined;
    prevWithoutOptionalEntries.preferredSports = undefined;
    prevWithoutOptionalEntries.preferredVolunteering = undefined;
    prevWithoutOptionalEntries.patents = undefined;
    prevWithoutOptionalEntries.preferredHonoursAwards = undefined;
    prevWithoutOptionalEntries.preferredSkills = undefined;
    prevWithoutOptionalEntries.preferredLanguages = undefined;
    prevWithoutOptionalEntries.preferredCauses = undefined;
    prevWithoutOptionalEntries.preferredHobbies = undefined;
    prevWithoutOptionalEntries.preferredIndustries = undefined;

    const requestBody = makeRequestBody({
      secondaryEducation: { isEnabled: true, content: {} },
      tertiaryEducation: { isEnabled: true, content: {} },
      licensesAndCertifications: { isEnabled: true, content: {} },
      projects: { isEnabled: true, content: {} },
      publications: { isEnabled: true, content: {} },
      clubsAndSocieties: { isEnabled: true, content: {} },
      sports: { isEnabled: true, content: {} },
      volunteering: { isEnabled: true, content: {} },
      patents: { isEnabled: true, content: {} },
      honoursAndAwards: { isEnabled: true, content: {} },
      skills: { isEnabled: true, content: {} },
      languages: { isEnabled: true, content: {} },
      causes: { isEnabled: true, content: {} },
      hobbyList: { isEnabled: true, content: {} },
      industry: { isEnabled: true, content: {} },
    });

    expect(() =>
      toVacancyFormFromTemplateUsePayload(
        requestBody,
        prevWithoutOptionalEntries
      )
    ).not.toThrow();
  });

  it('ignores an unmapped section key (no step key registered) but still applies known fields', () => {
    const requestBody = makeRequestBody({
      someUnknownSection: { isEnabled: true, content: { foo: true } },
    });

    const { visibleStepKeys } = toVacancyFormFromTemplateUsePayload(
      requestBody,
      DEFAULT_FORM
    );

    expect(visibleStepKeys).toEqual(['job-requirements', 'schedule-vacancy']);
  });

  it('treats a non-record requestBody.data as empty', () => {
    const requestBody = {
      title: '',
      status: 'new',
      lastActiveStep: 'job-requirements',
      templateId: 't-1',
      data: null,
    } as unknown as VacancyTemplateUseRequestBody;

    const { visibleStepKeys, templateFieldVisibility } =
      toVacancyFormFromTemplateUsePayload(requestBody, DEFAULT_FORM);

    expect(visibleStepKeys).toEqual(['job-requirements', 'schedule-vacancy']);
    expect(templateFieldVisibility).toEqual({});
  });
});
