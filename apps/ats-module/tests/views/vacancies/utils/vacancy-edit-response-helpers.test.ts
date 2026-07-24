import { describe, expect, it } from 'vitest';

import type { VacancyForm } from '@/views/vacancies/types';
import {
  normalizeCustomizableFormSection,
  toVacancyFormFromResponse,
} from '@/views/vacancies/utils/vacancy-edit-response-helpers';

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

// ─── Preferred skills: level hydration ───────────────────────────────────────

describe('toVacancyFormFromResponse — preferred skills levels', () => {
  it('hydrates levelId and levelName from the skills section', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {
          skills: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                id: 'sk-1',
                label: 'Java - Software Engineering',
                source: 'MASTER',
                levelId: 'level-1',
                levelName: 'Senior Level',
              },
            ],
          },
        },
      },
      FALLBACK_FORM
    );

    expect(result.preferredSkills?.skills[0]).toMatchObject({
      skillId: 'sk-1',
      skillName: 'Java',
      careerPathName: 'Software Engineering',
      levelId: 'level-1',
      levelName: 'Senior Level',
    });
  });

  it('leaves level empty for legacy skills without a level', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {
          skills: {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                id: 'sk-1',
                label: 'Java - Software Engineering',
                source: 'MASTER',
              },
            ],
          },
        },
      },
      FALLBACK_FORM
    );

    expect(result.preferredSkills?.skills[0].levelId).toBeUndefined();
    expect(result.preferredSkills?.skills[0].levelName).toBeUndefined();
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

  it('preserves isEnabled/dataTakenFromCandidate when the licensesAndCertifications wrapper has an empty nested array', () => {
    // Regression test: real API responses send an empty nested array
    // whenever dataTakenFromCandidate is true (there is no content to
    // persist). The normalizer used to recurse into that empty array and
    // lose the sibling isEnabled/dataTakenFromCandidate flags, resetting
    // the edit form's switch/checkbox back to off.
    const result = toVacancyFormFromResponse(
      {
        data: {
          licensesAndCertifications: {
            isEnabled: true,
            dataTakenFromCandidate: true,
            licensesAndCertifications: [],
          },
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.licenseCertificates?.[0].isEnabled).toBe(true);
    expect(result.licenseCertificates?.[0].dataTakenFromCandidate).toBe(true);
    expect(result.licenseCertificates?.[0].content).toEqual([]);
  });

  it('preserves isEnabled/dataTakenFromCandidate when the licenseCertificates wrapper has an empty nested array', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {
          licenseCertificates: {
            isEnabled: true,
            dataTakenFromCandidate: true,
            licenseCertificates: [],
          },
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.licenseCertificates?.[0].isEnabled).toBe(true);
    expect(result.licenseCertificates?.[0].dataTakenFromCandidate).toBe(true);
    expect(result.licenseCertificates?.[0].content).toEqual([]);
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

// ─── Top-level scalar: applicantCount / customizableForm default fallback ────

describe('toVacancyFormFromResponse — applicantCount and customizableForm defaults', () => {
  it('uses applicantCount from the API when it is a number', () => {
    const result = toVacancyFormFromResponse(
      { title: 'T', applicantCount: 42 },
      { ...FALLBACK_FORM, applicantCount: 0 }
    );
    expect(result.applicantCount).toBe(42);
  });

  it('falls back to previousForm.applicantCount when API value is not a number', () => {
    const result = toVacancyFormFromResponse(
      { title: 'T', applicantCount: 'not-a-number' },
      { ...FALLBACK_FORM, applicantCount: 7 }
    );
    expect(result.applicantCount).toBe(7);
  });

  it('builds a default empty customizableForm when previousForm.customizableForm is undefined', () => {
    const { customizableForm: _omit, ...formWithoutCustomizable } =
      FALLBACK_FORM;
    const result = toVacancyFormFromResponse(
      { title: 'T' },
      formWithoutCustomizable
    );
    expect(result.customizableForm).toEqual({
      isEnabled: false,
      sectionTitle: '',
      forms: [],
    });
  });
});

// ─── pickSection / readSectionValue — form-key and root-level branches ──────

describe('toVacancyFormFromResponse — pickSection form-key branch', () => {
  it('reads jobRequirements (plural form key) when jobRequirement is absent', () => {
    const result = toVacancyFormFromResponse(
      {
        jobRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          discipline: [],
          careerPath: [],
          level: [],
          role: [{ id: 'role-1', source: 'MASTER', label: 'Dev' }],
          jobTitle: [],
          employmentType: [],
          workSchedule: [],
          engagementModel: [],
          description: '',
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.jobRequirements[0].role[0].label).toBe('Dev');
  });

  it('reads profileRequirements (plural form key) when profileRequirement is absent', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: { id: 'g-1', label: 'Female' },
          maritalStatus: { id: 'm-1', label: 'Married' },
          addresses: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.profileRequirements.gender.label).toBe('Female');
  });
});

describe('toVacancyFormFromResponse — readSectionValue root-level fallback', () => {
  it('falls back to a root-level key when the data envelope does not contain it', () => {
    const result = toVacancyFormFromResponse(
      {
        data: {},
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [],
          },
        ],
      },
      { ...FALLBACK_FORM }
    );
    expect(result.secondaryEducation[0].isEnabled).toBe(true);
  });
});

