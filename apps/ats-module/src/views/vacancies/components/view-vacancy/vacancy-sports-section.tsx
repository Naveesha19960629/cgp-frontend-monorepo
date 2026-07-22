import { Clock, Crown } from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { formatDateRange } from '@/views/vacancies/utils/format-date-range';

function VacancySportsSection({
  preferredSports,
}: Readonly<{
  preferredSports: VacancyViewModel['preferredSports'];
}>) {
  const { t } = useTranslation('ats');

  if (!preferredSports?.isEnabled) {
    return null;
  }

  let content: ReactNode;
  if (preferredSports.dataTakenFromCandidate) {
    content = <VacancyNoDetailsState />;
  } else if (preferredSports.content.length === 0) {
    content = <p className="text-sm text-slate-500">-</p>;
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {preferredSports.content.map((entry, index) => (
          <div
            key={`${entry.positionRoleHeld}-${entry.startDate}-${index}`}
            className="flex flex-col gap-3"
          >
            {/* Top metadata rows stacked vertically */}
            <div className="flex flex-col gap-2">
              <VacancyView.InfoRow
                icon={
                  <Crown size={20} className="text-slate-600" variant="Bold" />
                }
                label={t('preferredSports.fieldList.position')}
                value={entry.positionRoleHeld}
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
                <VacancyView.Field label={t('preferredSports.fieldList.sport')}>
                  <VacancyView.Tags values={entry.nameOfSport} />
                </VacancyView.Field>
                <VacancyView.Field
                  label={t('preferredSports.fieldList.organizationLocation')}
                >
                  <VacancyView.Tags values={entry.organizationLocations} />
                </VacancyView.Field>
                <VacancyView.Field
                  label={t('preferredSports.fieldList.levelRepresented')}
                >
                  <VacancyView.Tags values={entry.levelRepresented} />
                </VacancyView.Field>
                <VacancyView.Field
                  label={t('preferredSports.fieldList.representedOrganization')}
                >
                  <VacancyView.Tags values={entry.representedOrganization} />
                </VacancyView.Field>
              </VacancyView.Grid>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <VacancyView.Section title={t('preferredSports.title')}>
      {content}
    </VacancyView.Section>
  );
}

export { VacancySportsSection };
