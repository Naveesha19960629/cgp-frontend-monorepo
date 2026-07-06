import { describe, expect, it } from 'vitest';

import type { VacancyForm } from '@/views/vacancies/types';
import { toVacancyFormFromResponse } from '@/views/vacancies/utils/vacancy-edit-response-helpers';

// ─── Shared fallback ──────────────────────────────────────────────────────────

const EMPTY_SELECT = { id: '', label: '' };

const FALLBACK_FORM: VacancyForm = {
  title: '',
  status: 'draft',
  lastActiveStep: 'job-requirements',
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
    gender: EMPTY_SELECT,
    maritalStatus: EMPTY_SELECT,
    addresses: [],
  },
  secondaryEducation: [
    { isEnabled: false, dataTakenFromCandidate: false, content: [] },
  ],
  tertiaryEducation: [
    { isEnabled: false, dataTakenFromCandidate: false, content: [] },
  ],
  projectsRequirements: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    projects: [],
  },
  preferredPublications: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    publications: [],
  },
  preferredClubSocieties: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    clubSocieties: [],
  },
  preferredSports: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    sports: [],
  },
  preferredVolunteering: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    volunteering: [],
  },
  patents: { isEnabled: false, dataTakenFromCandidate: false, patents: [] },
  preferredHonoursAwards: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    honoursAndAwards: [],
  },
  licenseCertificates: [
    { isEnabled: false, dataTakenFromCandidate: false, content: [] },
  ],
  preferredSkills: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    skills: [],
  },
  preferredLanguages: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    languages: [],
  },
  preferredCauses: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    causes: [],
  },
  preferredHobbies: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    hobbies: [],
  },
  preferredIndustries: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    industries: [],
  },
  customizableForm: { isEnabled: false, sectionTitle: '', forms: [] },
  schedule: undefined,
};

// ─── Realistic GET response fixture (mirrors actual API) ──────────────────────

const REAL_GET_RESPONSE = {
  title: 'ascasc',
  status: 'UNPUBLISHED',
  lastActiveStep: null,
  jobRequirement: {
    isEnabled: true,
    dataTakenFromCandidate: false,
    discipline: {
      source: 'MASTER',
      id: '11111111-1111-1111-1111-111111111111',
      label: 'Information Technology (IT)',
    },
    careerPath: {
      source: 'MASTER',
      id: '10000000-0000-0000-0000-000000000001',
      label: 'Software Engineering',
    },
    level: {
      source: 'MASTER',
      id: '432b834f-6368-4f85-b969-07ece2518656',
      label: 'Senior Level',
    },
    roles: [
      {
        source: 'PENDING',
        id: '072ab395-fd97-48db-aa32-15bc21722eb2',
        label: 'SE',
      },
    ],
    jobTitles: [
      {
        source: 'MASTER',
        id: '6cd0f8b8-db16-4bdd-88a6-6efc6c6f4076',
        label: 'Senior Backend Engineer',
      },
    ],
    employmentTypes: [
      {
        source: 'MASTER',
        id: 'ba133d97-ac32-42b5-b749-ea5814a6e8c0',
        label: 'Fixed-Term Contract',
      },
      {
        source: 'MASTER',
        id: '654a4886-e8b2-428a-a3ca-5d4985b03589',
        label: 'Independent Contractor/ Self Employed',
      },
    ],
    workSchedules: [
      {
        source: 'MASTER',
        id: 'd447962d-f69d-4d08-b9db-e84ce7eca11e',
        label: 'Part Time',
      },
      {
        source: 'MASTER',
        id: '9d55e43c-ea67-4801-bd3f-3b3a44f9b95f',
        label: 'Full Time',
      },
    ],
    engagementModels: [
      {
        source: 'MASTER',
        id: 'f4a33542-a64e-4d1c-b37d-d15643ca767f',
        label: 'Hybrid',
      },
    ],
    description: 'some description',
  },
  profileRequirement: {
    isEnabled: true,
    dataTakenFromCandidate: false,
    gender: { id: 'ae71c224-618e-47a1-8f79-0fe642c94736', label: 'Male' },
    maritalStatus: {
      id: '1dbe408d-446f-42dc-b670-4671238039c1',
      label: 'Single',
    },
    addresses: [
      {
        cityRefId: '0b7f816b-ec39-4075-b421-ec47cb8968de',
        cityLabel: 'Colombo',
        stateRefId: '37e20f54-2f47-4c79-b29a-20586c3525fa',
        stateLabel: 'Western Province',
        countryRefId: 'ddaf949d-369f-4c06-ab05-cd6f15345d76',
        countryLabel: 'Sri Lanka',
        postalCode: '001000',
      },
    ],
  },
  scheduleRequirement: {
    schedulePublishAt: '2026-06-24T01:00:00',
    expirationAt: '2026-06-26T12:59:59',
  },
};

