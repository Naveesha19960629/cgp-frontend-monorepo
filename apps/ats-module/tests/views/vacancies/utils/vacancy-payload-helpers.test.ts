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

  it('keeps license content when dataTakenFromCandidate is true', () => {
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
      {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: [
          {
            nameOfLicenseCert: [
              {
                source: 'MASTER',
                id: 'license-2',
                type: 'CERTIFICATE',
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
