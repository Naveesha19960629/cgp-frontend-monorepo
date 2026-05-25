import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';

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
  relatedIndustries: z.array(patentIndustrySchema).default([]),
  statuses: z.array(patentStatusSchema).default([]),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  isOpen: z.boolean().default(true),
});

const preferredPatentsSchema = z.object({
  isEnabled: z.boolean().default(true),
  dataTakenFromCandidate: z.boolean().default(false),
  patents: z.array(patentEntrySchema).default([
    {
      relatedIndustries: [],
      statuses: [],
      fromDate: undefined,
      toDate: undefined,
      isOpen: true,
    },
  ]),
});

type PreferredPatentsFormValues = z.infer<typeof preferredPatentsSchema>;

const usePreferredPatentsForm = () =>
  useForm<PreferredPatentsFormValues>({
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

export { usePreferredPatentsForm };
export type { PreferredPatentsFormValues };
