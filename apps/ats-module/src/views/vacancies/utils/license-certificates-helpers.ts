import type { LicenseCertificatesFormValues } from '@/views/vacancies/hooks/use-license-certificates-form';
import type {
  LicenseCertEntry,
  LicenseCertRef,
  LicenseCertificates,
} from '@/views/vacancies/types';

function normalizeToDateOnly(value?: string): string {
  if (!value) return '';
  const [datePart] = value.split('T');
  return datePart ?? '';
}

function normalizeLicenseSource(source?: string): 'MASTER' | 'PENDING' {
  if (source === 'PENDING' || source === 'PENDING_TEMP') {
    return 'PENDING';
  }

  return 'MASTER';
}

function isTemporaryLicenseId(id: string): boolean {
  return id.startsWith('__pending_license_cert_');
}

const toLicenseCertificatesPayload = (
  values: LicenseCertificatesFormValues
): LicenseCertificates[] => {
  if (!values.isEnabled) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  const { entry } = values;

  const toRef = (item: {
    value?: string;
    label: string;
    source: string;
    certType?: string;
  }): LicenseCertRef | null => {
    if (
      !item.value ||
      item.value === item.label ||
      isTemporaryLicenseId(item.value)
    ) {
      return null;
    }
    const ref: LicenseCertRef = {
      source: normalizeLicenseSource(item.source),
      id: item.value,
      name: item.label,
      type:
        item.certType === 'LICENSE' ||
        item.certType === 'CERTIFICATION' ||
        item.certType === 'CERTIFICATE'
          ? item.certType
          : 'CERTIFICATE',
    };
    return ref;
  };

  const toRefs = (
    items: {
      value?: string;
      label: string;
      source: string;
      certType?: string;
    }[]
  ): LicenseCertRef[] =>
    items.flatMap(i => {
      const ref = toRef(i);
      return ref ? [ref] : [];
    });

  const toLocationRef = (item: {
    value: string;
    label: string;
  }): LicenseCertRef => ({
    source: 'MASTER',
    id: item.value,
    name: item.label,
  });

  const toOrgRef = (item: {
    value: string;
    label: string;
    source: string;
  }): LicenseCertRef => ({
    source: item.source as 'MASTER' | 'PENDING',
    id: item.value,
    name: item.label,
  });

  const content: LicenseCertEntry[] = [
    {
      nameOfLicenseCert: toRefs(entry.nameOfLicenseCert),
      issuingOrganization: entry.issuingOrganization
        ? [toOrgRef(entry.issuingOrganization)]
        : [],
      organizationLocations: entry.organizationLocations.map(toLocationRef),
      internationallyAccepted: entry.internationallyAccepted,
      issueDate: normalizeToDateOnly(entry.issueDate),
      expirationDate: normalizeToDateOnly(entry.expirationDate),
    },
  ];

  return [
    {
      isEnabled: true,
      dataTakenFromCandidate: values.dataTakenFromCandidate,
      content,
    },
  ];
};

export { toLicenseCertificatesPayload };
