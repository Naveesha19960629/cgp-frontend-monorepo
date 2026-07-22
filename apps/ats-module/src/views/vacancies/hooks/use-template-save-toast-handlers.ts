import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { TEMPLATES_LIST_ROUTE } from '@/views/vacancies/utils/constants';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';

type TemplateSaveNamespace = 'createTemplate' | 'editTemplate';

/**
 * Shared `onSuccess`/`onError` mutation options for the create/edit template
 * pages: same toast copy keys and post-save redirect, only the i18n namespace
 * (`createTemplate` vs `editTemplate`) differs.
 */
export const useTemplateSaveToastHandlers = (
  namespace: TemplateSaveNamespace
) => {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();

  return {
    onSuccess: () => {
      SuccessToast({
        title: t(`${namespace}.notifications.success.title`),
        description: t(`${namespace}.notifications.success.message`),
      });
      navigate(TEMPLATES_LIST_ROUTE);
    },
    onError: () => {
      ErrorToast({
        title: t(`${namespace}.notifications.error.title`),
        description: t(`${namespace}.notifications.error.message`),
      });
    },
  };
};