// ─── toVacancyFormFromResponse: top-level scalars ──────────────────────────

describe('toVacancyFormFromResponse — top-level scalar fields', () => {
  it('maps title from rawVacancy.title', () => {
    const result = toVacancyFormFromResponse(
      { title: 'My Vacancy', status: 'DRAFT' },
      { ...FALLBACK_FORM }
    );
    expect(result.title).toBe('My Vacancy');
  });

  it('falls back to vacancyTitle alias if title is missing', () => {
    const result = toVacancyFormFromResponse(
      { vacancyTitle: 'Alias Title', status: 'DRAFT' },
      { ...FALLBACK_FORM }
    );
    expect(result.title).toBe('Alias Title');
  });

  it('falls back to previousForm.title when no title key present', () => {
    const result = toVacancyFormFromResponse(
      { status: 'DRAFT' },
      { ...FALLBACK_FORM, title: 'Existing Title' }
    );
    expect(result.title).toBe('Existing Title');
  });

  it('clamps titles longer than 50 characters to 50', () => {
    // 58-char title from pre-fix "Copy of" duplication
    const result = toVacancyFormFromResponse(
      {
        title: 'Copy of Copy of Senior Software Engineer - Back End (Java)',
        status: 'UNPUBLISHED',
      },
      { ...FALLBACK_FORM }
    );
    expect(result.title).toBe(
      'Copy of Copy of Senior Software Engineer - Back En'
    );
    expect(result.title).toHaveLength(50);
  });

  it('leaves titles of exactly 50 characters untouched', () => {
    const title = 'x'.repeat(50);
    const result = toVacancyFormFromResponse(
      { title, status: 'DRAFT' },
      { ...FALLBACK_FORM }
    );
    expect(result.title).toBe(title);
  });

  it('normalises UNPUBLISHED status to "unpublished"', () => {
    const result = toVacancyFormFromResponse(
      { title: 'T', status: 'UNPUBLISHED' },
      { ...FALLBACK_FORM }
    );
    expect(result.status).toBe('unpublished');
  });

  it('normalises ONHOLD (no underscore) status to "on_hold"', () => {
    const result = toVacancyFormFromResponse(
      { title: 'T', status: 'ONHOLD' },
      { ...FALLBACK_FORM }
    );
    expect(result.status).toBe('on_hold');
  });

  it('normalises DRAFT → "draft", LIVE → "live", EXPIRED → "expired"', () => {
    for (const [api, form] of [
      ['DRAFT', 'draft'],
      ['LIVE', 'live'],
      ['EXPIRED', 'expired'],
    ]) {
      const result = toVacancyFormFromResponse(
        { title: 'T', status: api },
        { ...FALLBACK_FORM }
      );
      expect(result.status).toBe(form);
    }
  });

  it('falls back to previousForm.status for unknown API status', () => {
    const result = toVacancyFormFromResponse(
      { title: 'T', status: 'UNKNOWN_STATUS' },
      { ...FALLBACK_FORM, status: 'draft' }
    );
    expect(result.status).toBe('draft');
  });

  it('preserves previousForm.lastActiveStep when API returns null', () => {
    const result = toVacancyFormFromResponse(
      { title: 'T', lastActiveStep: null },
      { ...FALLBACK_FORM, lastActiveStep: 'profile-requirements' }
    );
    expect(result.lastActiveStep).toBe('profile-requirements');
  });

  it('uses lastActiveStep from API when provided', () => {
    const result = toVacancyFormFromResponse(
      { title: 'T', lastActiveStep: 'schedule-vacancy' },
      { ...FALLBACK_FORM }
    );
    expect(result.lastActiveStep).toBe('schedule-vacancy');
  });
});

// ─── Job Requirements — GET flat-object shape (API) ──────────────────────────

