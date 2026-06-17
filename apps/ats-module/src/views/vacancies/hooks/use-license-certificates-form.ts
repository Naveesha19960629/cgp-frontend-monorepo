import { zodResolver } from '@hookform/resolvers/zod';

import { useEffect } from 'react';
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
  initialData?: LicenseCertificates[] | Record<string, unknown>
): LicenseCertificatesFormValues {
  let normalizedInitialData: LicenseCertificates[] = [];

  if (Array.isArray(initialData)) {
    normalizedInitialData = initialData;
  } else if (typeof initialData === 'object' && initialData !== null) {
    let content: LicenseCertificates['content'] = [];

    if (Array.isArray(initialData.content)) {
      content = initialData.content as LicenseCertificates['content'];
    } else if (Array.isArray(initialData.licenseCertificates)) {
      content =
        initialData.licenseCertificates as LicenseCertificates['content'];
    } else if (Array.isArray(initialData.licensesAndCertifications)) {
      content =
        initialData.licensesAndCertifications as LicenseCertificates['content'];
    }

    normalizedInitialData = [
      {
        isEnabled: Boolean(initialData.isEnabled),
        dataTakenFromCandidate: Boolean(initialData.dataTakenFromCandidate),
        content,
      },
    ];
  }

  if (!normalizedInitialData.length) {
    return {
      isEnabled: false,
      dataTakenFromCandidate: false,
      entry: DEFAULT_ENTRY,
    };
  }

  const getRefLabel = (ref: { id: string; name?: string }): string => {
    if (typeof ref.name === 'string' && ref.name.trim().length > 0) {
      return ref.name;
    }

    const candidate = ref as { label?: unknown };
    if (
      typeof candidate.label === 'string' &&
      candidate.label.trim().length > 0
    ) {
      return candidate.label;
    }

    return ref.id;
  };

  const first = normalizedInitialData[0];
  const firstEntry = first.content[0];

  return {
    isEnabled: first.isEnabled,
    dataTakenFromCandidate: first.dataTakenFromCandidate,
    entry: firstEntry
      ? {
          nameOfLicenseCert: firstEntry.nameOfLicenseCert.map(r => ({
            value: r.id,
            label: getRefLabel(r),
            source: r.source,
            certType: r.type,
          })),
          issuingOrganization: firstEntry.issuingOrganization[0]
            ? {
                value: firstEntry.issuingOrganization[0].id,
                label: getRefLabel(firstEntry.issuingOrganization[0]),
                source: firstEntry.issuingOrganization[0].source,
              }
            : undefined,
          organizationLocations: firstEntry.organizationLocations.map(r => ({
            value: r.id,
            label: getRefLabel(r),
          })),
          internationallyAccepted: firstEntry.internationallyAccepted,
          issueDate: firstEntry.issueDate || undefined,
          expirationDate: firstEntry.expirationDate || undefined,
        }
      : DEFAULT_ENTRY,
  };
}

const useLicenseCertificatesForm = (
  initialData?: LicenseCertificates[] | Record<string, unknown>
): UseFormReturn<LicenseCertificatesFormValues> => {
  const form = useForm<LicenseCertificatesFormValues>({
    resolver: zodResolver(licenseCertificatesFormSchema),
    defaultValues: buildDefaultValues(initialData),
  });

  const { reset } = form;

  useEffect(() => {
    reset(buildDefaultValues(initialData));
  }, [initialData, reset]);

  return form;
};

export type { LicenseCertificatesFormValues };
export { useLicenseCertificatesForm };
