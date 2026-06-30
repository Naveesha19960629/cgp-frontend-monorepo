import { Clock, DocumentText, Star, TickSquare } from 'iconsax-reactjs';

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

function VacancySecondaryEducationSection({
  secondaryEducation,
}: {
  secondaryEducation?: VacancyViewModel['secondaryEducation'];
}) {
  const { t } = useTranslation('ats');

  if (!secondaryEducation || !secondaryEducation.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section title={t('secondaryEducation.sectionTitle')}>
      {secondaryEducation.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : secondaryEducation.content.length === 0 ? (
        <p className="text-sm text-slate-500">-</p>
      ) : (
        <div className="flex flex-col gap-6">
          {secondaryEducation.content.map((entry, index) => {
            const dateRange = formatDateRange(entry.startDate, entry.endDate);
            const hasMetadata =
              !!entry.grade ||
              !!dateRange ||
              !!entry.result ||
              entry.acceptsHomeSchooling;
            const hasTagData =
              entry.schools.length > 0 ||
              entry.schoolLocations.length > 0 ||
              entry.examinations.length > 0 ||
              entry.secondaryAwardingBody.length > 0 ||
              entry.fieldsOfStudy.length > 0;

            return (
              <div key={index} className="flex flex-col gap-3">
                {hasMetadata && (
                  <div className="flex flex-col gap-2">
                    {entry.grade && (
                      <VacancyView.InfoRow
                        icon={
                          <Star
                            size={20}
                            className="text-slate-600"
                            variant="Bold"
                          />
                        }
                        label={t('secondaryEducation.grade')}
                        value={entry.grade}
                      />
                    )}
                    {dateRange && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock
                          size={20}
                          className="text-slate-600"
                          variant="Bold"
                        />
                        <span className="font-semibold text-slate-900">
                          {dateRange}
                        </span>
                      </div>
                    )}
                    {entry.result && (
                      <VacancyView.InfoRow
                        icon={
                          <DocumentText
                            size={20}
                            className="text-slate-600"
                            variant="Bold"
                          />
                        }
                        label={t('secondaryEducation.results')}
                        value={entry.result}
                      />
                    )}
                    {entry.acceptsHomeSchooling && (
                      <div className="flex items-center gap-1 text-sm">
                        <TickSquare
                          size={20}
                          className="text-slate-600"
                          variant="Bold"
                        />
                        <span className="font-semibold text-slate-900">
                          {t('secondaryEducation.acceptsHomeSchooling')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {hasTagData && (
                  <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
                    <VacancyView.Grid>
                      {entry.schools.length > 0 && (
                        <VacancyView.Field
                          label={t('secondaryEducation.schoolName')}
                        >
                          <VacancyView.Tags values={entry.schools} />
                        </VacancyView.Field>
                      )}
                      {entry.schoolLocations.length > 0 && (
                        <VacancyView.Field
                          label={t('secondaryEducation.schoolLocation')}
                        >
                          <VacancyView.Tags values={entry.schoolLocations} />
                        </VacancyView.Field>
                      )}
                      {entry.examinations.length > 0 && (
                        <VacancyView.Field
                          label={t('secondaryEducation.examination')}
                        >
                          <VacancyView.Tags values={entry.examinations} />
                        </VacancyView.Field>
                      )}
                      {entry.secondaryAwardingBody.length > 0 && (
                        <VacancyView.Field
                          label={t('secondaryEducation.awardingBody')}
                        >
                          <VacancyView.Tags
                            values={entry.secondaryAwardingBody}
                          />
                        </VacancyView.Field>
                      )}
                      {entry.fieldsOfStudy.length > 0 && (
                        <VacancyView.Field
                          label={t('secondaryEducation.fieldOfStudy')}
                        >
                          <VacancyView.Tags values={entry.fieldsOfStudy} />
                        </VacancyView.Field>
                      )}
                    </VacancyView.Grid>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </VacancyView.Section>
  );
}

export { VacancySecondaryEducationSection };