describe('toVacancyFormFromResponse — job requirements (GET flat-object shape)', () => {
  it('maps discipline, careerPath, level as single-element arrays', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    const jr = result.jobRequirements[0];

    expect(jr.discipline).toEqual([
      {
        id: '11111111-1111-1111-1111-111111111111',
        source: 'MASTER',
        label: 'Information Technology (IT)',
      },
    ]);
    expect(jr.careerPath).toEqual([
      {
        id: '10000000-0000-0000-0000-000000000001',
        source: 'MASTER',
        label: 'Software Engineering',
      },
    ]);
    expect(jr.level).toEqual([
      {
        id: '432b834f-6368-4f85-b969-07ece2518656',
        source: 'MASTER',
        label: 'Senior Level',
      },
    ]);
  });

  it('maps roles[] → role[]', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    expect(result.jobRequirements[0].role).toEqual([
      {
        id: '072ab395-fd97-48db-aa32-15bc21722eb2',
        source: 'PENDING',
        label: 'SE',
      },
    ]);
  });

  it('maps jobTitles[] → jobTitle[]', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    expect(result.jobRequirements[0].jobTitle).toEqual([
      {
        id: '6cd0f8b8-db16-4bdd-88a6-6efc6c6f4076',
        source: 'MASTER',
        label: 'Senior Backend Engineer',
      },
    ]);
  });

  it('maps employmentTypes[] → employmentType[]', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    expect(result.jobRequirements[0].employmentType).toHaveLength(2);
    expect(result.jobRequirements[0].employmentType[0].label).toBe(
      'Fixed-Term Contract'
    );
  });

  it('maps workSchedules[] → workSchedule[]', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    expect(result.jobRequirements[0].workSchedule).toHaveLength(2);
    expect(result.jobRequirements[0].workSchedule[0].label).toBe('Part Time');
  });

  it('maps engagementModels[] → engagementModel[]', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    expect(result.jobRequirements[0].engagementModel).toHaveLength(1);
    expect(result.jobRequirements[0].engagementModel[0].label).toBe('Hybrid');
  });

  it('preserves description', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    expect(result.jobRequirements[0].description).toBe('some description');
  });

  it('preserves isEnabled and dataTakenFromCandidate flags', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    expect(result.jobRequirements[0].isEnabled).toBe(true);
    expect(result.jobRequirements[0].dataTakenFromCandidate).toBe(false);
  });

  it('returns fallback jobRequirements when section is absent', () => {
    const result = toVacancyFormFromResponse(
      { title: 'T' },
      { ...FALLBACK_FORM }
    );
    expect(result.jobRequirements).toEqual(FALLBACK_FORM.jobRequirements);
  });

  it('wraps a flat API object in a single-element array', () => {
    const result = toVacancyFormFromResponse(
      {
        jobRequirement: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          roles: [],
          jobTitles: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.jobRequirements).toHaveLength(1);
  });

  it('handles nested data envelope (rawVacancy.data)', () => {
    const result = toVacancyFormFromResponse(
      {
        title: 'T',
        data: {
          jobRequirement: REAL_GET_RESPONSE.jobRequirement,
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.jobRequirements[0].discipline[0].label).toBe(
      'Information Technology (IT)'
    );
  });

  it('uses form-shape keys (role/jobTitle) if already in form shape', () => {
    const formShape = {
      jobRequirement: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        discipline: [{ id: 'disc-1', source: 'MASTER', label: 'IT' }],
        careerPath: [],
        level: [],
        role: [{ id: 'role-1', source: 'MASTER', label: 'Dev' }],
        jobTitle: [{ id: 'jt-1', source: 'MASTER', label: 'Engineer' }],
        employmentType: [],
        workSchedule: [],
        engagementModel: [],
        description: '',
      },
    };
    const result = toVacancyFormFromResponse(formShape, { ...FALLBACK_FORM });
    expect(result.jobRequirements[0].role[0].label).toBe('Dev');
    expect(result.jobRequirements[0].jobTitle[0].label).toBe('Engineer');
  });

  it('strips entries with no id from roles array', () => {
    const result = toVacancyFormFromResponse(
      {
        jobRequirement: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          roles: [
            { source: 'MASTER', id: 'valid-id', label: 'Valid' },
            { source: 'MASTER', id: '', label: '' },
          ],
          jobTitles: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.jobRequirements[0].role).toHaveLength(1);
    expect(result.jobRequirements[0].role[0].id).toBe('valid-id');
  });

  it('uses displayValue as label fallback when label is absent', () => {
    const result = toVacancyFormFromResponse(
      {
        jobRequirement: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          discipline: {
            source: 'MASTER',
            id: 'disc-1',
            displayValue: 'Fallback Label',
          },
          roles: [],
          jobTitles: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.jobRequirements[0].discipline[0].label).toBe(
      'Fallback Label'
    );
  });
});

// ─── Profile Requirements — GET flat-object shape (API) ──────────────────────

describe('toVacancyFormFromResponse — profile requirements (GET flat-object shape)', () => {
  it('maps gender and maritalStatus correctly from object refs', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    const pr = result.profileRequirements;

    expect(pr.gender).toEqual({
      id: 'ae71c224-618e-47a1-8f79-0fe642c94736',
      label: 'Male',
    });
    expect(pr.maritalStatus).toEqual({
      id: '1dbe408d-446f-42dc-b670-4671238039c1',
      label: 'Single',
    });
  });

  it('maps addresses using GET cityRefId/cityLabel shape', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    const addr = result.profileRequirements.addresses[0];

    expect(addr.city).toEqual({
      id: '0b7f816b-ec39-4075-b421-ec47cb8968de',
      label: 'Colombo',
    });
    expect(addr.stateProvince).toEqual({
      id: '37e20f54-2f47-4c79-b29a-20586c3525fa',
      label: 'Western Province',
    });
    expect(addr.country).toEqual({
      id: 'ddaf949d-369f-4c06-ab05-cd6f15345d76',
      label: 'Sri Lanka',
    });
    expect(addr.postalCode).toBe('001000');
    expect(addr.isOpen).toBe(true);
  });

  it('maps addresses using form-shape city/stateProvince/country objects', () => {
    const formShape = {
      profileRequirement: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        gender: { id: 'g-1', label: 'Female' },
        maritalStatus: { id: 'm-1', label: 'Married' },
        addresses: [
          {
            city: { id: 'city-1', label: 'Kandy' },
            stateProvince: { id: 'state-1', label: 'Central' },
            country: { id: 'country-1', label: 'Sri Lanka' },
            postalCode: '20000',
            isOpen: false,
          },
        ],
      },
    };
    const result = toVacancyFormFromResponse(formShape, { ...FALLBACK_FORM });
    const addr = result.profileRequirements.addresses[0];

    expect(addr.city).toEqual({ id: 'city-1', label: 'Kandy' });
    expect(addr.stateProvince).toEqual({ id: 'state-1', label: 'Central' });
    expect(addr.country).toEqual({ id: 'country-1', label: 'Sri Lanka' });
    expect(addr.postalCode).toBe('20000');
  });

  it('preserves isEnabled and dataTakenFromCandidate flags', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });
    expect(result.profileRequirements.isEnabled).toBe(true);
    expect(result.profileRequirements.dataTakenFromCandidate).toBe(false);
  });

  it('normalises null gender/maritalStatus to empty select option', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          gender: null,
          maritalStatus: null,
          addresses: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.profileRequirements.gender).toEqual(EMPTY_SELECT);
    expect(result.profileRequirements.maritalStatus).toEqual(EMPTY_SELECT);
  });

  it('returns empty addresses array when GET returns []', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          gender: null,
          maritalStatus: null,
          addresses: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.profileRequirements.addresses).toEqual([]);
  });

  it('handles array-wrapped profileRequirement (POST echo shape)', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: {
              gender: 'ae71c224-618e-47a1-8f79-0fe642c94736',
              maritalStatus: '1dbe408d-446f-42dc-b670-4671238039c1',
              addresses: [],
            },
          },
        ],
      },
      { ...FALLBACK_FORM }
    );
    // Should not throw and should at least hydrate isEnabled
    expect(result.profileRequirements.isEnabled).toBe(true);
  });

  it('returns fallback profileRequirements when section is absent', () => {
    const result = toVacancyFormFromResponse(
      { title: 'T' },
      { ...FALLBACK_FORM }
    );
    expect(result.profileRequirements).toEqual(
      FALLBACK_FORM.profileRequirements
    );
  });

  it('does not spread unknown API keys into profileRequirements', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          gender: null,
          maritalStatus: null,
          addresses: [],
          unknownApiField: 'should-not-appear',
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(
      Reflect.get(result.profileRequirements, 'unknownApiField')
    ).toBeUndefined();
  });
});

