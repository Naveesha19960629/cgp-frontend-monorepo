import { Clock, DocumentText, Profile } from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { formatDateRange } from '@/views/vacancies/utils/format-date-range';

function VacancyHonoursAwardsSection({
  preferredHonoursAwards,
}: Readonly<{
  preferredHonoursAwards: VacancyViewModel['preferredHonoursAwards'];
}>) {
  const { t } = useTranslation('ats');

  if (!preferredHonoursAwards?.isEnabled) {
    return null;
  }

  let content: ReactNode;
  if (preferredHonoursAwards.dataTakenFromCandidate) {
    content = <VacancyNoDetailsState />;
  } else if (preferredHonoursAwards.content.length === 0) {
    content = <p className="text-sm text-slate-500">-</p>;
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {preferredHonoursAwards.content.map((entry, index) => (
          <div
            key={`${entry.title}-${entry.issuedFromDate}-${index}`}
            className="flex flex-col gap-3"
          >
            {/* Top metadata row */}
            <div className="flex flex-col gap-2">
              <VacancyView.InfoRow
                icon={
                  <DocumentText
                    size={20}
                    className="text-slate-600"
                    variant="Bold"
                  />
                }
                label={t(
                  'preferredHonoursAwards.fieldList.titleOfHonourOrAward'
                )}
                value={entry.title}
              />
              <VacancyView.InfoRow
                icon={
                  <Profile
                    size={20}
                    className="text-slate-600"
                    variant="Bold"
                  />
                }
                label={t('preferredHonoursAwards.issuedBy')}
                value={entry.issuedBy}
              />
              <div className="flex items-center gap-1 text-sm">
                <Clock size={20} className="text-slate-600" variant="Bold" />
                <span className="font-semibold text-slate-600">
                  {formatDateRange(entry.issuedFromDate, entry.issuedToDate)}
                </span>
              </div>
            </div>

            {/* Shaded box grid */}
            <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
              <VacancyView.Grid>
                <VacancyView.Field
                  label={t(
                    'preferredHonoursAwards.fieldList.associatedOrganization'
                  )}
                >
                  <VacancyView.Tags values={entry.associatedOrganizations} />
                </VacancyView.Field>
                <VacancyView.Field
                  label={t('preferredHonoursAwards.organizationLocation')}
                >
                  <VacancyView.Tags values={entry.organizationLocations} />
                </VacancyView.Field>
              </VacancyView.Grid>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <VacancyView.Section title={t('preferredHonoursAwards.title')}>
      {content}
    </VacancyView.Section>
  );
}

export { VacancyHonoursAwardsSection };
