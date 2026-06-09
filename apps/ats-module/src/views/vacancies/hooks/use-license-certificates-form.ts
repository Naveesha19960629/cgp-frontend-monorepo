import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { z } from 'zod';

import type { LicenseCertificates } from '@/views/vacancies/types';

const selectionItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  source: z.string(),
  certType: z.string().optional(),
});

const locationItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const orgItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  source: z.string(),
});

const licenseCertEntrySchema = z.object({
  nameOfLicenseCert: z.array(selectionItemSchema).max(10),
  issuingOrganization: orgItemSchema.nullable().optional(),
  organizationLocations: z.array(locationItemSchema).max(10),
  internationallyAccepted: z.boolean(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
});

const licenseCertificatesFormSchema = z.object({
  isEnabled: z.boolean(),
  dataTakenFromCandidate: z.boolean(),
  entry: licenseCertEntrySchema,
});

type LicenseCertificatesFormValues = z.infer<
  typeof licenseCertificatesFormSchema
>;

const DEFAULT_ENTRY: z.infer<typeof licenseCertEntrySchema> = {
  nameOfLicenseCert: [],
  issuingOrganization: undefined,
  organizationLocations: [],
  internationallyAccepted: false,
  issueDate: undefined,
  expirationDate: undefined,
};

function buildDefaultValues(
  initialData?: LicenseCertificates[]
): LicenseCertificatesFormValues {
  if (!initialData?.length) {
    return {
      isEnabled: false,
      dataTakenFromCandidate: false,
      entry: DEFAULT_ENTRY,
    };
  }

  const first = initialData[0];
  const firstEntry = first.content[0];

  return {
    isEnabled: first.isEnabled,
    dataTakenFromCandidate: first.dataTakenFromCandidate,
    entry: firstEntry
      ? {
          nameOfLicenseCert: firstEntry.nameOfLicenseCert.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
            certType: r.type,
          })),
          issuingOrganization: firstEntry.issuingOrganization[0]
            ? {
                value: firstEntry.issuingOrganization[0].id,
                label:
                  firstEntry.issuingOrganization[0].name ??
                  firstEntry.issuingOrganization[0].id,
                source: firstEntry.issuingOrganization[0].source,
              }
            : undefined,
          organizationLocations: firstEntry.organizationLocations.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
          })),
          internationallyAccepted: firstEntry.internationallyAccepted,
          issueDate: firstEntry.issueDate || undefined,
          expirationDate: firstEntry.expirationDate || undefined,
        }
      : DEFAULT_ENTRY,
  };
}

const useLicenseCertificatesForm = (
  initialData?: LicenseCertificates[]
): UseFormReturn<LicenseCertificatesFormValues> => {
  return useForm<LicenseCertificatesFormValues>({
    resolver: zodResolver(licenseCertificatesFormSchema),
    defaultValues: buildDefaultValues(initialData),
  });
};

export type { LicenseCertificatesFormValues };
export { useLicenseCertificatesForm };
