import { describe, expect, it } from 'vitest';

import type { VacancyForm } from '@/views/vacancies/types';
import {
  toCreateVacancyPayload,
  toUpdateVacancyPayload,
} from '@/views/vacancies/utils';

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

  it('serializes licensesAndCertifications refs with swagger-compatible fields only', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                nameOfLicenseCert: [
                  {
                    source: 'MASTER',
                    id: 'license-1',
                    type: 'LICENSE',
                    name: 'Remove me',
                  },
                ],
                issuingOrganization: [
                  {
                    source: 'MASTER',
                    id: 'org-1',
                    name: 'Remove me',
                  },
                ],
                organizationLocations: [
                  {
                    source: 'MASTER',
                    id: 'loc-1',
                    name: 'Remove me',
                  },
                ],
                internationallyAccepted: true,
                issueDate: '2026-06-01',
                expirationDate: '2026-06-10',
              },
            ],
          },
        ],
      })
    );

    expect(payload.data.licensesAndCertifications).toEqual([
      {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            nameOfLicenseCert: [
              {
                source: 'MASTER',
                id: 'license-1',
                type: 'LICENSE',
              },
            ],
            issuingOrganization: [{ source: 'MASTER', id: 'org-1' }],
            organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
            internationallyAccepted: true,
            issueDate: '2026-06-01',
            expirationDate: '2026-06-10',
          },
        ],
      },
    ]);
  });

  it('clears license content to an empty array when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: true,
            content: [
              {
                nameOfLicenseCert: [
                  {
                    source: 'MASTER',
                    id: 'license-2',
                    type: 'CERTIFICATION',
                  },
                ],
                issuingOrganization: [{ source: 'MASTER', id: 'org-2' }],
                organizationLocations: [{ source: 'MASTER', id: 'loc-2' }],
                internationallyAccepted: true,
                issueDate: '2026-06-18',
                expirationDate: '2027-06-18',
              },
            ],
          },
        ],
      })
    );

    expect(payload.data.licensesAndCertifications).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('drops unresolved temporary license ids from API payload', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                nameOfLicenseCert: [
                  {
                    source: 'PENDING',
                    id: '__pending_license_cert_123',
                    type: 'CERTIFICATION',
                    name: 'Custom Cert',
                  },
                ],
                issuingOrganization: [{ source: 'MASTER', id: 'org-3' }],
                organizationLocations: [{ source: 'MASTER', id: 'loc-3' }],
                internationallyAccepted: false,
                issueDate: '',
                expirationDate: '',
              },
            ],
          },
        ],
      })
    );

    expect(payload.data.licensesAndCertifications[0].content[0]).toMatchObject({
      nameOfLicenseCert: [],
    });
  });

  it('keeps CERTIFICATE type in API payload when provided from form state', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                nameOfLicenseCert: [
                  {
                    source: 'MASTER',
                    id: 'cert-3',
                    type: 'CERTIFICATE',
                  },
                ],
                issuingOrganization: [{ source: 'MASTER', id: 'org-9' }],
                organizationLocations: [{ source: 'MASTER', id: 'loc-9' }],
                internationallyAccepted: false,
                issueDate: '2026-01-01',
                expirationDate: '2027-01-01',
              },
            ],
          },
        ],
      })
    );

    expect(
      payload.data.licensesAndCertifications[0].content[0].nameOfLicenseCert[0]
    ).toEqual({
      source: 'MASTER',
      id: 'cert-3',
      type: 'CERTIFICATE',
    });
  });
});

