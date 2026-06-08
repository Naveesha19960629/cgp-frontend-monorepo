import { zodResolver } from '@hookform/resolvers/zod';

import { useFieldArray, useForm } from 'react-hook-form';

import { z } from 'zod';

import type { ProfileRequirements } from '@/views/vacancies/types';

const selectOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const addressSchema = z.object({
  city: selectOptionSchema,
  stateProvince: selectOptionSchema,
  country: selectOptionSchema,
  postalCode: z.string().max(20),
  isOpen: z.boolean(),
});

const profileRequirementsSchema = z.object({
  isEnabled: z.boolean(),
  dataTakenFromCandidate: z.boolean(),
  gender: selectOptionSchema,
  maritalStatus: selectOptionSchema,
  addresses: z.array(addressSchema),
});

type ProfileRequirementsFormValues = z.infer<typeof profileRequirementsSchema>;

const DEFAULT_ADDRESS_ENTRY = {
  city: { id: '', label: '' },
  stateProvince: { id: '', label: '' },
  country: { id: '', label: '' },
  postalCode: '',
  isOpen: true,
};

const DEFAULT_SELECT_OPTION = { id: '', label: '' };

export function useProfileRequirementsForm(
  initialValues?: ProfileRequirements
) {
  const form = useForm<ProfileRequirementsFormValues>({
    resolver: zodResolver(profileRequirementsSchema),
    defaultValues: initialValues
      ? {
          ...initialValues,
          addresses:
            initialValues.addresses.length > 0
              ? initialValues.addresses
              : [{ ...DEFAULT_ADDRESS_ENTRY }],
        }
      : {
          isEnabled: false,
          dataTakenFromCandidate: false,
          gender: { ...DEFAULT_SELECT_OPTION },
          maritalStatus: { ...DEFAULT_SELECT_OPTION },
          addresses: [{ ...DEFAULT_ADDRESS_ENTRY }],
        },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'addresses',
  });

  return { form, fields, append, remove, replace };
}

export type { ProfileRequirementsFormValues };
