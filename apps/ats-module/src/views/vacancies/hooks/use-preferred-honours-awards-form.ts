import { zodResolver } from '@hookform/resolvers/zod';

import { useFieldArray, useForm } from 'react-hook-form';

import { z } from 'zod';

import type { preferredHonoursAwardsSchema } from '@/views/vacancies/types';

const honourOrganizationSchema = z.object({
  value: z.string(),
  label: z.string(),
  source: z.string(),
});

const honourLocationSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const honourEntrySchema = z.object({
  title: z.string().max(250),
  issuedBy: z.string().max(100),
  issuedDateFrom: z.date().optional(),
  issuedDateTo: z.date().optional(),
  associatedOrganizations: z.array(honourOrganizationSchema),
  organizationLocations: z.array(honourLocationSchema),
  isOpen: z.boolean(),
});

const preferredHonoursAwardsFormSchema = z.object({
  isEnabled: z.boolean(),
  dataTakenFromCandidate: z.boolean(),
  honoursAndAwards: z.array(honourEntrySchema),
});

type PreferredHonoursAwardsFormValues = z.infer<
  typeof preferredHonoursAwardsFormSchema
>;

const DEFAULT_HONOUR_ENTRY = {
  title: '',
  issuedBy: '',
  issuedDateFrom: undefined as Date | undefined,
  issuedDateTo: undefined as Date | undefined,
  associatedOrganizations: [] as never[],
  organizationLocations: [] as never[],
  isOpen: true,
};

const usePreferredHonoursAwardsForm = (
  initialValues?: preferredHonoursAwardsSchema
) => {
  const form = useForm<PreferredHonoursAwardsFormValues>({
    resolver: zodResolver(preferredHonoursAwardsFormSchema),
    defaultValues: {
      isEnabled: initialValues?.isEnabled ?? false,
      dataTakenFromCandidate: initialValues?.dataTakenFromCandidate ?? false,
      honoursAndAwards:
        initialValues?.honoursAndAwards &&
        initialValues.honoursAndAwards.length > 0
          ? initialValues.honoursAndAwards
          : [{ ...DEFAULT_HONOUR_ENTRY }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'honoursAndAwards',
  });

  return { form, fields, append, remove, replace };
};

export { usePreferredHonoursAwardsForm };
