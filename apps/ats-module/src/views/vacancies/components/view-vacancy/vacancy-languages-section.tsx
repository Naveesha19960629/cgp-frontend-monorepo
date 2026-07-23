import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';

function VacancyLanguagesSection({
  preferredLanguages,
}: Readonly<{
  preferredLanguages: VacancyViewModel['preferredLanguages'];
}>) {
  const { t } = useTranslation('ats');

  if (!preferredLanguages?.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section title={t('preferredLanguages.title')}>
      {preferredLanguages.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : (
        <VacancyView.Tags values={preferredLanguages.content} />
      )}
    </VacancyView.Section>
  );
}

export { VacancyLanguagesSection };
