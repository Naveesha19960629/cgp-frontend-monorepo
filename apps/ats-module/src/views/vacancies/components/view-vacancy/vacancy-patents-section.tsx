import { Clock } from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { formatDisplayDate } from '@/views/vacancies/utils/format-date-range';

function formatDateRange(fromDate?: string, toDate?: string): string {
  const from = formatDisplayDate(fromDate);
  const to = formatDisplayDate(toDate);
  if (from && to) return `${from} - ${to}`;
  if (from) return from;
  if (to) return to;
  return '';
}

function VacancyPatentsSection({
  preferredPatents,
}: Readonly<{
  preferredPatents?: VacancyViewModel['preferredPatents'];
}>) {
  const { t } = useTranslation('ats');

  if (!preferredPatents?.isEnabled) {
    return null;
  }

  let content: ReactNode;
  if (preferredPatents.dataTakenFromCandidate) {
    content = <VacancyNoDetailsState />;
  } else if (preferredPatents.content.length === 0) {
    content = <p className="text-sm text-slate-500">-</p>;
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {preferredPatents.content.map((entry, index) => {
          const dateRange = formatDateRange(entry.fromDate, entry.toDate);
          const hasTagData =
            entry.relatedIndustry.length > 0 || entry.statuses.length > 0;

          return (
            <div
              key={`${entry.fromDate}-${entry.toDate}-${index}`}
              className="flex flex-col gap-3"
            >
              {dateRange && (
                <div className="flex items-center gap-1 text-sm">
                  <Clock size={20} className="text-slate-600" variant="Bold" />
                  <span className="font-semibold text-slate-600">
                    {dateRange}
                  </span>
                </div>
              )}

              {hasTagData && (
                <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
                  <VacancyView.Grid>
                    {entry.relatedIndustry.length > 0 && (
                      <VacancyView.Field
                        label={t('preferredPatents.relatedIndustry')}
                      >
                        <VacancyView.Tags values={entry.relatedIndustry} />
                      </VacancyView.Field>
                    )}
                    {entry.statuses.length > 0 && (
                      <VacancyView.Field label={t('preferredPatents.status')}>
                        <VacancyView.Tags values={entry.statuses} />
                      </VacancyView.Field>
                    )}
                  </VacancyView.Grid>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <VacancyView.Section title={t('preferredPatents.title')}>
      {content}
    </VacancyView.Section>
  );
}

export { VacancyPatentsSection };
