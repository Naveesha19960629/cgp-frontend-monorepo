import { Clock, Crown } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { parseLocalDate } from '@/views/vacancies/utils/date-timezone-safe';

import { format } from 'date-fns';

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  if (!d) return '';
  return format(d, 'do MMM yyyy');
}

function formatDateRange(startDate?: string, endDate?: string): string {
  const start = formatDisplayDate(startDate);
  const end = formatDisplayDate(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - Present`;
  if (end) return `Until ${end}`;
  return '';
}

function VacancyVolunteeringSection({
  preferredVolunteering,
}: {
  preferredVolunteering?: VacancyViewModel['preferredVolunteering'];
}) {
  const { t } = useTranslation('ats');

  if (!preferredVolunteering || !preferredVolunteering.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section title={t('preferredVolunteering.title')}>
      {preferredVolunteering.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : preferredVolunteering.content.length === 0 ? (
        <p className="text-sm text-slate-500">-</p>
      ) : (
        <div className="flex flex-col gap-6">
          {preferredVolunteering.content.map((entry, index) => (
            <div key={index} className="flex flex-col gap-3">
              {/* Top metadata rows stacked vertically */}
              <div className="flex flex-col gap-2">
                <VacancyView.InfoRow
                  icon={
                    <Crown
                      size={20}
                      className="text-slate-600"
                      variant="Bold"
                    />
                  }
                  label={t('preferredVolunteering.fieldList.position')}
                  value={entry.positionRole}
                />
                <div className="flex items-center gap-1 text-sm">
                  <Clock size={20} className="text-slate-600" variant="Bold" />
                  <span className="font-semibold text-slate-900">
                    {formatDateRange(entry.startDate, entry.endDate)}
                  </span>
                </div>
              </div>

              {/* Shaded box grid */}
              <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
                <VacancyView.Grid>
                  <VacancyView.Field
                    label={t('preferredVolunteering.fieldList.organization')}
                  >
                    <VacancyView.Tags values={entry.organization} />
                  </VacancyView.Field>
                  <VacancyView.Field
                    label={t('preferredVolunteering.fieldList.cause')}
                  >
                    <VacancyView.Tags values={entry.cause} />
                  </VacancyView.Field>
                  <VacancyView.Field
                    label={t('preferredVolunteering.fieldList.location')}
                  >
                    <VacancyView.Tags values={entry.organizationLocations} />
                  </VacancyView.Field>
                </VacancyView.Grid>
              </div>
            </div>
          ))}
        </div>
      )}
    </VacancyView.Section>
  );
}

export { VacancyVolunteeringSection };