describe('toCreateVacancyPayload — patents statuses array', () => {
  it('maps multiple patent statuses to a statuses array', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [
            {
              statuses: [
                { value: 'PATENT_PENDING', label: 'Patent Pending' },
                { value: 'PATENT_ISSUED', label: 'Patent Issued' },
              ],
              relatedIndustries: [],
              fromDate: undefined,
              toDate: undefined,
              isOpen: true,
            },
          ],
        },
      })
    );

    expect(payload.data.patents[0].content[0].statuses).toEqual([
      'PATENT_PENDING',
      'PATENT_ISSUED',
    ]);
    expect(payload.data.patents[0].content[0]).not.toHaveProperty('status');
  });

  it('maps a single patent status to a one-element statuses array', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [
            {
              statuses: [{ value: 'PATENT_PENDING', label: 'Patent Pending' }],
              relatedIndustries: [],
              fromDate: undefined,
              toDate: undefined,
              isOpen: true,
            },
          ],
        },
      })
    );

    expect(payload.data.patents[0].content[0].statuses).toEqual([
      'PATENT_PENDING',
    ]);
  });

  it('maps empty statuses to an empty array', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [
            {
              statuses: [],
              relatedIndustries: [],
              fromDate: undefined,
              toDate: undefined,
              isOpen: true,
            },
          ],
        },
      })
    );

    expect(payload.data.patents[0].content[0].statuses).toEqual([]);
  });

  it('returns default empty patents group when form has no patents', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.patents).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('maps preferred skills to {source, id, levelId} content items', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'skill-1',
              skillName: 'Java',
              careerPathName: 'Software Engineering',
              displayValue: 'Java - Software Engineering',
              source: 'MASTER',
              levelId: 'level-1',
              levelName: 'Senior Level',
            },
          ],
        },
      })
    );

    expect(payload.data.skills.content).toEqual([
      { source: 'MASTER', id: 'skill-1', levelId: 'level-1' },
    ]);
  });

  it('clears preferred skills content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          skills: [
            {
              skillId: 'skill-1',
              skillName: 'Java',
              careerPathName: 'Software Engineering',
              displayValue: 'Java - Software Engineering',
              source: 'MASTER',
              levelId: 'level-1',
            },
          ],
        },
      })
    );

    expect(payload.data.skills).toEqual({
      isEnabled: true,
      dataTakenFromCandidate: true,
      content: [],
    });
  });
});

describe('toCreateVacancyPayload — schedule null values', () => {
  it('outputs null for both schedule fields when schedule is undefined', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({ schedule: undefined })
    );

    expect(payload.data.schedule).toEqual({
      schedulePublishAt: null,
      expirationAt: null,
    });
  });

  it('outputs null for empty string schedule fields', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        schedule: { schedulePublishAt: '', expirationAt: '' },
      })
    );

    expect(payload.data.schedule).toEqual({
      schedulePublishAt: null,
      expirationAt: null,
    });
  });

  it('passes through non-empty schedule values', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        schedule: {
          schedulePublishAt: '2024-06-01T10:00:00',
          expirationAt: '2024-12-31T23:59:59',
        },
      })
    );

    expect(payload.data.schedule).toEqual({
      schedulePublishAt: '2024-06-01T10:00:00',
      expirationAt: '2024-12-31T23:59:59',
    });
  });
});

describe('toCreateVacancyPayload — profile requirement addresses', () => {
  it('maps only the leading segment of a compound city ref id', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        profileRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: { id: '', label: '' },
          maritalStatus: { id: '', label: '' },
          addresses: [
            {
              city: {
                id: '0b7f816b-ec39-4075-b421-ec47cb8968de|aaaaaaaa-bbbb',
                label: 'Gampaha',
              },
              stateProvince: { id: 'state-ref-id', label: 'Western Province' },
              country: { id: 'country-ref-id', label: 'Sri Lanka' },
              postalCode: '11500',
              isOpen: false,
            },
          ],
        },
      })
    );

    expect(payload.data.profileRequirement[0].content.addresses[0]).toEqual({
      cityRefId: '0b7f816b-ec39-4075-b421-ec47cb8968de',
      stateRefId: 'state-ref-id',
      countryRefId: 'country-ref-id',
      postalCode: '11500',
    });
  });

  it('passes through a plain (non-compound) city ref id unchanged', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        profileRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: { id: '', label: '' },
          maritalStatus: { id: '', label: '' },
          addresses: [
            {
              city: { id: 'ChIJA3B6D9FT4joRjYPTMk0uCzI', label: 'Ada' },
              stateProvince: { id: 'state-ref-id', label: 'Oklahoma' },
              country: { id: 'country-ref-id', label: 'United States' },
              postalCode: '',
              isOpen: false,
            },
          ],
        },
      })
    );

    expect(
      payload.data.profileRequirement[0].content.addresses[0].cityRefId
    ).toBe('ChIJA3B6D9FT4joRjYPTMk0uCzI');
  });
});