// ─── Job requirements — additional fallback branches ─────────────────────────

describe('toVacancyFormFromResponse — job requirements additional branches', () => {
  it('maps an array of jobRequirement entries directly', () => {
    const result = toVacancyFormFromResponse(
      {
        jobRequirement: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            roles: [{ id: 'role-1', source: 'MASTER', label: 'Dev A' }],
            jobTitles: [],
          },
          {
            isEnabled: false,
            dataTakenFromCandidate: true,
            roles: [{ id: 'role-2', source: 'MASTER', label: 'Dev B' }],
            jobTitles: [],
          },
        ],
      },
      { ...FALLBACK_FORM }
    );
    expect(result.jobRequirements).toHaveLength(2);
    expect(result.jobRequirements[0].role[0].label).toBe('Dev A');
    expect(result.jobRequirements[1].role[0].label).toBe('Dev B');
  });

  it('falls back to internal defaults when entry is not a record', () => {
    const result = toVacancyFormFromResponse(
      {
        jobRequirement: [null],
      },
      { ...FALLBACK_FORM }
    );
    expect(result.jobRequirements[0]).toEqual({
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
    });
  });

  it('defaults isEnabled/dataTakenFromCandidate when entry omits them', () => {
    const result = toVacancyFormFromResponse(
      {
        jobRequirement: {
          roles: [],
          jobTitles: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.jobRequirements[0].isEnabled).toBe(true);
    expect(result.jobRequirements[0].dataTakenFromCandidate).toBe(false);
  });
});

// ─── normalizeSelectOption / normalizeAddress additional branches ───────────

describe('toVacancyFormFromResponse — normalizeSelectOption fallback chain', () => {
  it('falls back to displayValue when label is absent', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: { id: 'g-1', displayValue: 'Female (display)' },
          maritalStatus: null,
          addresses: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.profileRequirements.gender.label).toBe('Female (display)');
  });

  it('falls back to name when label and displayValue are absent', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: { id: 'g-1', name: 'Female (name)' },
          maritalStatus: null,
          addresses: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.profileRequirements.gender.label).toBe('Female (name)');
  });

  it('falls back to id when label, displayValue, and name are all absent', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: { id: 'g-1' },
          maritalStatus: null,
          addresses: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.profileRequirements.gender.label).toBe('g-1');
  });

  it('defaults isEnabled/dataTakenFromCandidate for profileRequirement when omitted', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: {
          gender: null,
          maritalStatus: null,
          addresses: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.profileRequirements.isEnabled).toBe(
      FALLBACK_FORM.profileRequirements.isEnabled
    );
    expect(result.profileRequirements.dataTakenFromCandidate).toBe(
      FALLBACK_FORM.profileRequirements.dataTakenFromCandidate
    );
  });
});