// ─── Full GET response round-trip ─────────────────────────────────────────────

describe('toVacancyFormFromResponse — full GET response round-trip', () => {
  it('produces a complete VacancyForm with all sections hydrated', () => {
    const result = toVacancyFormFromResponse(REAL_GET_RESPONSE, {
      ...FALLBACK_FORM,
    });

    // Top-level
    expect(result.title).toBe('ascasc');
    expect(result.status).toBe('unpublished');

    // Job requirements
    expect(result.jobRequirements[0].discipline[0].label).toBe(
      'Information Technology (IT)'
    );
    expect(result.jobRequirements[0].role[0].label).toBe('SE');

    // Profile requirements
    expect(result.profileRequirements.gender.label).toBe('Male');
    expect(result.profileRequirements.addresses[0].city.label).toBe('Colombo');

    // Schedule
    expect(result.schedule).toEqual({
      schedulePublishAt: '2026-06-24T01:00:00',
      expirationAt: '2026-06-26T12:59:59',
    });
  });

  it('does not overwrite unrelated previousForm sections with API garbage', () => {
    const formWithSkills = {
      ...FALLBACK_FORM,
      preferredSkills: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        skills: [
          {
            skillId: 'sk-1',
            skillName: 'TypeScript',
            careerPathName: '',
            displayValue: 'TypeScript',
            source: 'MASTER',
          },
        ],
      },
    };
    const result = toVacancyFormFromResponse(
      { title: 'T', status: 'DRAFT' },
      formWithSkills
    );
    // Skills section not touched by response — should be preserved from previousForm
    expect(result.preferredSkills).toEqual(formWithSkills.preferredSkills);
  });
});

