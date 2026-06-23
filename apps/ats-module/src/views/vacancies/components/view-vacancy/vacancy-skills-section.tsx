import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';

function VacancySkillsSection({
  preferredSkills,
}: {
  preferredSkills?: VacancyViewModel['preferredSkills'];
}) {
  const { t } = useTranslation('ats');

  if (!preferredSkills || !preferredSkills.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section title={t('preferredSkills.title')}>
      {preferredSkills.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : (
        <VacancyView.Tags values={preferredSkills.content} />
      )}
    </VacancyView.Section>
  );
}

export { VacancySkillsSection };
