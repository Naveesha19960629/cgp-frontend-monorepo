import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';

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

const usePreferredPatentsForm = () =>
  useForm<PreferredPatentsFormValues>({
    resolver: zodResolver(
      preferredPatentsSchema
    ) as Resolver<PreferredPatentsFormValues>,
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