// ─── Education + License + Industry hydration coverage ───────────────────────

describe('toVacancyFormFromResponse — secondary/tertiary/license/industry', () => {
  it('hydrates secondary and tertiary sections from data envelope', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {
          secondaryEducation: [
            {
              isEnabled: true,
              dataTakenFromCandidate: false,
              content: [
                {
                  schools: [
                    {
                      source: 'MASTER',
                      id: 'school-1',
                      name: 'Royal College',
                    },
                  ],
                  examinations: [],
                  fieldsOfStudy: [],
                  secondaryAwardingBody: [],
                  schoolLocations: [],
                  acceptsHomeSchooling: false,
                  grade: 'A',
                  startDate: '2020-01-01',
                  endDate: '2021-01-01',
                  result: 'PASS',
                },
              ],
            },
          ],
          tertiaryEducation: [
            {
              isEnabled: true,
              dataTakenFromCandidate: false,
              content: [
                {
                  qualificationName: [
                    {
                      source: 'MASTER',
                      id: 'qual-1',
                      name: 'BSc',
                    },
                  ],
                  tertiaryAwardingBody: [],
                  tertiaryAwardingBodyLocations: [],
                  levelOfQualification: [],
                  specialization: [],
                  studyMode: [],
                  studyPattern: [],
                  deliverySchedule: [],
                  batch: [],
                  department: [],
                  faculty: [],
                  grade: 'A',
                },
              ],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.secondaryEducation[0].isEnabled).toBe(true);
    expect(result.secondaryEducation[0].content).toHaveLength(1);
    expect(result.tertiaryEducation[0].isEnabled).toBe(true);
    expect(result.tertiaryEducation[0].content).toHaveLength(1);
  });

  it('hydrates licensesAndCertifications into licenseCertificates', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {
          licensesAndCertifications: [
            {
              isEnabled: true,
              dataTakenFromCandidate: false,
              content: [
                {
                  nameOfLicenseCert: [
                    {
                      source: 'MASTER',
                      id: 'lc-1',
                      name: 'AWS Developer',
                      type: 'CERTIFICATION',
                    },
                  ],
                  issuingOrganization: [
                    {
                      source: 'MASTER',
                      id: 'org-1',
                      label: 'Amazon',
                    },
                  ],
                  organizationLocations: [
                    {
                      source: 'MASTER',
                      id: 'loc-1',
                      displayValue: 'Colombo',
                    },
                  ],
                  internationallyAccepted: true,
                  issueDate: '2024-01-01',
                  expirationDate: '2026-01-01',
                },
              ],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.licenseCertificates?.[0].isEnabled).toBe(true);
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0]
    ).toEqual(
      expect.objectContaining({
        id: 'lc-1',
        source: 'MASTER',
        name: 'AWS Developer',
        type: 'CERTIFICATION',
      })
    );
    expect(
      result.licenseCertificates?.[0].content[0].issuingOrganization[0]
    ).toEqual(expect.objectContaining({ id: 'org-1', name: 'Amazon' }));
    expect(
      result.licenseCertificates?.[0].content[0].organizationLocations[0]
    ).toEqual(expect.objectContaining({ id: 'loc-1', name: 'Colombo' }));
  });

  it('hydrates industry.content into preferredIndustries.industries', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {
          industry: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              { source: 'MASTER', id: 'ind-1', label: 'Healthcare' },
              { source: 'PENDING', id: 'ind-2', name: 'Technology' },
            ],
          },
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.preferredIndustries?.isEnabled).toBe(true);
    expect(result.preferredIndustries?.industries).toEqual([
      { id: 'ind-1', label: 'Healthcare', source: 'MASTER' },
      { id: 'ind-2', label: 'Technology', source: 'PENDING' },
    ]);
  });

  it('hydrates object wrapper with licensesAndCertifications without recursion', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {
          licensesAndCertifications: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            licensesAndCertifications: [
              {
                nameOfLicenseCert: [
                  {
                    source: 'MASTER',
                    id: 'lc-obj-1',
                    name: 'Scrum Master',
                    type: 'CERTIFICATION',
                  },
                ],
                issuingOrganization: [
                  { source: 'MASTER', id: 'org-obj-1', name: 'Scrum Org' },
                ],
                organizationLocations: [
                  { source: 'MASTER', id: 'loc-obj-1', name: 'Colombo' },
                ],
                internationallyAccepted: true,
                issueDate: '2023-01-01',
                expirationDate: '2026-01-01',
              },
            ],
          },
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.licenseCertificates?.[0].isEnabled).toBe(true);
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0]
    ).toEqual(
      expect.objectContaining({
        id: 'lc-obj-1',
        name: 'Scrum Master',
        source: 'MASTER',
      })
    );
  });

  it('hydrates single group object under licenseCertificates key', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {
          licenseCertificates: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                nameOfLicenseCert: [
                  {
                    source: 'MASTER',
                    id: 'lc-group-1',
                    name: 'AWS SA',
                    type: 'CERTIFICATION',
                  },
                ],
                issuingOrganization: [],
                organizationLocations: [],
                internationallyAccepted: false,
                issueDate: '2024-01-01',
                expirationDate: '2027-01-01',
              },
            ],
          },
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.licenseCertificates?.[0].isEnabled).toBe(true);
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0].id
    ).toBe('lc-group-1');
  });
});

