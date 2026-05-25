import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { z } from 'zod';

const URL_PATTERN =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

function isUrlProtocolValid(url: string): boolean {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return url.startsWith('http://') || url.startsWith('https://');
  }
}

function isUrlFormatValid(url: string): boolean {
  if (!url) return true;
  return URL_PATTERN.test(url);
}

function createOrganizationFormSchema(
  t: (key: string, defaultValue?: string) => string
) {
  return z.object({
    name: z
      .string()
      .min(
        1,
        t(
          'ats:organization.validation.nameRequired',
          'Organization name is required'
        )
      )
      .max(
        200,
        t(
          'ats:organization.validation.nameMaxLength',
          'Organization name must be less than 200 characters'
        )
      ),
    location: z
      .object({
        id: z.string(),
        label: z.string(),
      })
      .refine((loc: { id: string; label: string }) => loc.id.length > 0, {
        message: t(
          'ats:organization.validation.locationRequired',
          'Location is required'
        ),
      }),
    organizationWebSite: z
      .string()
      .min(2)
      .max(
        200,
        t(
          'ats:organization.validation.urlMaxLength',
          'URL must be less than 200 characters'
        )
      )
      .refine(
        (val: string) => isUrlProtocolValid(val),
        t(
          'ats:organization.validation.urlInvalidProtocol',
          'Invalid URL protocol'
        )
      )
      .refine(
        (val: string) => isUrlFormatValid(val),
        t('ats:organization.validation.urlInvalidFormat', 'Invalid URL format')
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
  const organizationFormSchema = createOrganizationFormSchema(
    t as unknown as (key: string, defaultValue?: string) => string
  );

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
