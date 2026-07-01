import { Clock, Global } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { formatDateRange } from '@/views/vacancies/utils/format-date-range';

function VacancyLicensesCertificationsSection({
  licenseCertificates,
}: {
  licenseCertificates?: VacancyViewModel['licenseCertificates'];
}) {
  const { t } = useTranslation('ats');

  if (!licenseCertificates || !licenseCertificates.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section title={t('licenseCertificates.title')}>
      {licenseCertificates.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : licenseCertificates.content.length === 0 ? (
        <p className="text-sm text-slate-500">-</p>
      ) : (
        <div className="flex flex-col gap-6">
          {licenseCertificates.content.map((entry, index) => (
            <div key={index} className="flex flex-col gap-3">
              {/* Top metadata row */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <Clock size={20} className="text-slate-600" variant="Bold" />
                  <span className="font-semibold text-slate-600">
                    {formatDateRange(entry.issueDate, entry.expirationDate)}
                  </span>
                </div>
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
              <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
                <VacancyView.Grid>
                  <VacancyView.Field
                    label={t('licenseCertificates.nameOfLicenseCert')}
                  >
                    <VacancyView.Tags values={entry.nameOfLicenseCert} />
                  </VacancyView.Field>
                  <VacancyView.Field
                    label={t('licenseCertificates.issuingOrganization')}
                  >
                    <VacancyView.Tags values={entry.issuingOrganization} />
                  </VacancyView.Field>
                  <VacancyView.Field
                    label={t('licenseCertificates.organizationLocations')}
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

export { VacancyLicensesCertificationsSection };
