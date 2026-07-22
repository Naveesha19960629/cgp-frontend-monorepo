import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';

function VacancyHobbiesSection({
  preferredHobbies,
}: Readonly<{
  preferredHobbies: VacancyViewModel['preferredHobbies'];
}>) {
  const { t } = useTranslation('ats');

  if (!preferredHobbies?.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section title={t('preferredHobbies.title')}>
      {preferredHobbies.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : (
        <VacancyView.Tags values={preferredHobbies.content} />
      )}
    </VacancyView.Section>
  );
}

export { VacancyHobbiesSection };