describe('toVacancyFormFromResponse — projects/publications/clubs/sports/volunteering hydration', () => {
  it('hydrates all added form sections from GET payload values', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {
          projects: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            projects: [
              {
                projectRequirementId: 'project-req-1',
                startDate: '2026-06-03',
                endDate: '2026-06-19',
                relatedIndustry: [
                  {
                    source: 'MASTER',
                    id: 'ind-1',
                    label: 'Information Technology',
                  },
                ],
                organization: [
                  {
                    source: 'MASTER',
                    id: 'org-1',
                    label: 'OXO Labs',
                  },
                ],
                organizationLocations: [
                  {
                    source: 'MASTER',
                    id: 'loc-1',
                    label: 'Aachen, North Rhine-Westphalia, Germany',
                  },
                ],
              },
            ],
          },
          publications: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            publications: [
              {
                publicationRequirementId: 'pub-1',
                acceptedPublisherName: 'Publisher A',
                publishedDateFrom: '2026-06-02',
                publishedDateTo: '2026-06-12',
              },
            ],
          },
          clubsAndSocieties: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            clubsAndSocieties: [
              {
                clubSocietyRequirementId: 'club-1',
                positionRoleHeld: 'Leader',
                startDate: '2026-06-03',
                endDate: '2026-06-10',
                clubSociety: [
                  {
                    source: 'MASTER',
                    id: 'club-opt-1',
                    label: 'Business Club',
                  },
                ],
                organization: [
                  {
                    source: 'MASTER',
                    id: 'org-1',
                    label: 'OXO Labs',
                  },
                ],
                organizationLocations: [
                  {
                    source: 'MASTER',
                    id: 'loc-1',
                    label: 'Aachen, North Rhine-Westphalia, Germany',
                  },
                ],
              },
            ],
          },
          sports: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            sports: [
              {
                sportRequirementId: 'sport-1',
                positionRoleHeld: 'Captain',
                startDate: '2026-06-10',
                endDate: '2026-06-24',
                nameOfSport: [
                  {
                    source: 'MASTER',
                    id: 'sport-opt-1',
                    label: 'Badminton',
                  },
                ],
                representedOrganization: [
                  {
                    source: 'MASTER',
                    id: 'org-1',
                    label: 'OXO Labs',
                  },
                ],
                organizationLocations: [
                  {
                    source: 'MASTER',
                    id: 'loc-2',
                    label: 'Aalborg, Denmark',
                  },
                ],
                levelRepresented: [
                  {
                    source: 'MASTER',
                    id: 'level-1',
                    label: 'International Level',
                  },
                ],
              },
            ],
          },
          volunteering: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            volunteering: [
              {
                volunteeringRequirementId: 'vol-1',
                positionRole: 'Coordinator',
                startDate: '2026-06-10',
                endDate: '2026-06-27',
                organization: [
                  {
                    source: 'MASTER',
                    id: 'org-1',
                    label: 'OXO Labs',
                  },
                ],
                organizationLocations: [
                  {
                    source: 'MASTER',
                    id: 'loc-1',
                    label: 'Aachen, North Rhine-Westphalia, Germany',
                  },
                ],
                cause: [
                  {
                    source: 'MASTER',
                    id: 'cause-1',
                    label: 'Education',
                  },
                ],
              },
            ],
          },
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.projectsRequirements?.isEnabled).toBe(true);
    expect(result.projectsRequirements?.projects[0]).toEqual(
      expect.objectContaining({
        id: 'project-req-1',
        startDate: '2026-06-03',
        endDate: '2026-06-19',
      })
    );
    expect(result.projectsRequirements?.projects[0].organizations[0]).toEqual(
      expect.objectContaining({ value: 'org-1', label: 'OXO Labs' })
    );

    expect(result.preferredPublications?.isEnabled).toBe(true);
    expect(result.preferredPublications?.publications[0]).toEqual(
      expect.objectContaining({
        id: 'pub-1',
        acceptedPublisher: 'Publisher A',
        publishedDateFrom: '2026-06-02',
        publishedDateTo: '2026-06-12',
      })
    );

    expect(result.preferredClubSocieties?.isEnabled).toBe(true);
    expect(result.preferredClubSocieties?.clubSocieties[0]).toEqual(
      expect.objectContaining({
        id: 'club-1',
        position: 'Leader',
      })
    );
    expect(
      result.preferredClubSocieties?.clubSocieties[0].representedOrganization[0]
    ).toEqual(expect.objectContaining({ value: 'org-1', label: 'OXO Labs' }));

    expect(result.preferredSports?.isEnabled).toBe(true);
    expect(result.preferredSports?.sports[0]).toEqual(
      expect.objectContaining({
        id: 'sport-1',
        position: 'Captain',
      })
    );
    expect(result.preferredSports?.sports[0].sport[0]).toEqual(
      expect.objectContaining({ value: 'sport-opt-1', label: 'Badminton' })
    );
    expect(result.preferredSports?.sports[0].levelRepresented[0]).toEqual(
      expect.objectContaining({
        value: 'level-1',
        label: 'International Level',
      })
    );

    expect(result.preferredVolunteering?.isEnabled).toBe(true);
    expect(result.preferredVolunteering?.volunteering[0]).toEqual(
      expect.objectContaining({
        id: 'vol-1',
        position: 'Coordinator',
      })
    );
    expect(
      result.preferredVolunteering?.volunteering[0].organizationName[0]
    ).toEqual(expect.objectContaining({ value: 'org-1', label: 'OXO Labs' }));
    expect(result.preferredVolunteering?.volunteering[0].cause[0]).toEqual(
      expect.objectContaining({ value: 'cause-1', label: 'Education' })
    );
  });
});

