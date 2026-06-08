import type { LicenseCertificatesFormValues } from '@/views/vacancies/hooks/use-license-certificates-form';
import type {
  LicenseCertEntry,
  LicenseCertRef,
  LicenseCertType,
  LicenseCertificates,
} from '@/views/vacancies/types';

const toLicenseCertificatesPayload = (
  values: LicenseCertificatesFormValues
): LicenseCertificates[] => {
  if (!values.isEnabled) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (values.dataTakenFromCandidate) {
    return [{ isEnabled: true, dataTakenFromCandidate: true, content: [] }];
  }

  const { entry } = values;

  const toRef = (item: {
    value?: string;
    label: string;
    source: string;
    certType?: string;
  }): LicenseCertRef | null => {
    if (!item.value || item.value === item.label) return null;
    return {
      source: item.source as 'MASTER' | 'PENDING',
      id: item.value,
      name: item.label,
      type: item.certType as LicenseCertType | undefined,
    };
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
      issueDate: entry.issueDate ?? '',
      expirationDate: entry.expirationDate ?? '',
    },
  ];

  return [
    {
      isEnabled: true,
      dataTakenFromCandidate: false,
      content,
    },
  ];
};

export { toLicenseCertificatesPayload };
