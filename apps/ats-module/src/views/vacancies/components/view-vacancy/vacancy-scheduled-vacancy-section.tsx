import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import calendarIcon from '@/assets/images/calender-with-time.svg';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { parseLocalDate } from '@/views/vacancies/utils/date-timezone-safe';

import { format } from 'date-fns';

function ScheduledRow({
  icon,
  label,
  value,
}: Readonly<{
  icon: ReactNode;
  label: string;
  value: string;
}>) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <div className="flex items-center gap-1 text-slate-600">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <span className="size-1.5 shrink-0 rounded-full bg-slate-600" />
      <span className="font-semibold text-slate-600">{value || '-'}</span>
    </div>
  );
}

function formatScheduleDateTime(value: string): string {
  if (!value) return '-';

  const parsed = parseLocalDate(value);
  if (!parsed) return value;

  return format(parsed, 'do MMM yyyy | hh : mm aa');
}

function VacancyScheduledVacancySection({
  scheduledVacancy,
}: Readonly<{
  scheduledVacancy?: VacancyViewModel['scheduledVacancy'];
}>) {
  const { t } = useTranslation('ats');

  if (!scheduledVacancy) {
    return null;
  }

  const hasData =
    Boolean(scheduledVacancy.schedulePublishAt) ||
    Boolean(scheduledVacancy.expirationAt);

  if (!hasData) {
    return null;
  }

  return (
    <VacancyView.Section title={t('vacancies.view.sections.scheduledVacancy')}>
      <div className="flex flex-col gap-2.5">
        <ScheduledRow
          icon={<img src={calendarIcon} alt="schedule" className="h-5 w-5" />}
          label={t('vacancies.view.scheduledVacancy.publishDateTime')}
          value={formatScheduleDateTime(scheduledVacancy.schedulePublishAt)}
        />
        <ScheduledRow
          icon={<img src={calendarIcon} alt="expiration" className="h-5 w-5" />}
          label={t('vacancies.view.scheduledVacancy.expirationDateTime')}
          value={formatScheduleDateTime(scheduledVacancy.expirationAt)}
        />
      </div>
    </VacancyView.Section>
  );
}

export { VacancyScheduledVacancySection };
