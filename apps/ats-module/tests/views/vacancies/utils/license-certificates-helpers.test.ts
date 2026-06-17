import { toLicenseCertificatesPayload } from '@/views/vacancies/utils/license-certificates-helpers';

// ── Shared constants ───────────────────────────────────────────────────────

const EMPTY_ENTRY = {
  nameOfLicenseCert: [] as never[],
  issuingOrganization: undefined,
  organizationLocations: [] as never[],
  internationallyAccepted: false,
  issueDate: undefined,
  expirationDate: undefined,
};

// ── Disabled / dataTakenFromCandidate ──────────────────────────────────────

describe('toLicenseCertificatesPayload — disabled', () => {
  it('returns disabled payload when isEnabled is false', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: false,
      dataTakenFromCandidate: false,
      entry: EMPTY_ENTRY,
    });

    expect(result).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('returns dataTakenFromCandidate payload when flag is true', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: true,
      entry: EMPTY_ENTRY,
    });

    expect(result).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });
});

// ── Enabled — empty entry ──────────────────────────────────────────────────

describe('toLicenseCertificatesPayload — enabled, empty entry', () => {
  it('produces a single content item with empty arrays when no fields are filled', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: EMPTY_ENTRY,
    });

    expect(result).toEqual([
      {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            nameOfLicenseCert: [],
            issuingOrganization: [],
            organizationLocations: [],
            internationallyAccepted: false,
            issueDate: '',
            expirationDate: '',
          },
        ],
      },
    ]);
  });
});

// ── nameOfLicenseCert ──────────────────────────────────────────────────────

describe('toLicenseCertificatesPayload — nameOfLicenseCert', () => {
  it('maps MASTER items to refs preserving id, name and source', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        nameOfLicenseCert: [
          {
            value: 'lc-uuid',
            label: 'AWS Certified Developer',
            source: 'MASTER',
            certType: 'CERTIFICATION',
          },
        ],
      },
    });

    expect(result[0].content[0].nameOfLicenseCert).toEqual([
      {
        source: 'MASTER',
        id: 'lc-uuid',
        name: 'AWS Certified Developer',
        type: 'CERTIFICATION',
      },
    ]);
  });

  it('maps PENDING items correctly', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        nameOfLicenseCert: [
          {
            value: 'pending-uuid',
            label: 'My Licence',
            source: 'PENDING',
            certType: 'LICENSE',
          },
        ],
      },
    });

    expect(result[0].content[0].nameOfLicenseCert[0].source).toBe('PENDING');
    expect(result[0].content[0].nameOfLicenseCert[0].id).toBe('pending-uuid');
  });
});

// ── issuingOrganization (single optional object) ───────────────────────────

describe('toLicenseCertificatesPayload — issuingOrganization', () => {
  it('wraps a single organization into an array of one ref', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        issuingOrganization: {
          value: 'org-uuid',
          label: 'CompTIA',
          source: 'MASTER',
        },
      },
    });

    expect(result[0].content[0].issuingOrganization).toEqual([
      { source: 'MASTER', id: 'org-uuid', name: 'CompTIA' },
    ]);
  });

  it('produces an empty array when issuingOrganization is undefined', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: { ...EMPTY_ENTRY, issuingOrganization: undefined },
    });

    expect(result[0].content[0].issuingOrganization).toEqual([]);
  });

  it('produces an empty array when issuingOrganization is null', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        issuingOrganization: null,
      },
    });

    expect(result[0].content[0].issuingOrganization).toEqual([]);
  });

  it('preserves USER_CREATED source for user-added organizations', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        issuingOrganization: {
          value: 'user-org-id',
          label: 'My Company',
          source: 'USER_CREATED',
        },
      },
    });

    expect(result[0].content[0].issuingOrganization[0].source).toBe(
      'USER_CREATED'
    );
  });
});

// ── organizationLocations ──────────────────────────────────────────────────

describe('toLicenseCertificatesPayload — organizationLocations', () => {
  it('maps location items to MASTER refs', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        organizationLocations: [{ value: 'loc-uuid', label: 'Colombo' }],
      },
    });

    expect(result[0].content[0].organizationLocations).toEqual([
      { source: 'MASTER', id: 'loc-uuid', name: 'Colombo' },
    ]);
  });
});

// ── dates ──────────────────────────────────────────────────────────────────

describe('toLicenseCertificatesPayload — dates', () => {
  it('carries issueDate and expirationDate through to the payload', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        issueDate: '2023-01-15',
        expirationDate: '2026-01-15',
      },
    });

    expect(result[0].content[0].issueDate).toBe('2023-01-15');
    expect(result[0].content[0].expirationDate).toBe('2026-01-15');
  });

  it('normalizes ISO datetime values to yyyy-MM-dd', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        issueDate: '2026-06-17T00:00:00.000Z',
        expirationDate: '2027-12-25T13:45:00.000Z',
      },
    });

    expect(result[0].content[0].issueDate).toBe('2026-06-17');
    expect(result[0].content[0].expirationDate).toBe('2027-12-25');
  });

  it('normalizes ISO datetime values with local offset to yyyy-MM-dd', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        issueDate: '2026-06-17T05:30:00+05:30',
        expirationDate: '2028-01-01T23:59:59+05:30',
      },
    });

    expect(result[0].content[0].issueDate).toBe('2026-06-17');
    expect(result[0].content[0].expirationDate).toBe('2028-01-01');
  });

  it('uses empty strings when dates are undefined', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        issueDate: undefined,
        expirationDate: undefined,
      },
    });

    expect(result[0].content[0].issueDate).toBe('');
    expect(result[0].content[0].expirationDate).toBe('');
  });
});

// ── internationallyAccepted ────────────────────────────────────────────────

describe('toLicenseCertificatesPayload — internationallyAccepted', () => {
  it('passes true when the flag is set', () => {
    const result = toLicenseCertificatesPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: { ...EMPTY_ENTRY, internationallyAccepted: true },
    });

    expect(result[0].content[0].internationallyAccepted).toBe(true);
  });
});
