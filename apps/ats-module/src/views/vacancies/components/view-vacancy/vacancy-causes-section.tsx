import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';

function VacancyCausesSection({
  preferredCauses,
}: Readonly<{
  preferredCauses: VacancyViewModel['preferredCauses'];
}>) {
  const { t } = useTranslation('ats');

  if (!preferredCauses?.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section title={t('preferredCauses.title')}>
      {preferredCauses.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : (
        <VacancyView.Tags values={preferredCauses.content} />
      )}
    </VacancyView.Section>
  );
}

export { VacancyCausesSection };
