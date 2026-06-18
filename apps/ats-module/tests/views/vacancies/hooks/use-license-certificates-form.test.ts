import { act, renderHook } from '@testing-library/react';

import { useLicenseCertificatesForm } from '@/views/vacancies/hooks/use-license-certificates-form';

describe('useLicenseCertificatesForm — no initial data', () => {
  it('returns isEnabled=false with empty entry', () => {
    const { result } = renderHook(() => useLicenseCertificatesForm());

    const values = result.current.getValues();
    expect(values.isEnabled).toBe(false);
    expect(values.dataTakenFromCandidate).toBe(false);
    expect(values.entry.nameOfLicenseCert).toEqual([]);
    expect(values.entry.issuingOrganization).toBeUndefined();
    expect(values.entry.organizationLocations).toEqual([]);
    expect(values.entry.internationallyAccepted).toBe(false);
    expect(values.entry.issueDate).toBeUndefined();
    expect(values.entry.expirationDate).toBeUndefined();
  });
});

describe('useLicenseCertificatesForm — restoring from saved data', () => {
  it('does not reset form values when rerendered with equivalent initial data', () => {
    const initialData = {
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
    };

    const { result, rerender } = renderHook(
      ({ data }) => useLicenseCertificatesForm(data),
      { initialProps: { data: initialData } }
    );

    act(() => {
      result.current.setValue('entry.issueDate', '2025-05-10');
    });

    rerender({ data: { ...initialData } });

    expect(result.current.getValues().entry.issueDate).toBe('2025-05-10');
  });

  it('maps isEnabled and dataTakenFromCandidate from first record', () => {
    const { result } = renderHook(() =>
      useLicenseCertificatesForm([
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [],
        },
      ])
    );

    const values = result.current.getValues();
    expect(values.isEnabled).toBe(true);
    expect(values.dataTakenFromCandidate).toBe(false);
  });

  it("maps the first content entry's nameOfLicenseCert preserving label", () => {
    const { result } = renderHook(() =>
      useLicenseCertificatesForm([
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              nameOfLicenseCert: [
                { id: 'lc-uuid', source: 'MASTER', name: 'AWS Developer' },
              ],
              issuingOrganization: [],
              organizationLocations: [],
              internationallyAccepted: false,
              issueDate: '',
              expirationDate: '',
            },
          ],
        },
      ])
    );

    const values = result.current.getValues();
    expect(values.entry.nameOfLicenseCert).toEqual([
      {
        value: 'lc-uuid',
        label: 'AWS Developer',
        source: 'MASTER',
        certType: undefined,
      },
    ]);
  });

  it('maps the first issuingOrganization to a single object', () => {
    const { result } = renderHook(() =>
      useLicenseCertificatesForm([
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              nameOfLicenseCert: [],
              issuingOrganization: [
                { id: 'org-uuid', source: 'MASTER', name: 'CompTIA' },
              ],
              organizationLocations: [],
              internationallyAccepted: false,
              issueDate: '',
              expirationDate: '',
            },
          ],
        },
      ])
    );

    const values = result.current.getValues();
    expect(values.entry.issuingOrganization).toEqual({
      value: 'org-uuid',
      label: 'CompTIA',
      source: 'MASTER',
    });
  });

  it('sets issuingOrganization to undefined when array is empty', () => {
    const { result } = renderHook(() =>
      useLicenseCertificatesForm([
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
      ])
    );

    const values = result.current.getValues();
    expect(values.entry.issuingOrganization).toBeUndefined();
  });

  it('maps organizationLocations to value/label pairs', () => {
    const { result } = renderHook(() =>
      useLicenseCertificatesForm([
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              nameOfLicenseCert: [],
              issuingOrganization: [],
              organizationLocations: [
                { id: 'loc-uuid', source: 'MASTER', name: 'Colombo' },
              ],
              internationallyAccepted: true,
              issueDate: '2023-01-01',
              expirationDate: '2026-01-01',
            },
          ],
        },
      ])
    );

    const values = result.current.getValues();
    expect(values.entry.organizationLocations).toEqual([
      { value: 'loc-uuid', label: 'Colombo' },
    ]);
    expect(values.entry.internationallyAccepted).toBe(true);
    expect(values.entry.issueDate).toBe('2023-01-01');
    expect(values.entry.expirationDate).toBe('2026-01-01');
  });

  it('falls back to DEFAULT_ENTRY when content array is empty', () => {
    const { result } = renderHook(() =>
      useLicenseCertificatesForm([
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [],
        },
      ])
    );

    const values = result.current.getValues();
    expect(values.entry.nameOfLicenseCert).toEqual([]);
    expect(values.entry.issuingOrganization).toBeUndefined();
    expect(values.entry.organizationLocations).toEqual([]);
  });

  it('accepts API object shape with licensesAndCertifications key', () => {
    const { result } = renderHook(() =>
      useLicenseCertificatesForm({
        isEnabled: true,
        dataTakenFromCandidate: false,
        licensesAndCertifications: [
          {
            nameOfLicenseCert: [
              { id: 'lc-obj-1', source: 'MASTER', label: 'PMP' },
            ],
            issuingOrganization: [
              { id: 'org-obj-1', source: 'MASTER', label: 'PMI' },
            ],
            organizationLocations: [
              { id: 'loc-obj-1', source: 'MASTER', label: 'Colombo' },
            ],
            internationallyAccepted: true,
            issueDate: '2024-01-01',
            expirationDate: '2027-01-01',
          },
        ],
      })
    );

    const values = result.current.getValues();
    expect(values.isEnabled).toBe(true);
    expect(values.entry.nameOfLicenseCert).toEqual([
      {
        value: 'lc-obj-1',
        label: 'PMP',
        source: 'MASTER',
        certType: undefined,
      },
    ]);
    expect(values.entry.issuingOrganization).toEqual({
      value: 'org-obj-1',
      label: 'PMI',
      source: 'MASTER',
    });
  });

  it('falls back to id when name and label are missing in API object shape', () => {
    const { result } = renderHook(() =>
      useLicenseCertificatesForm({
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            nameOfLicenseCert: [{ id: 'lc-id-only', source: 'MASTER' }],
            issuingOrganization: [{ id: 'org-id-only', source: 'MASTER' }],
            organizationLocations: [{ id: 'loc-id-only', source: 'MASTER' }],
            internationallyAccepted: false,
            issueDate: '',
            expirationDate: '',
          },
        ],
      })
    );

    const values = result.current.getValues();
    expect(values.entry.nameOfLicenseCert[0]).toMatchObject({
      value: 'lc-id-only',
      label: 'lc-id-only',
    });
    expect(values.entry.issuingOrganization).toMatchObject({
      value: 'org-id-only',
      label: 'org-id-only',
    });
    expect(values.entry.organizationLocations[0]).toMatchObject({
      value: 'loc-id-only',
      label: 'loc-id-only',
    });
  });
});
