import { Clock, Crown } from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { formatDateRange } from '@/views/vacancies/utils/format-date-range';

function VacancyVolunteeringSection({
  preferredVolunteering,
}: Readonly<{
  preferredVolunteering: VacancyViewModel['preferredVolunteering'];
}>) {
  const { t } = useTranslation('ats');

  if (!preferredVolunteering?.isEnabled) {
    return null;
  }

  let content: ReactNode;
  if (preferredVolunteering.dataTakenFromCandidate) {
    content = <VacancyNoDetailsState />;
  } else if (preferredVolunteering.content.length === 0) {
    content = <p className="text-sm text-slate-500">-</p>;
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {preferredVolunteering.content.map((entry, index) => (
          <div
            key={`${entry.positionRole}-${entry.startDate}-${index}`}
            className="flex flex-col gap-3"
          >
            {/* Top metadata rows stacked vertically */}
            <div className="flex flex-col gap-2">
              <VacancyView.InfoRow
                icon={
                  <Crown size={20} className="text-slate-600" variant="Bold" />
                }
                label={t('preferredVolunteering.fieldList.position')}
                value={entry.positionRole}
              />
              <div className="flex items-center gap-1 text-sm">
                <Clock size={20} className="text-slate-600" variant="Bold" />
                <span className="font-semibold text-slate-600">
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
                  label={t('preferredVolunteering.fieldList.location')}
                >
                  <VacancyView.Tags values={entry.organizationLocations} />
                </VacancyView.Field>
                <VacancyView.Field
                  label={t('preferredVolunteering.fieldList.cause')}
                >
                  <VacancyView.Tags values={entry.cause} />
                </VacancyView.Field>
              </VacancyView.Grid>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <VacancyView.Section title={t('preferredVolunteering.title')}>
      {content}
    </VacancyView.Section>
  );
}

export { VacancyVolunteeringSection };
