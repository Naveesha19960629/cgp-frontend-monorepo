import { Clock, Global } from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { formatDateRange } from '@/views/vacancies/utils/format-date-range';

function VacancyLicensesCertificationsSection({
  licenseCertificates,
}: Readonly<{
  licenseCertificates: VacancyViewModel['licenseCertificates'];
}>) {
  const { t } = useTranslation('ats');

  if (!licenseCertificates?.isEnabled) {
    return null;
  }

  let content: ReactNode;
  if (licenseCertificates.dataTakenFromCandidate) {
    content = <VacancyNoDetailsState />;
  } else if (licenseCertificates.content.length === 0) {
    content = <p className="text-sm text-slate-500">-</p>;
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {licenseCertificates.content.map((entry, index) => {
          const dateRange = formatDateRange(
            entry.issueDate,
            entry.expirationDate
          );
          const hasBoxData =
            entry.nameOfLicenseCert.length > 0 ||
            entry.issuingOrganization.length > 0 ||
            entry.organizationLocations.length > 0;

          return (
            <div
              key={`${entry.issueDate}-${entry.expirationDate}-${index}`}
              className="flex flex-col gap-3"
            >
              {/* Top metadata row */}
              <div className="flex flex-col gap-2">
                {dateRange && (
                  <div className="flex items-center gap-1 text-sm">
                    <Clock
                      size={20}
                      className="text-slate-600"
                      variant="Bold"
                    />
                    <span className="font-semibold text-slate-600">
                      {dateRange}
                    </span>
                  </div>
                )}
                {entry.internationallyAccepted && (
                  <div className="flex items-center gap-1 text-sm">
                    <Global
                      size={20}
                      className="text-slate-600"
                      variant="Bold"
                    />
                    <span className="font-semibold text-slate-600">
                      {t(
                        'licenseCertificates.internationallyAcceptedShort',
                        'Internationally accepted'
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Shaded box grid */}
              {hasBoxData && (
                <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
                  <VacancyView.Grid>
                    <VacancyView.Field
                      label={t('licenseCertificates.nameOfLicenseCert')}
                      isEmpty={entry.nameOfLicenseCert.length === 0}
                    >
                      <VacancyView.Tags values={entry.nameOfLicenseCert} />
                    </VacancyView.Field>
                    <VacancyView.Field
                      label={t('licenseCertificates.issuingOrganization')}
                      isEmpty={entry.issuingOrganization.length === 0}
                    >
                      <VacancyView.Tags values={entry.issuingOrganization} />
                    </VacancyView.Field>
                    <VacancyView.Field
                      label={t('licenseCertificates.organizationLocations')}
                      isEmpty={entry.organizationLocations.length === 0}
                    >
                      <VacancyView.Tags values={entry.organizationLocations} />
                    </VacancyView.Field>
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
    <VacancyView.Section title={t('licenseCertificates.title')}>
      {content}
    </VacancyView.Section>
  );
}

export { VacancyLicensesCertificationsSection };