describe('toCreateVacancyPayload — job requirement', () => {
  it('returns a default empty job requirement when none exists', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({ jobRequirements: [] })
    );

    expect(payload.data.jobRequirement).toEqual({
      isEnabled: true,
      dataTakenFromCandidate: false,
      roles: [],
      jobTitles: [],
    });
  });

  it('returns a minimal shape when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        jobRequirements: [
          {
            isEnabled: true,
            dataTakenFromCandidate: true,
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
      })
    );

    expect(payload.data.jobRequirement).toEqual({
      isEnabled: true,
      dataTakenFromCandidate: true,
      roles: [],
      jobTitles: [],
    });
  });

  it('maps discipline, careerPath, level, roles, and other list fields', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        jobRequirements: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            discipline: [
              { source: 'MASTER', id: 'disc-1', label: 'Discipline' },
            ],
            careerPath: [
              { source: 'MASTER', id: 'cp-1', label: 'CareerPath' },
            ],
            level: [{ source: 'MASTER', id: 'lvl-1', label: 'Level' }],
            role: [{ source: 'MASTER', id: 'role-1', label: 'Role' }],
            jobTitle: [{ source: 'MASTER', id: 'jt-1', label: 'JobTitle' }],
            employmentType: [
              { source: 'MASTER', id: 'et-1', label: 'FullTime' },
            ],
            workSchedule: [{ source: 'MASTER', id: 'ws-1', label: 'Day' }],
            engagementModel: [
              { source: 'MASTER', id: 'em-1', label: 'Permanent' },
            ],
            description: 'Some description',
          },
        ],
      })
    );

    expect(payload.data.jobRequirement).toEqual({
      isEnabled: true,
      dataTakenFromCandidate: false,
      discipline: { source: 'MASTER', id: 'disc-1' },
      careerPath: { source: 'MASTER', id: 'cp-1' },
      level: { source: 'MASTER', id: 'lvl-1' },
      roles: [{ source: 'MASTER', id: 'role-1' }],
      jobTitles: [{ source: 'MASTER', id: 'jt-1' }],
      employmentTypes: [{ source: 'MASTER', id: 'et-1' }],
      workSchedules: [{ source: 'MASTER', id: 'ws-1' }],
      engagementModels: [{ source: 'MASTER', id: 'em-1' }],
      description: 'Some description',
    });
  });
});

describe('toCreateVacancyPayload — profile requirement dataTakenFromCandidate', () => {
  it('returns a cleared content shape when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        profileRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          gender: { id: '', label: '' },
          maritalStatus: { id: '', label: '' },
          addresses: [],
        },
      })
    );

    expect(payload.data.profileRequirement).toEqual([
      {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: { gender: '', maritalStatus: '', addresses: [] },
      },
    ]);
  });
});

describe('toCreateVacancyPayload — patents related industries and dates', () => {
  it('maps related industries and formats Date/string date values', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [
            {
              statuses: [],
              relatedIndustries: [
                { value: 'ind-1', label: 'Tech', source: 'MASTER' },
              ],
              fromDate: new Date(2024, 0, 15),
              toDate: undefined,
              isOpen: true,
            },
          ],
        },
      })
    );

    const content = payload.data.patents[0].content[0];
    expect(content.relatedIndustry).toEqual([
      { source: 'MASTER', id: 'ind-1' },
    ]);
    expect(content.fromDate).toBe('2024-01-15');
    expect(content.toDate).toBeUndefined();
  });
});

