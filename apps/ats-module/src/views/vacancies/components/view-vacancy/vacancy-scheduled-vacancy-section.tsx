import { Calendar, Link21 } from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { VacancyViewModel } from '@/views/vacancies/types';
import { parseLocalDate } from '@/views/vacancies/utils/date-timezone-safe';

import { format } from 'date-fns';

function ScheduledRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      <div className="flex items-center gap-1 text-slate-700">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <span className="size-1.5 shrink-0 rounded-full bg-slate-500" />
      <span className="font-semibold text-slate-700">{value || '-'}</span>
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
}: {
  scheduledVacancy?: VacancyViewModel['scheduledVacancy'];
}) {
  const { t } = useTranslation('ats');

  if (!scheduledVacancy) {
    return null;
  }

  const hasData =
    Boolean(scheduledVacancy.schedulePublishAt) ||
    Boolean(scheduledVacancy.expirationAt) ||
    Boolean(scheduledVacancy.vacancyLink);

  if (!hasData) {
    return null;
  }

  return (
    <section className="mb-4 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-4">
      <h2 className="mb-4 text-[18px] leading-7 font-bold text-slate-800">
        {t('vacancies.view.sections.scheduledVacancy')}
      </h2>
      <article className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
        <div className="flex flex-col gap-2.5">
          <ScheduledRow
            icon={
              <Calendar size={20} className="text-slate-600" variant="Bold" />
            }
            label={t('vacancies.view.scheduledVacancy.publishDateTime')}
            value={formatScheduleDateTime(scheduledVacancy.schedulePublishAt)}
          />
          <ScheduledRow
            icon={
              <Calendar size={20} className="text-slate-600" variant="Bold" />
            }
            label={t('vacancies.view.scheduledVacancy.expirationDateTime')}
            value={formatScheduleDateTime(scheduledVacancy.expirationAt)}
          />
          <ScheduledRow
            icon={
              <Link21 size={20} className="text-slate-600" variant="Bold" />
            }
            label={t('vacancies.view.scheduledVacancy.vacancyLink')}
            value={scheduledVacancy.vacancyLink || '-'}
          />
        </div>
      </article>
    </section>
  );
}

export { VacancyScheduledVacancySection };