describe('toVacancyFormFromResponse — normalizeAddress additional branches', () => {
  it('returns default empty address fields when the entry is not a record', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: null,
          maritalStatus: null,
          addresses: ['not-a-record'],
        },
      },
      { ...FALLBACK_FORM }
    );
    const addr = result.profileRequirements.addresses[0];
    expect(addr.city).toEqual({ id: '', label: '' });
    expect(addr.stateProvince).toEqual({ id: '', label: '' });
    expect(addr.country).toEqual({ id: '', label: '' });
    expect(addr.postalCode).toBe('');
    expect(addr.isOpen).toBe(true);
  });

  it('reads state from the "state" key when stateProvince is absent', () => {
    const result = toVacancyFormFromResponse(
      {
        profileRequirement: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: null,
          maritalStatus: null,
          addresses: [
            {
              state: { id: 'state-2', label: 'Southern' },
              postalCode: '10000',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.profileRequirements.addresses[0].stateProvince).toEqual({
      id: 'state-2',
      label: 'Southern',
    });
  });
});

// ─── Secondary/Tertiary education — object-shape (non-array) branch ─────────

describe('toVacancyFormFromResponse — secondary/tertiary education object shape', () => {
  it('hydrates secondaryEducation from an object with a nested secondaryEducation array', () => {
    const result = toVacancyFormFromResponse(
      {
        secondaryEducation: {
          secondaryEducation: [
            {
              acceptsHomeSchooling: true,
              schools: [],
              schoolLocations: [],
              examinations: [],
              secondaryAwardingBody: [],
              fieldsOfStudy: [],
              grade: 'B',
              startDate: '2019-01-01',
              endDate: '2020-01-01',
              result: 'PASS',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.secondaryEducation[0].content).toHaveLength(1);
    expect(result.secondaryEducation[0].content[0].acceptsHomeSchooling).toBe(
      true
    );
    expect(result.secondaryEducation[0].isEnabled).toBe(false);
    expect(result.secondaryEducation[0].dataTakenFromCandidate).toBe(false);
  });

  it('hydrates secondaryEducation from an object with isEnabled/dataTakenFromCandidate and nested content', () => {
    const result = toVacancyFormFromResponse(
      {
        secondaryEducation: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          content: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.secondaryEducation[0].isEnabled).toBe(true);
    expect(result.secondaryEducation[0].dataTakenFromCandidate).toBe(true);
    expect(result.secondaryEducation[0].content).toEqual([]);
  });

  it('hydrates tertiaryEducation from an object with a nested tertiaryEducation array', () => {
    const result = toVacancyFormFromResponse(
      {
        tertiaryEducation: {
          tertiaryEducation: [
            {
              qualificationName: [],
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
              grade: 'C',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.tertiaryEducation[0].content).toHaveLength(1);
    expect(result.tertiaryEducation[0].content[0].grade).toBe('C');
  });

  it('hydrates tertiaryEducation from an object with isEnabled/dataTakenFromCandidate and nested content', () => {
    const result = toVacancyFormFromResponse(
      {
        tertiaryEducation: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          content: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.tertiaryEducation[0].isEnabled).toBe(true);
    expect(result.tertiaryEducation[0].dataTakenFromCandidate).toBe(true);
  });
});

// ─── License/certificate helper edge cases ──────────────────────────────────

describe('toVacancyFormFromResponse — license/certificate edge cases', () => {
  it('drops non-record and id-less license refs', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              nameOfLicenseCert: [
                'not-a-record',
                { source: 'MASTER', id: '', name: 'No id' },
                { source: 'MASTER', id: 'lc-ok', name: 'Valid' },
              ],
              issuingOrganization: [],
              organizationLocations: [],
              internationallyAccepted: false,
              issueDate: '',
              expirationDate: '',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert
    ).toHaveLength(1);
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0].id
    ).toBe('lc-ok');
  });

  it('leaves type undefined for an unrecognized license type value', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              nameOfLicenseCert: [
                { source: 'MASTER', id: 'lc-1', name: 'X', type: 'UNKNOWN' },
              ],
              issuingOrganization: [],
              organizationLocations: [],
              internationallyAccepted: false,
              issueDate: '',
              expirationDate: '',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0].type
    ).toBeUndefined();
  });

  it('returns [] when a license ref field is not an array', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              nameOfLicenseCert: 'not-an-array',
              issuingOrganization: [],
              organizationLocations: [],
              internationallyAccepted: false,
              issueDate: '',
              expirationDate: '',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert
    ).toEqual([]);
  });

  it('hydrates a group-shaped licenseCertificates array with default flags and internationallyAccepted', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: [
          {
            content: [
              {
                nameOfLicenseCert: [
                  { source: 'MASTER', id: 'lc-grp-1', name: 'Group Cert' },
                ],
                issuingOrganization: [],
                organizationLocations: [],
                issueDate: '2024-01-01',
                expirationDate: '2026-01-01',
              },
            ],
          },
        ],
      },
      {
        ...FALLBACK_FORM,
        licenseCertificates: [
          { isEnabled: true, dataTakenFromCandidate: true, content: [] },
        ],
      }
    );
    expect(result.licenseCertificates?.[0].isEnabled).toBe(true);
    expect(result.licenseCertificates?.[0].dataTakenFromCandidate).toBe(true);
    expect(
      result.licenseCertificates?.[0].content[0].internationallyAccepted
    ).toBe(false);
  });

  it('hydrates a bare content-row array directly under licenseCertificates', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: [
          {
            nameOfLicenseCert: [
              { source: 'MASTER', id: 'lc-bare-1', name: 'Bare Cert' },
            ],
            issuingOrganization: [],
            organizationLocations: [],
            internationallyAccepted: true,
            issueDate: '2024-01-01',
            expirationDate: '2026-01-01',
          },
        ],
      },
      { ...FALLBACK_FORM }
    );
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0].id
    ).toBe('lc-bare-1');
  });

  it('recurses through a nested group-shaped keyed array', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: {
          licenseCertificates: [
            {
              isEnabled: true,
              dataTakenFromCandidate: false,
              content: [
                {
                  nameOfLicenseCert: [
                    { source: 'MASTER', id: 'lc-rec-1', name: 'Recursed' },
                  ],
                  issuingOrganization: [],
                  organizationLocations: [],
                  internationallyAccepted: false,
                  issueDate: '',
                  expirationDate: '',
                },
              ],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0].id
    ).toBe('lc-rec-1');
  });

  it('treats a keyed array as content-shape when it only has issuingOrganization (no nameOfLicenseCert)', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          licenseCertificates: [
            {
              issuingOrganization: [
                { source: 'MASTER', id: 'org-1', name: 'Org' },
              ],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(
      result.licenseCertificates?.[0].content[0].issuingOrganization[0].id
    ).toBe('org-1');
  });

  it('hydrates a single content-row object placed directly under licenseCertificates', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          nameOfLicenseCert: [
            { source: 'MASTER', id: 'lc-single-1', name: 'Single' },
          ],
          issuingOrganization: [],
          organizationLocations: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0].id
    ).toBe('lc-single-1');
  });
});

// ─── Industry helper edge cases ─────────────────────────────────────────────

