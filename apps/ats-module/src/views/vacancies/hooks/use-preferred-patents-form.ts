import { zodResolver } from '@hookform/resolvers/zod';

import { useFieldArray, useForm } from 'react-hook-form';

import { z } from 'zod';

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

export function usePreferredPatentsForm() {
  const form = useForm<PreferredPatentsFormValues>({
    resolver: zodResolver(preferredPatentsSchema),
    defaultValues: {
      isEnabled: false,
      dataTakenFromCandidate: false,
      patents: [
        {
          relatedIndustries: [],
          statuses: [],
          fromDate: undefined,
          toDate: undefined,
          isOpen: true,
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'patents',
  });

  return { form, fields, append, remove, replace };
}
