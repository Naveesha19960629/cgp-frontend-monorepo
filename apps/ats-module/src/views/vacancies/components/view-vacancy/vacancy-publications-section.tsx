import { Clock, DocumentText } from 'iconsax-reactjs';

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
        <div className="flex flex-col gap-4">
          {preferredPublications.content.map((pub, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
            >
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
                <span className="font-semibold text-slate-900">
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