describe('toVacancyFormFromResponse — industry entry edge cases', () => {
  it('falls back to name, then id, for industry label', () => {
    const result = toVacancyFormFromResponse(
      {
        industry: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { source: 'MASTER', id: 'ind-name', name: 'Named Industry' },
            { source: 'MASTER', id: 'ind-only-id' },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredIndustries?.industries[0].label).toBe(
      'Named Industry'
    );
    expect(result.preferredIndustries?.industries[1].label).toBe('ind-only-id');
  });

  it('drops non-record and id-less/label-less industry entries', () => {
    const result = toVacancyFormFromResponse(
      {
        industry: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['not-a-record', { source: 'MASTER', id: '', name: '' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredIndustries?.industries).toEqual([]);
  });

  it('hydrates preferredIndustries from a bare array section', () => {
    const result = toVacancyFormFromResponse(
      {
        industry: [
          { source: 'MASTER', id: 'ind-bare', label: 'Bare Industry' },
        ],
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredIndustries?.industries).toEqual([
      { id: 'ind-bare', label: 'Bare Industry', source: 'MASTER' },
    ]);
    // fallback.isEnabled is `false` (not nullish), so `?? true` keeps it.
    expect(result.preferredIndustries?.isEnabled).toBe(
      FALLBACK_FORM.preferredIndustries!.isEnabled
    );
  });

  it('defaults isEnabled/dataTakenFromCandidate for preferredIndustries object shape when omitted', () => {
    const result = toVacancyFormFromResponse(
      {
        industry: {
          content: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredIndustries?.isEnabled).toBe(
      FALLBACK_FORM.preferredIndustries!.isEnabled
    );
    expect(result.preferredIndustries?.dataTakenFromCandidate).toBe(
      FALLBACK_FORM.preferredIndustries!.dataTakenFromCandidate
    );
  });
});

// ─── Projects/Publications/Clubs/Sports/Volunteering — fallback branches ────

describe('toVacancyFormFromResponse — projects/publications/clubs/sports/volunteering fallback branches', () => {
  it('defaults isEnabled/dataTakenFromCandidate and uses [] when the nested list key is missing', () => {
    const result = toVacancyFormFromResponse(
      {
        projects: {},
        publications: {},
        clubsAndSocieties: {},
        sports: {},
        volunteering: {},
      },
      {
        ...FALLBACK_FORM,
        projectsRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          projects: [],
        },
        preferredPublications: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          publications: [],
        },
        preferredClubSocieties: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          clubSocieties: [],
        },
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          sports: [],
        },
        preferredVolunteering: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          volunteering: [],
        },
      }
    );

    expect(result.projectsRequirements!.isEnabled).toBe(true);
    expect(result.projectsRequirements!.dataTakenFromCandidate).toBe(true);
    expect(result.projectsRequirements!.projects).toEqual([]);

    expect(result.preferredPublications!.isEnabled).toBe(true);
    expect(result.preferredPublications!.publications).toEqual([]);

    expect(result.preferredClubSocieties!.isEnabled).toBe(true);
    expect(result.preferredClubSocieties!.clubSocieties).toEqual([]);

    expect(result.preferredSports!.isEnabled).toBe(true);
    expect(result.preferredSports!.sports).toEqual([]);

    expect(result.preferredVolunteering!.isEnabled).toBe(true);
    expect(result.preferredVolunteering!.volunteering).toEqual([]);
  });

  it('generates ids and falls back organization/organizationName keys when entries omit their primary fields', () => {
    const result = toVacancyFormFromResponse(
      {
        projects: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          projects: [
            {
              organizations: [
                { source: 'MASTER', id: 'org-p', label: 'Org P' },
              ],
            },
          ],
        },
        publications: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          publications: [{ acceptedPublisher: 'Fallback Publisher' }],
        },
        clubsAndSocieties: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          clubsAndSocieties: [
            {
              position: 'Fallback Position',
              representedOrganization: [
                { source: 'MASTER', id: 'org-c', label: 'Org C' },
              ],
            },
          ],
        },
        sports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            {
              position: 'Fallback Position',
              sport: [{ source: 'MASTER', id: 'sport-1', label: 'Chess' }],
              organization: [{ source: 'MASTER', id: 'org-s', label: 'Org S' }],
            },
          ],
        },
        volunteering: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          volunteering: [
            {
              position: 'Fallback Position',
              organizationName: [
                { source: 'MASTER', id: 'org-v', label: 'Org V' },
              ],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );

    expect(result.projectsRequirements!.projects[0].id).toBe('project-1');
    expect(
      result.projectsRequirements!.projects[0].organizations[0].label
    ).toBe('Org P');

    expect(result.preferredPublications!.publications[0].id).toBe(
      'publication-1'
    );
    expect(
      result.preferredPublications!.publications[0].acceptedPublisher
    ).toBe('Fallback Publisher');

    expect(result.preferredClubSocieties!.clubSocieties[0].id).toBe('club-1');
    expect(result.preferredClubSocieties!.clubSocieties[0].position).toBe(
      'Fallback Position'
    );
    expect(
      result.preferredClubSocieties!.clubSocieties[0].representedOrganization[0]
        .label
    ).toBe('Org C');

    expect(result.preferredSports!.sports[0].id).toBe('sport-1');
    expect(result.preferredSports!.sports[0].position).toBe(
      'Fallback Position'
    );
    expect(
      result.preferredSports!.sports[0].representedOrganization[0].label
    ).toBe('Org S');

    expect(result.preferredVolunteering!.volunteering[0].id).toBe(
      'volunteering-1'
    );
    expect(result.preferredVolunteering!.volunteering[0].position).toBe(
      'Fallback Position'
    );
    expect(
      result.preferredVolunteering!.volunteering[0].organizationName[0].label
    ).toBe('Org V');
  });
});

