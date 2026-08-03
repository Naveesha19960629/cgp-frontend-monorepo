import { Autobrightness, Clock, Home, TaskSquare } from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { formatDateRange } from '@/views/vacancies/utils/format-date-range';

function VacancySecondaryEducationSection({
  secondaryEducation,
}: Readonly<{
  secondaryEducation?: VacancyViewModel['secondaryEducation'];
}>) {
  const { t } = useTranslation('ats');

  if (!secondaryEducation?.isEnabled) {
    return null;
  }

  let content: ReactNode;
  if (secondaryEducation.dataTakenFromCandidate) {
    content = <VacancyNoDetailsState />;
  } else if (secondaryEducation.content.length === 0) {
    content = <p className="text-sm text-slate-500">-</p>;
  } else {
    content = (
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
            <div
              key={`${entry.startDate}-${entry.endDate}-${index}`}
              className="flex flex-col gap-3"
            >
              {hasMetadata && (
                <div className="flex flex-col gap-2">
                  {entry.grade && (
                    <VacancyView.InfoRow
                      icon={
                        <Autobrightness
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
                      <span className="font-semibold text-slate-600">
                        {dateRange}
                      </span>
                    </div>
                  )}
                  {entry.result && (
                    <VacancyView.InfoRow
                      icon={
                        <TaskSquare
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
                      <Home
                        size={20}
                        className="text-slate-600"
                        variant="Bold"
                      />
                      <span className="font-semibold text-slate-600">
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
    );
  }

  return (
    <VacancyView.Section title={t('secondaryEducation.title')}>
      {content}
    </VacancyView.Section>
  );
}

export { VacancySecondaryEducationSection };