// ─── normalizePatentsSection (via toVacancyFormFromResponse) ──────────────────

describe('toVacancyFormFromResponse — patents section', () => {
  it('maps patents with statuses array and related industries', () => {
    const result = toVacancyFormFromResponse(
      {
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [
            {
              statuses: ['PATENT_PENDING', 'PATENT_ISSUED'],
              relatedIndustry: [
                { id: 'ind-1', label: 'Technology', source: 'MASTER' },
              ],
              fromDate: '2024-01-15',
              toDate: '2025-01-15',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.patents?.isEnabled).toBe(true);
    expect(result.patents?.dataTakenFromCandidate).toBe(false);
    expect(result.patents?.patents).toHaveLength(1);

    const entry = result.patents!.patents[0];
    expect(entry.statuses).toEqual([
      { value: 'PATENT_PENDING', label: 'Patent Pending' },
      { value: 'PATENT_ISSUED', label: 'Patent Issued' },
    ]);
    expect(entry.relatedIndustries).toEqual([
      { value: 'ind-1', label: 'Technology', source: 'MASTER' },
    ]);
  });

  it('filters out invalid patent status values and keeps only valid ones', () => {
    const result = toVacancyFormFromResponse(
      {
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [
            {
              statuses: ['PATENT_PENDING', 'INVALID_STATUS', 'PATENT_ISSUED'],
              relatedIndustry: [],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.patents!.patents[0].statuses).toHaveLength(2);
    expect(result.patents!.patents[0].statuses[0].value).toBe('PATENT_PENDING');
    expect(result.patents!.patents[0].statuses[1].value).toBe('PATENT_ISSUED');
  });

  it('returns fallback when patents section is not a record', () => {
    const fallbackPatents = {
      isEnabled: true,
      dataTakenFromCandidate: false,
      patents: [],
    };

    const result = toVacancyFormFromResponse(
      { patents: 'not-a-record' },
      { ...FALLBACK_FORM, patents: fallbackPatents }
    );

    expect(result.patents).toEqual(fallbackPatents);
  });

  it('uses empty patents array when patents key is absent from section', () => {
    const result = toVacancyFormFromResponse(
      {
        patents: {
          isEnabled: false,
          dataTakenFromCandidate: false,
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.patents?.patents).toEqual([]);
  });

  it('sets isOpen to true on every mapped patent entry', () => {
    const result = toVacancyFormFromResponse(
      {
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [{ statuses: [], relatedIndustry: [] }],
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.patents!.patents[0].isOpen).toBe(true);
  });

  it('uses displayValue or id as label fallback for related industries', () => {
    const result = toVacancyFormFromResponse(
      {
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [
            {
              statuses: [],
              relatedIndustry: [
                { id: 'ind-2', displayValue: 'Engineering', source: 'MASTER' },
              ],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );

    const industry = result.patents!.patents[0].relatedIndustries[0];
    expect(industry.label).toBe('Engineering');
    expect(industry.value).toBe('ind-2');
    expect(industry.source).toBe('MASTER');
  });
});

// ─── normalizeSchedule (via toVacancyFormFromResponse) ───────────────────────

describe('toVacancyFormFromResponse — schedule section', () => {
  it('maps schedule when both fields are present', () => {
    const result = toVacancyFormFromResponse(
      {
        schedule: {
          schedulePublishAt: '2024-06-01T10:00:00',
          expirationAt: '2024-12-31T23:59:59',
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.schedule).toEqual({
      schedulePublishAt: '2024-06-01T10:00:00',
      expirationAt: '2024-12-31T23:59:59',
    });
  });

  it('falls back to previousForm.schedule when section is not a record', () => {
    const fallbackSchedule = {
      schedulePublishAt: '2024-01-01',
      expirationAt: '2024-06-30',
    };

    const result = toVacancyFormFromResponse(
      { schedule: null },
      { ...FALLBACK_FORM, schedule: fallbackSchedule }
    );

    expect(result.schedule).toEqual(fallbackSchedule);
  });

  it('falls back to previousForm.schedule when schedulePublishAt is missing', () => {
    const fallbackSchedule = {
      schedulePublishAt: '2024-01-01',
      expirationAt: '2024-06-30',
    };

    const result = toVacancyFormFromResponse(
      { schedule: { expirationAt: '2024-12-31' } },
      { ...FALLBACK_FORM, schedule: fallbackSchedule }
    );

    expect(result.schedule).toEqual(fallbackSchedule);
  });

  it('falls back to previousForm.schedule when expirationAt is missing', () => {
    const fallbackSchedule = {
      schedulePublishAt: '2024-01-01',
      expirationAt: '2024-06-30',
    };

    const result = toVacancyFormFromResponse(
      { schedule: { schedulePublishAt: '2024-06-01' } },
      { ...FALLBACK_FORM, schedule: fallbackSchedule }
    );

    expect(result.schedule).toEqual(fallbackSchedule);
  });

  it('reads schedule from scheduleRequirement key', () => {
    const result = toVacancyFormFromResponse(
      {
        scheduleRequirement: {
          schedulePublishAt: '2024-07-01',
          expirationAt: '2024-11-30',
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.schedule).toEqual({
      schedulePublishAt: '2024-07-01',
      expirationAt: '2024-11-30',
    });
  });

  it('returns previousForm.schedule (undefined) when no schedule section present', () => {
    const result = toVacancyFormFromResponse(
      { title: 'No Schedule' },
      { ...FALLBACK_FORM }
    );

    expect(result.schedule).toBeUndefined();
  });
});
