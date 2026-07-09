import { useTranslation } from 'react-i18next';

import TemplateEmptyStateMessage from '@/views/vacancies/components/template-empty-state-message';

/** Empty state shown on the Templates page when a search returns no results. */
export default function TemplateSearchEmptyState() {
  const { t } = useTranslation('ats');

  return (
    <TemplateEmptyStateMessage
      title={t('templates.searchEmptyState.title')}
      description={`${t('templates.searchEmptyState.descriptionLine1')} ${t('templates.searchEmptyState.descriptionLine2')}`}
    />
  );
}
