import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';

function VacancyIndustriesSection({
  preferredIndustries,
}: {
  preferredIndustries?: VacancyViewModel['preferredIndustries'];
}) {
  const { t } = useTranslation('ats');

  if (!preferredIndustries || !preferredIndustries.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section title={t('preferredIndustries.title')}>
      {preferredIndustries.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : (
        <VacancyView.Tags values={preferredIndustries.content} />
      )}
    </VacancyView.Section>
  );
}

export { VacancyIndustriesSection };