describe('toCreateVacancyPayload — patents dataTakenFromCandidate', () => {
  it('clears patents content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          patents: [],
        },
      })
    );

    expect(payload.data.patents).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });
});

describe('toCreateVacancyPayload — honours and awards', () => {
  it('returns a default empty group when preferredHonoursAwards is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.honoursAndAwards).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredHonoursAwards: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          honoursAndAwards: [],
        },
      })
    );

    expect(payload.data.honoursAndAwards).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('maps full honour entry content including formatted dates', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredHonoursAwards: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          honoursAndAwards: [
            {
              title: 'Award',
              issuedBy: 'Org',
              issuedDateFrom: new Date(2023, 4, 1),
              issuedDateTo: null,
              associatedOrganizations: [
                { value: 'org-1', label: 'Org1', source: 'MASTER' },
              ],
              organizationLocations: [{ value: 'loc-1', label: 'Loc1' }],
              isOpen: false,
            },
          ],
        },
      })
    );

    expect(payload.data.honoursAndAwards[0].content[0]).toEqual({
      title: 'Award',
      associatedOrganizations: [{ source: 'MASTER', id: 'org-1' }],
      organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
      issuedBy: 'Org',
      issuedFromDate: '2023-05-01',
      issuedToDate: undefined,
    });
  });
});

describe('toCreateVacancyPayload — projects', () => {
  it('returns a default empty group when projectsRequirements is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.projects).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        projectsRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          projects: [],
        },
      })
    );

    expect(payload.data.projects).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('maps full project entry content', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        projectsRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          projects: [
            {
              id: 'p1',
              isOpen: false,
              startDate: '2024-01-01',
              endDate: '2024-06-01',
              relatedIndustry: [
                { value: 'ind-1', label: 'Tech', source: 'MASTER' },
              ],
              organizationLocations: [{ value: 'loc-1', label: 'Loc' }],
              organizations: [
                { value: 'org-1', label: 'Org', source: 'MASTER' },
              ],
            },
          ],
        },
      })
    );

    expect(payload.data.projects[0].content[0]).toEqual({
      relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
      organization: [{ source: 'MASTER', id: 'org-1' }],
      organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
      startDate: '2024-01-01',
      endDate: '2024-06-01',
    });
  });
});

describe('toCreateVacancyPayload — publications', () => {
  it('returns a default empty group when preferredPublications is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.publications).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredPublications: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          publications: [],
        },
      })
    );

    expect(payload.data.publications).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('maps full publication entry content', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredPublications: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          publications: [
            {
              id: 'pub1',
              isOpen: false,
              acceptedPublisher: 'Journal',
              publishedDateFrom: '2022-01-01',
              publishedDateTo: '2022-03-01',
            },
          ],
        },
      })
    );

    expect(payload.data.publications[0].content[0]).toEqual({
      acceptedPublisherName: 'Journal',
      publishedDateFrom: '2022-01-01',
      publishedDateTo: '2022-03-01',
    });
  });
});

