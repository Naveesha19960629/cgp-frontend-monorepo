import { useTranslation } from 'react-i18next';

import TemplateEmptyStateMessage from '@/views/vacancies/components/template-empty-state-message';

/** Empty state shown on the Templates page when no templates exist. */
export default function TemplateEmptyState() {
  const { t } = useTranslation('ats');

  return (
    <TemplateEmptyStateMessage
      title={t('templates.emptyState.title')}
      description={t('templates.emptyState.description')}
    />
  );
}
