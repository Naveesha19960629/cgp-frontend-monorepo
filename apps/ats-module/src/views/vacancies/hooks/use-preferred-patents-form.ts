import { zodResolver } from '@hookform/resolvers/zod';

import { useFieldArray, useForm } from 'react-hook-form';

import { z } from 'zod';

import type { PreferredPatentsSchema as PreferredPatentsContext } from '@/views/vacancies/types';

const patentIndustrySchema = z.object({
  value: z.string(),
  label: z.string(),
  source: z.string(),
});

const patentStatusSchema = z.object({
  value: z.enum(['PATENT_PENDING', 'PATENT_ISSUED']),
  label: z.string(),
});

const patentEntrySchema = z.object({
  relatedIndustries: z.array(patentIndustrySchema),
  statuses: z.array(patentStatusSchema),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  isOpen: z.boolean(),
});

const preferredPatentsSchema = z.object({
  isEnabled: z.boolean(),
  dataTakenFromCandidate: z.boolean(),
  patents: z.array(patentEntrySchema),
});

type PreferredPatentsFormValues = z.infer<typeof preferredPatentsSchema>;

const DEFAULT_PATENT_ENTRY = {
  relatedIndustries: [] as never[],
  statuses: [] as never[],
  fromDate: undefined as Date | undefined,
  toDate: undefined as Date | undefined,
  isOpen: true,
};

export function usePreferredPatentsForm(
  initialValues?: PreferredPatentsContext
) {
  const form = useForm<PreferredPatentsFormValues>({
    resolver: zodResolver(preferredPatentsSchema),
    defaultValues: initialValues
      ? {
          ...initialValues,
          patents:
            initialValues.patents.length > 0
              ? initialValues.patents
              : [{ ...DEFAULT_PATENT_ENTRY }],
        }
      : {
          isEnabled: false,
          dataTakenFromCandidate: false,
          patents: [{ ...DEFAULT_PATENT_ENTRY }],
        },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'patents',
  });

  return { form, fields, append, remove, replace };
}