describe('toCreateVacancyPayload — club societies', () => {
  it('returns a default empty group when preferredClubSocieties is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.clubsAndSocieties).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredClubSocieties: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          clubSocieties: [],
        },
      })
    );

    expect(payload.data.clubsAndSocieties).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('maps full club society entry content', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredClubSocieties: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          clubSocieties: [
            {
              id: 'c1',
              isOpen: false,
              clubSociety: [
                { value: 'cs-1', label: 'Club', source: 'MASTER' },
              ],
              clubSocietySearch: '',
              startDate: '2020-01-01',
              endDate: '2021-01-01',
              representedOrganization: [
                { value: 'org-1', label: 'Org', source: 'MASTER' },
              ],
              organizationLocations: [{ value: 'loc-1', label: 'Loc' }],
              position: 'Member',
            },
          ],
        },
      })
    );

    expect(payload.data.clubsAndSocieties[0].content[0]).toEqual({
      clubSociety: [{ source: 'MASTER', id: 'cs-1' }],
      organization: [{ source: 'MASTER', id: 'org-1' }],
      organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
      positionRoleHeld: 'Member',
      startDate: '2020-01-01',
      endDate: '2021-01-01',
    });
  });
});

describe('toCreateVacancyPayload — sports', () => {
  it('returns a default empty group when preferredSports is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.sports).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          sports: [],
        },
      })
    );

    expect(payload.data.sports).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('maps full sport entry content', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            {
              id: 's1',
              isOpen: false,
              sport: [{ value: 'sport-1', label: 'Football', source: 'MASTER' }],
              sportSearch: '',
              levelRepresented: [
                { value: 'lvl-1', label: 'National', source: 'MASTER' },
              ],
              representedOrganization: [
                { value: 'org-1', label: 'Org', source: 'MASTER' },
              ],
              organizationLocations: [{ value: 'loc-1', label: 'Loc' }],
              position: 'Captain',
              startDate: '2019-01-01',
              endDate: '2020-01-01',
            },
          ],
        },
      })
    );

    expect(payload.data.sports[0].content[0]).toEqual({
      nameOfSport: [{ source: 'MASTER', id: 'sport-1' }],
      representedOrganization: [{ source: 'MASTER', id: 'org-1' }],
      organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
      levelRepresented: [{ source: 'MASTER', id: 'lvl-1' }],
      positionRoleHeld: 'Captain',
      startDate: '2019-01-01',
      endDate: '2020-01-01',
    });
  });
});

describe('toCreateVacancyPayload — volunteering', () => {
  it('returns a default empty group when preferredVolunteering is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.volunteering).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredVolunteering: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          volunteering: [],
        },
      })
    );

    expect(payload.data.volunteering).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('maps full volunteering entry content', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredVolunteering: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          volunteering: [
            {
              id: 'v1',
              isOpen: false,
              organizationName: [
                { value: 'org-1', label: 'Org', source: 'MASTER' },
              ],
              organizationLocations: [{ value: 'loc-1', label: 'Loc' }],
              cause: [{ value: 'cause-1', label: 'Cause', source: 'MASTER' }],
              causeSearch: '',
              position: 'Volunteer',
              startDate: '2018-01-01',
              endDate: '2019-01-01',
            },
          ],
        },
      })
    );

    expect(payload.data.volunteering[0].content[0]).toEqual({
      organization: [{ source: 'MASTER', id: 'org-1' }],
      organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
      positionRole: 'Volunteer',
      cause: [{ source: 'MASTER', id: 'cause-1' }],
      startDate: '2018-01-01',
      endDate: '2019-01-01',
    });
  });
});

describe('toCreateVacancyPayload — preferred languages', () => {
  it('returns a default empty payload when preferredLanguages is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.languages).toEqual({
      isEnabled: false,
      dataTakenFromCandidate: false,
      content: [],
    });
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredLanguages: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          languages: [{ id: 'lang-1', label: 'English', source: 'MASTER' }],
        },
      })
    );

    expect(payload.data.languages).toEqual({
      isEnabled: true,
      dataTakenFromCandidate: true,
      content: [],
    });
  });

  it('maps languages content and defaults missing source to MASTER', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredLanguages: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          languages: [
            { id: 'lang-1', label: 'English', source: 'MASTER' },
            { id: 'lang-2', label: 'French' },
          ],
        },
      })
    );

    expect(payload.data.languages.content).toEqual([
      { source: 'MASTER', id: 'lang-1' },
      { source: 'MASTER', id: 'lang-2' },
    ]);
  });
});

