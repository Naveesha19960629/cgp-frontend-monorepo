import { useTranslation } from 'react-i18next';

import { SuccessToast } from '@cgp/ui-kit/components/custom-toast';

export const useDisableSuccessToast = () => {
  const { t } = useTranslation('ats');

  return (sectionName: string) => {
    SuccessToast({
      title: t('common.notifications.disable.title'),
      description: t('common.notifications.disable.message', {
        sectionName,
      }),
    });
  };
};
