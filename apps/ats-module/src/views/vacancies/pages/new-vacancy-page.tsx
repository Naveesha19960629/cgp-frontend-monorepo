import { useTranslation } from 'react-i18next';

export default function NewVacancyPage() {
  const { t } = useTranslation('ats');

  return <div>{t('vacancies.title')}</div>;
}