describe('toCreateVacancyPayload — preferred causes', () => {
  it('returns a default empty group when preferredCauses is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.causes).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredCauses: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          causes: [{ id: 'cause-1', label: 'Environment', source: 'MASTER' }],
        },
      })
    );

    expect(payload.data.causes).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('maps causes content and defaults missing source to MASTER', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredCauses: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          causes: [{ id: 'cause-1', label: 'Environment' }],
        },
      })
    );

    expect(payload.data.causes[0].content).toEqual([
      { source: 'MASTER', id: 'cause-1' },
    ]);
  });
});

describe('toCreateVacancyPayload — preferred hobbies', () => {
  it('returns a default empty group when preferredHobbies is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.hobbyList).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredHobbies: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          hobbies: [{ id: 'hobby-1', label: 'Reading', source: 'MASTER' }],
        },
      })
    );

    expect(payload.data.hobbyList).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('maps hobbies content and defaults missing source to MASTER', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredHobbies: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          hobbies: [{ id: 'hobby-1', label: 'Reading' }],
        },
      })
    );

    expect(payload.data.hobbyList[0].content).toEqual([
      { source: 'MASTER', id: 'hobby-1' },
    ]);
  });
});

describe('toCreateVacancyPayload — preferred industries', () => {
  it('returns a default empty payload when preferredIndustries is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.industry).toEqual({
      isEnabled: false,
      dataTakenFromCandidate: false,
      content: [],
    });
  });

  it('clears content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredIndustries: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          industries: [{ id: 'ind-1', label: 'Tech', source: 'MASTER' }],
        },
      })
    );

    expect(payload.data.industry).toEqual({
      isEnabled: true,
      dataTakenFromCandidate: true,
      content: [],
    });
  });

  it('maps industries content and defaults missing source to MASTER', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        preferredIndustries: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          industries: [{ id: 'ind-1', label: 'Tech' }],
        },
      })
    );

    expect(payload.data.industry.content).toEqual([
      { source: 'MASTER', id: 'ind-1' },
    ]);
  });
});

describe('toCreateVacancyPayload — customized form', () => {
  it('clears the form when it is disabled', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.customizedForm).toEqual({
      isEnabled: false,
      sectionTitle: null,
      forms: [],
    });
  });

  it('falls back to null sectionTitle when blank', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        customizableForm: { isEnabled: true, sectionTitle: '', forms: [] },
      })
    );

    expect(payload.data.customizedForm).toEqual({
      isEnabled: true,
      sectionTitle: null,
      forms: [],
    });
  });

  it('maps forms/questions and drops blank options, keeps linear scale, and omits both for plain questions', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        customizableForm: {
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [
            {
              id: 1,
              title: 'Form1',
              questions: [
                {
                  id: 1,
                  text: 'Pick one',
                  type: 'MULTIPLE_CHOICE',
                  required: true,
                  options: [
                    { id: 1, value: 'Option A' },
                    { id: 2, value: '   ' },
                  ],
                  from: 0,
                  to: 0,
                  startLabel: '',
                  endLabel: '',
                },
                {
                  id: 2,
                  text: 'Rate',
                  type: 'LINEAR_SCALE',
                  required: false,
                  options: [],
                  from: 1,
                  to: 5,
                  startLabel: 'Low',
                  endLabel: 'High',
                },
                {
                  id: 3,
                  text: 'Describe',
                  type: 'SHORT_ANSWER',
                  required: false,
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
      })
    );

    const forms = payload.data.customizedForm.forms;
    expect(forms).toHaveLength(1);
    expect(forms[0].title).toBe('Form1');
    expect(forms[0].displayOrder).toBe(1);

    const [choiceQ, scaleQ, plainQ] = forms[0].questions;

    expect(choiceQ).toEqual({
      questionText: 'Pick one',
      questionType: 'MULTIPLE_CHOICE',
      required: true,
      displayOrder: 1,
      options: [{ value: 'Option A', displayOrder: 1 }],
    });

    expect(scaleQ).toEqual({
      questionText: 'Rate',
      questionType: 'LINEAR_SCALE',
      required: false,
      displayOrder: 2,
      linearScale: {
        startValue: 1,
        endValue: 5,
        startLabel: 'Low',
        endLabel: 'High',
      },
    });

    expect(plainQ).toEqual({
      questionText: 'Describe',
      questionType: 'SHORT_ANSWER',
      required: false,
      displayOrder: 3,
    });
  });
});

