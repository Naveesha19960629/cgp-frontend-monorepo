import { Clock, DocumentText } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { formatDateRange } from '@/views/vacancies/utils/format-date-range';

function VacancyPublicationsSection({
  preferredPublications,
}: {
  preferredPublications?: VacancyViewModel['preferredPublications'];
}) {
  const { t } = useTranslation('ats');

  if (!preferredPublications || !preferredPublications.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section title={t('preferredPublications.title')}>
      {preferredPublications.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : preferredPublications.content.length === 0 ? (
        <p className="text-sm text-slate-500">-</p>
      ) : (
        <div className="flex flex-col gap-6">
          {preferredPublications.content.map((pub, index) => (
            <div key={index} className="flex flex-col gap-2">
              <VacancyView.InfoRow
                icon={
                  <DocumentText
                    size={20}
                    className="text-slate-600"
                    variant="Bold"
                  />
                }
                label={t('preferredPublications.fieldList.publisher')}
                value={pub.acceptedPublisherName}
              />
              <div className="flex items-center gap-1 text-sm">
                <Clock size={20} className="text-slate-600" variant="Bold" />
                <span className="font-semibold text-slate-600">
                  {formatDateRange(pub.publishedDateFrom, pub.publishedDateTo)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </VacancyView.Section>
  );
}

export { VacancyPublicationsSection };
