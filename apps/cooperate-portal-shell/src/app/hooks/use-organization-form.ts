import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { z } from 'zod';

import { isUrlFormatValid, isUrlProtocolValid } from '../utils/form-helper';

function createOrganizationFormSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(1, t('licensesAndCertificate.validation.organisationNameRequired'))
      .max(
        200,
        t('licensesAndCertificate.validation.organisationNameMaxLength')
      ),
    location: z
      .object({
        id: z.string(),
        label: z.string(),
      })
      .refine(loc => loc.id.length > 0, {
        message: t(
          'licensesAndCertificate.validation.organisationLocationRequired'
        ),
      }),
    organizationWebSite: z
      .string()
      .min(2)
      .max(200, t('licensesAndCertificate.validation.organisationUrlMaxLength'))
      .refine(
        val => isUrlProtocolValid(val),
        t('licensesAndCertificate.validation.organisationUrlInvalidProtocol')
      )
      .refine(
        val => isUrlFormatValid(val),
        t('licensesAndCertificate.validation.organisationUrlInvalidFormat')
      )
      .optional()
      .or(z.literal('')),
  });
}

export type OrganizationFormSchema = z.infer<
  ReturnType<typeof createOrganizationFormSchema>
>;

export function useOrganizationForm(
  onSuccess?: (data: OrganizationFormSchema) => void
) {
  const { t } = useTranslation();
  const organizationFormSchema = createOrganizationFormSchema(t);

  const form = useForm<OrganizationFormSchema>({
    resolver: zodResolver(organizationFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      location: { id: '', label: '' },
      organizationWebSite: '',
    },
  });

  const { handleSubmit, reset } = form;
  const onSubmit = handleSubmit((data: OrganizationFormSchema) => {
    onSuccess?.(data);
    reset();
  });

  return {
    form,
    onSubmit,
  };
}