// ─── normalizeOptionWithSource / normalizeOptionLabel helper edge cases ─────

describe('toVacancyFormFromResponse — option-with-source and option-label helper edge cases', () => {
  it('drops non-record and empty organization entries, and falls back through label chain', () => {
    const result = toVacancyFormFromResponse(
      {
        projects: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          projects: [
            {
              organization: [
                'not-a-record',
                { source: 'MASTER', value: '', label: '' },
                { source: 'MASTER', id: 'org-x', displayValue: 'Org X' },
              ],
              organizationLocations: [
                'not-a-record',
                { id: '', value: '', label: '' },
                { id: 'loc-x', name: 'Loc X' },
              ],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );

    const project = result.projectsRequirements!.projects[0];
    expect(project.organizations).toHaveLength(1);
    expect(project.organizations[0]).toEqual(
      expect.objectContaining({ value: 'org-x', label: 'Org X' })
    );
    expect(project.organizationLocations).toHaveLength(1);
    expect(project.organizationLocations[0]).toEqual(
      expect.objectContaining({ value: 'loc-x', label: 'Loc X' })
    );
  });

  it('returns [] for organization/organizationLocations arrays that are not arrays', () => {
    const result = toVacancyFormFromResponse(
      {
        projects: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          projects: [
            {
              organization: 'not-an-array',
              organizationLocations: 'not-an-array',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.projectsRequirements!.projects[0].organizations).toEqual([]);
    expect(
      result.projectsRequirements!.projects[0].organizationLocations
    ).toEqual([]);
  });
});

// ─── Preferred skills — normalizeSkillEntry edge cases ──────────────────────

describe('toVacancyFormFromResponse — preferred skills entry edge cases', () => {
  it('drops non-record skill entries', () => {
    const result = toVacancyFormFromResponse(
      {
        skills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['not-a-record'],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredSkills!.skills).toEqual([]);
  });

  it('falls back through displayValue/name/id for skill label', () => {
    const result = toVacancyFormFromResponse(
      {
        skills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { id: 'sk-2', displayValue: 'Display Skill' },
            { id: 'sk-3', name: 'Named Skill' },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredSkills!.skills[0].skillName).toBe('Display Skill');
    expect(result.preferredSkills!.skills[1].skillName).toBe('Named Skill');
  });

  it('drops a skill entry with no id and no derivable label', () => {
    const result = toVacancyFormFromResponse(
      {
        skills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ id: '' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredSkills!.skills).toEqual([]);
  });

  it('defaults isEnabled/dataTakenFromCandidate for preferredSkills when omitted', () => {
    const result = toVacancyFormFromResponse(
      { skills: { content: [] } },
      {
        ...FALLBACK_FORM,
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          skills: [],
        },
      }
    );
    expect(result.preferredSkills!.isEnabled).toBe(true);
    expect(result.preferredSkills!.dataTakenFromCandidate).toBe(true);
  });
});

// ─── Patents — additional fallback branches ─────────────────────────────────

describe('toVacancyFormFromResponse — patents additional branches', () => {
  it('defaults the whole patents value when both rawSection and fallback are absent', () => {
    const { patents: _omit, ...formWithoutPatents } = FALLBACK_FORM;
    const result = toVacancyFormFromResponse(
      { title: 'T' },
      formWithoutPatents
    );
    expect(result.patents).toEqual({
      isEnabled: false,
      dataTakenFromCandidate: false,
      patents: [],
    });
  });

  it('defaults isEnabled/dataTakenFromCandidate for a patent entry when omitted from the section', () => {
    const result = toVacancyFormFromResponse(
      {
        patents: {
          patents: [{ statuses: [], relatedIndustry: [] }],
        },
      },
      {
        ...FALLBACK_FORM,
        patents: { isEnabled: true, dataTakenFromCandidate: true, patents: [] },
      }
    );
    expect(result.patents?.isEnabled).toBe(true);
    expect(result.patents?.dataTakenFromCandidate).toBe(true);
  });

  it('treats a non-array relatedIndustry as empty', () => {
    const result = toVacancyFormFromResponse(
      {
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [{ statuses: [], relatedIndustry: 'not-an-array' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.patents?.patents[0].relatedIndustries).toEqual([]);
  });

  it('falls back to industry id when label and displayValue are absent', () => {
    const result = toVacancyFormFromResponse(
      {
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [
            {
              statuses: [],
              relatedIndustry: [{ id: 'ind-only-id', source: 'MASTER' }],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.patents?.patents[0].relatedIndustries[0].label).toBe(
      'ind-only-id'
    );
  });
});

// ─── Preferred Honours & Awards section ─────────────────────────────────────

describe('toVacancyFormFromResponse — preferred honours & awards section', () => {
  it('hydrates honoursAndAwards content with dates and associated fields', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredHonoursAwards: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          honoursAndAwards: [
            {
              title: 'Employee of the Year',
              issuedBy: 'ACME Corp',
              issuedFromDate: '2023-01-01',
              issuedToDate: '2023-06-01',
              associatedOrganizations: [
                { source: 'MASTER', id: 'org-1', label: 'ACME' },
              ],
              organizationLocations: [{ id: 'loc-1', label: 'Colombo' }],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );

    const entry = result.preferredHonoursAwards!.honoursAndAwards[0];
    expect(entry.title).toBe('Employee of the Year');
    expect(entry.issuedBy).toBe('ACME Corp');
    expect(entry.issuedDateFrom).toBeInstanceOf(Date);
    expect(entry.issuedDateTo).toBeInstanceOf(Date);
    expect(entry.associatedOrganizations[0]).toEqual(
      expect.objectContaining({ value: 'org-1', label: 'ACME' })
    );
    expect(entry.organizationLocations[0]).toEqual(
      expect.objectContaining({ value: 'loc-1', label: 'Colombo' })
    );
    expect(entry.isOpen).toBe(true);
    expect(result.preferredHonoursAwards!.isEnabled).toBe(true);
  });

  it('reads dates from issuedDateFrom/issuedDateTo aliases', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredHonoursAwards: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          honoursAndAwards: [
            {
              title: 'Award',
              issuedBy: 'Org',
              issuedDateFrom: '2022-01-01',
              issuedDateTo: '2022-06-01',
              associatedOrganizations: [],
              organizationLocations: [],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    const entry = result.preferredHonoursAwards!.honoursAndAwards[0];
    expect(entry.issuedDateFrom).toBeInstanceOf(Date);
    expect(entry.issuedDateTo).toBeInstanceOf(Date);
  });

  it('leaves dates undefined when no date fields are present', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredHonoursAwards: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          honoursAndAwards: [
            {
              title: 'Award',
              issuedBy: 'Org',
              associatedOrganizations: [],
              organizationLocations: [],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    const entry = result.preferredHonoursAwards!.honoursAndAwards[0];
    expect(entry.issuedDateFrom).toBeUndefined();
    expect(entry.issuedDateTo).toBeUndefined();
  });

  it('reads honoursAndAwards content via the honoursAndAwards fallback key', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredHonoursAwards: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          honoursAndAwards: [
            {
              title: 'Alt Shape Award',
              issuedBy: 'Org',
              associatedOrganizations: [],
              organizationLocations: [],
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredHonoursAwards!.honoursAndAwards[0].title).toBe(
      'Alt Shape Award'
    );
  });

  it('returns the default value when the section is not a record and no fallback is provided', () => {
    const { preferredHonoursAwards: _omit, ...formWithoutHonours } =
      FALLBACK_FORM;
    const result = toVacancyFormFromResponse(
      { title: 'T' },
      formWithoutHonours
    );
    expect(result.preferredHonoursAwards).toEqual({
      isEnabled: false,
      dataTakenFromCandidate: false,
      honoursAndAwards: [],
    });
  });

  it('defaults isEnabled/dataTakenFromCandidate when omitted from the section', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredHonoursAwards: { honoursAndAwards: [] },
      },
      {
        ...FALLBACK_FORM,
        preferredHonoursAwards: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          honoursAndAwards: [],
        },
      }
    );
    expect(result.preferredHonoursAwards!.isEnabled).toBe(true);
    expect(result.preferredHonoursAwards!.dataTakenFromCandidate).toBe(true);
  });
});

// ─── Preferred Languages / Causes / Hobbies sections ────────────────────────

describe('toVacancyFormFromResponse — preferred languages section', () => {
  it('hydrates languages from the content key', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredLanguages: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ source: 'MASTER', id: 'lang-1', label: 'English' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredLanguages!.languages).toEqual([
      { id: 'lang-1', label: 'English', source: 'MASTER' },
    ]);
    expect(result.preferredLanguages!.isEnabled).toBe(true);
  });

  it('hydrates languages from the languages key when content is absent', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredLanguages: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          languages: [{ source: 'MASTER', id: 'lang-2', label: 'Sinhala' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredLanguages!.languages).toEqual([
      { id: 'lang-2', label: 'Sinhala', source: 'MASTER' },
    ]);
  });

  it('returns fallback when the section is not a record', () => {
    const fallbackLanguages = {
      isEnabled: true,
      dataTakenFromCandidate: true,
      languages: [{ id: 'x', label: 'X', source: 'MASTER' }],
    };
    const result = toVacancyFormFromResponse(
      { preferredLanguages: 'not-a-record' },
      { ...FALLBACK_FORM, preferredLanguages: fallbackLanguages }
    );
    expect(result.preferredLanguages).toEqual(fallbackLanguages);
  });

  it('defaults isEnabled/dataTakenFromCandidate when omitted', () => {
    const result = toVacancyFormFromResponse(
      { preferredLanguages: { content: [] } },
      {
        ...FALLBACK_FORM,
        preferredLanguages: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          languages: [],
        },
      }
    );
    expect(result.preferredLanguages!.isEnabled).toBe(true);
    expect(result.preferredLanguages!.dataTakenFromCandidate).toBe(true);
  });
});

describe('toVacancyFormFromResponse — preferred causes section', () => {
  it('hydrates causes from the content key', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredCauses: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ source: 'MASTER', id: 'cause-1', label: 'Education' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredCauses!.causes).toEqual([
      { id: 'cause-1', label: 'Education', source: 'MASTER' },
    ]);
  });

  it('hydrates causes from the causes key when content is absent', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredCauses: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          causes: [{ source: 'MASTER', id: 'cause-2', label: 'Health' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredCauses!.causes).toEqual([
      { id: 'cause-2', label: 'Health', source: 'MASTER' },
    ]);
  });

  it('returns fallback when the section is not a record', () => {
    const result = toVacancyFormFromResponse(
      { preferredCauses: 42 },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredCauses).toEqual(FALLBACK_FORM.preferredCauses);
  });

  it('defaults isEnabled/dataTakenFromCandidate when omitted', () => {
    const result = toVacancyFormFromResponse(
      { preferredCauses: { content: [] } },
      {
        ...FALLBACK_FORM,
        preferredCauses: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          causes: [],
        },
      }
    );
    expect(result.preferredCauses!.isEnabled).toBe(true);
    expect(result.preferredCauses!.dataTakenFromCandidate).toBe(true);
  });
});

describe('toVacancyFormFromResponse — preferred hobbies section', () => {
  it('hydrates hobbies from the content key', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredHobbies: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ source: 'MASTER', id: 'hobby-1', label: 'Reading' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredHobbies!.hobbies).toEqual([
      { id: 'hobby-1', label: 'Reading', source: 'MASTER' },
    ]);
  });

  it('hydrates hobbies from the hobbyList key when content is absent', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredHobbies: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          hobbyList: [{ source: 'MASTER', id: 'hobby-2', label: 'Chess' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredHobbies!.hobbies).toEqual([
      { id: 'hobby-2', label: 'Chess', source: 'MASTER' },
    ]);
  });

  it('hydrates hobbies from the hobbies key when content and hobbyList are absent', () => {
    const result = toVacancyFormFromResponse(
      {
        preferredHobbies: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          hobbies: [{ source: 'MASTER', id: 'hobby-3', label: 'Painting' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredHobbies!.hobbies).toEqual([
      { id: 'hobby-3', label: 'Painting', source: 'MASTER' },
    ]);
  });

  it('returns fallback when the section is not a record', () => {
    const result = toVacancyFormFromResponse(
      { preferredHobbies: null },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredHobbies).toEqual(FALLBACK_FORM.preferredHobbies);
  });

  it('defaults isEnabled/dataTakenFromCandidate when omitted', () => {
    const result = toVacancyFormFromResponse(
      { preferredHobbies: { content: [] } },
      {
        ...FALLBACK_FORM,
        preferredHobbies: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          hobbies: [],
        },
      }
    );
    expect(result.preferredHobbies!.isEnabled).toBe(true);
    expect(result.preferredHobbies!.dataTakenFromCandidate).toBe(true);
  });
});

// ─── normalizeCustomizableFormSection (also exported directly) ─────────────

describe('normalizeCustomizableFormSection', () => {
  const FALLBACK_CUSTOMIZABLE = {
    isEnabled: false,
    sectionTitle: '',
    forms: [],
  };

  it('returns fallback when raw is not a record and not an array', () => {
    expect(
      normalizeCustomizableFormSection('not-a-record', FALLBACK_CUSTOMIZABLE)
    ).toBe(FALLBACK_CUSTOMIZABLE);
  });

  it('returns fallback when isEnabled/sectionTitle/forms are all empty/false', () => {
    const result = normalizeCustomizableFormSection(
      { isEnabled: false, sectionTitle: '', forms: [] },
      FALLBACK_CUSTOMIZABLE
    );
    expect(result).toBe(FALLBACK_CUSTOMIZABLE);
  });

  it('unwraps the first element when raw is an array', () => {
    const result = normalizeCustomizableFormSection(
      [
        {
          isEnabled: true,
          sectionTitle: 'Custom Questions',
          forms: [],
        },
      ],
      FALLBACK_CUSTOMIZABLE
    );
    expect(result.isEnabled).toBe(true);
    expect(result.sectionTitle).toBe('Custom Questions');
  });

  it('hydrates full forms/questions/options with sequential ids', () => {
    const result = normalizeCustomizableFormSection(
      {
        isEnabled: true,
        sectionTitle: 'Screening',
        forms: [
          {
            title: 'Form A',
            questions: [
              {
                questionText: 'Pick one',
                questionType: 'multiple_choice',
                required: true,
                options: [
                  { value: 'Option A' },
                  { label: 'Option B' },
                  'Option C',
                ],
              },
              {
                text: 'Rate this',
                type: 'linear_scale',
                linearScale: {
                  startValue: 1,
                  endValue: 5,
                  startLabel: 'Low',
                  endLabel: 'High',
                },
              },
            ],
          },
          {
            title: 'Form B',
            questions: [],
          },
        ],
      },
      FALLBACK_CUSTOMIZABLE
    );

    expect(result.isEnabled).toBe(true);
    expect(result.sectionTitle).toBe('Screening');
    expect(result.forms).toHaveLength(2);
    expect(result.forms[0].id).toBe(1);
    expect(result.forms[1].id).toBe(2);

    const [q1, q2] = result.forms[0].questions;
    expect(q1.id).toBe(1);
    expect(q1.text).toBe('Pick one');
    expect(q1.type).toBe('MULTIPLE_CHOICE');
    expect(q1.required).toBe(true);
    expect(q1.options).toEqual([
      { id: 1, value: 'Option A' },
      { id: 2, value: 'Option B' },
      { id: 3, value: 'Option C' },
    ]);
    expect(q1.from).toBe(0);
    expect(q1.to).toBe(2);

    expect(q2.id).toBe(2);
    expect(q2.text).toBe('Rate this');
    expect(q2.type).toBe('LINEAR_SCALE');
    expect(q2.required).toBe(false);
    expect(q2.options).toEqual([{ id: 1, value: '' }]);
    expect(q2.from).toBe(1);
    expect(q2.to).toBe(5);
    expect(q2.startLabel).toBe('Low');
    expect(q2.endLabel).toBe('High');
  });

  it('filters out options with empty values and falls back to a single blank option', () => {
    const result = normalizeCustomizableFormSection(
      {
        isEnabled: true,
        sectionTitle: 'S',
        forms: [
          {
            title: 'Form A',
            questions: [
              {
                questionText: 'Q',
                questionType: 'DROPDOWN',
                options: [{ value: '' }, null, 42],
              },
            ],
          },
        ],
      },
      FALLBACK_CUSTOMIZABLE
    );
    expect(result.forms[0].questions[0].options).toEqual([
      { id: 1, value: '' },
    ]);
  });

  it('returns an empty question type when the API type is unrecognized', () => {
    const result = normalizeCustomizableFormSection(
      {
        isEnabled: true,
        sectionTitle: 'S',
        forms: [
          {
            title: 'Form A',
            questions: [{ questionText: 'Q', questionType: 'NOT_A_TYPE' }],
          },
        ],
      },
      FALLBACK_CUSTOMIZABLE
    );
    expect(result.forms[0].questions[0].type).toBe('');
  });

  it('defaults `to` to 2 when linearScale.endValue resolves to 0', () => {
    const result = normalizeCustomizableFormSection(
      {
        isEnabled: true,
        sectionTitle: 'S',
        forms: [
          {
            title: 'Form A',
            questions: [{ questionText: 'Q', questionType: 'SHORT_ANSWER' }],
          },
        ],
      },
      FALLBACK_CUSTOMIZABLE
    );
    expect(result.forms[0].questions[0].to).toBe(2);
  });

  it('ignores non-record forms and non-record questions', () => {
    const result = normalizeCustomizableFormSection(
      {
        isEnabled: true,
        sectionTitle: 'S',
        forms: ['not-a-record', { title: 'Valid', questions: ['nope'] }],
      },
      FALLBACK_CUSTOMIZABLE
    );
    expect(result.forms).toHaveLength(1);
    expect(result.forms[0].title).toBe('Valid');
    expect(result.forms[0].questions).toEqual([]);
  });

  it('treats non-array forms/questions/options as empty', () => {
    const result = normalizeCustomizableFormSection(
      {
        isEnabled: true,
        sectionTitle: 'S',
        forms: 'not-an-array',
      },
      FALLBACK_CUSTOMIZABLE
    );
    expect(result.forms).toEqual([]);
  });
});

describe('toVacancyFormFromResponse — remaining edge branches', () => {
  it('returns [] from pickRawContent when neither content nor any fallback key is an array', () => {
    const result = toVacancyFormFromResponse(
      {
        skills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredSkills!.skills).toEqual([]);
  });

  it('accepts CERTIFICATE as a valid license/certificate type', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              nameOfLicenseCert: [
                {
                  source: 'MASTER',
                  id: 'lc-cert',
                  name: 'Cert',
                  type: 'CERTIFICATE',
                },
              ],
              issuingOrganization: [],
              organizationLocations: [],
              internationallyAccepted: false,
              issueDate: '',
              expirationDate: '',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0].type
    ).toBe('CERTIFICATE');
  });

  it('falls back to id for a license ref name when name/label/displayValue are all absent', () => {
    const result = toVacancyFormFromResponse(
      {
        licenseCertificates: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              nameOfLicenseCert: [{ source: 'MASTER', id: 'lc-name-fallback' }],
              issuingOrganization: [],
              organizationLocations: [],
              internationallyAccepted: false,
              issueDate: '',
              expirationDate: '',
            },
          ],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(
      result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0].name
    ).toBe('lc-name-fallback');
  });

  it('reads club/society entries from the clubSocieties key when clubsAndSocieties is absent', () => {
    const result = toVacancyFormFromResponse(
      {
        clubsAndSocieties: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          clubSocieties: [{ clubSocietyRequirementId: 'club-alt-1' }],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.preferredClubSocieties!.clubSocieties[0].id).toBe(
      'club-alt-1'
    );
  });
});

describe('toVacancyFormFromResponse — customizableForm section resolution', () => {
  it('reads the customizableForm section via the customizedForm key', () => {
    const result = toVacancyFormFromResponse(
      {
        customizedForm: {
          isEnabled: true,
          sectionTitle: 'Custom',
          forms: [],
        },
      },
      { ...FALLBACK_FORM }
    );
    expect(result.customizableForm!.sectionTitle).toBe('Custom');
  });
});