describe('toCreateVacancyPayload — licenses additional branches', () => {
  it('returns a default empty group when licenseCertificates is absent', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.data.licensesAndCertifications).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('normalizes a PENDING source for a non-temporary license id', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                nameOfLicenseCert: [
                  { source: 'PENDING', id: 'license-real-id', type: 'LICENSE' },
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
      })
    );

    expect(
      payload.data.licensesAndCertifications[0].content[0].nameOfLicenseCert[0]
    ).toEqual({ source: 'PENDING', id: 'license-real-id', type: 'LICENSE' });
  });

  it('filters out issuing organization and location refs missing source or id', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                nameOfLicenseCert: [],
                issuingOrganization: [
                  { source: '', id: 'org-1' },
                  { source: 'MASTER', id: '' },
                ],
                organizationLocations: [
                  { source: '', id: 'loc-1' },
                  { source: 'MASTER', id: '' },
                ],
                internationallyAccepted: false,
                issueDate: '',
                expirationDate: '',
              },
            ],
          },
        ],
      })
    );

    const content = payload.data.licensesAndCertifications[0].content[0];
    expect(content.issuingOrganization).toEqual([]);
    expect(content.organizationLocations).toEqual([]);
  });
});

describe('toCreateVacancyPayload — secondary/tertiary education dataTakenFromCandidate', () => {
  it('clears secondary education content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        secondaryEducation: [
          { isEnabled: true, dataTakenFromCandidate: true, content: [] },
        ],
      })
    );

    expect(payload.data.secondaryEducation).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('clears tertiary education content when dataTakenFromCandidate is true', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm({
        tertiaryEducation: [
          { isEnabled: true, dataTakenFromCandidate: true, content: [] },
        ],
      })
    );

    expect(payload.data.tertiaryEducation).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });
});

describe('toCreateVacancyPayload — templateId', () => {
  it('includes templateId in the payload when provided', () => {
    const payload = toCreateVacancyPayload(
      buildBaseForm(),
      'UNPUBLISHED',
      'template-123'
    );

    expect(payload.templateId).toBe('template-123');
  });

  it('omits templateId when not provided', () => {
    const payload = toCreateVacancyPayload(buildBaseForm());

    expect(payload.templateId).toBeUndefined();
  });
});

describe('toUpdateVacancyPayload', () => {
  it.each([
    ['draft', 'DRAFT'],
    ['unpublished', 'UNPUBLISHED'],
    ['live', 'LIVE'],
    ['expired', 'EXPIRED'],
    ['on_hold', 'ONHOLD'],
  ])('maps existing status "%s" to API status "%s"', (formStatus, apiStatus) => {
    const payload = toUpdateVacancyPayload(buildBaseForm(), formStatus);

    expect(payload.status).toBe(apiStatus);
  });

  it('is case-insensitive and trims whitespace', () => {
    const payload = toUpdateVacancyPayload(buildBaseForm(), '  Live  ');

    expect(payload.status).toBe('LIVE');
  });

  it('falls back to UNPUBLISHED for an unrecognized status', () => {
    const payload = toUpdateVacancyPayload(buildBaseForm(), 'some-unknown');

    expect(payload.status).toBe('UNPUBLISHED');
  });
});
