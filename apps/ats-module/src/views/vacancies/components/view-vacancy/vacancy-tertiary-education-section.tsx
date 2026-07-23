import { Autobrightness } from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';

function VacancyTertiaryEducationSection({
  tertiaryEducation,
}: Readonly<{
  tertiaryEducation?: VacancyViewModel['tertiaryEducation'];
}>) {
  const { t } = useTranslation('ats');

  if (!tertiaryEducation?.isEnabled) {
    return null;
  }

  let content: ReactNode;
  if (tertiaryEducation.dataTakenFromCandidate) {
    content = <VacancyNoDetailsState />;
  } else if (tertiaryEducation.content.length === 0) {
    content = <p className="text-sm text-slate-500">-</p>;
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {tertiaryEducation.content.map((entry, index) => {
          const hasTagData =
            entry.qualificationName.length > 0 ||
            entry.tertiaryAwardingBody.length > 0 ||
            entry.tertiaryAwardingBodyLocations.length > 0 ||
            entry.levelOfQualification.length > 0 ||
            entry.specialization.length > 0 ||
            entry.studyMode.length > 0 ||
            entry.studyPattern.length > 0 ||
            entry.deliverySchedule.length > 0 ||
            entry.batch.length > 0 ||
            entry.department.length > 0 ||
            entry.faculty.length > 0;

          return (
            <div
              key={`${entry.grade}-${entry.qualificationName.join(',')}-${index}`}
              className="flex flex-col gap-3"
            >
              {entry.grade && (
                <VacancyView.InfoRow
                  icon={
                    <Autobrightness
                      size={20}
                      className="text-slate-600"
                      variant="Bold"
                    />
                  }
                  label={t('tertiaryEducation.grade')}
                  value={entry.grade}
                />
              )}

              {hasTagData && (
                <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
                  <VacancyView.Grid>
                    {entry.qualificationName.length > 0 && (
                      <VacancyView.Field
                        label={t('tertiaryEducation.qualificationName')}
                      >
                        <VacancyView.Tags values={entry.qualificationName} />
                      </VacancyView.Field>
                    )}
                    {entry.tertiaryAwardingBodyLocations.length > 0 && (
                      <VacancyView.Field
                        label={t(
                          'tertiaryEducation.tertiaryAwardingBodyLocations'
                        )}
                      >
                        <VacancyView.Tags
                          values={entry.tertiaryAwardingBodyLocations}
                        />
                      </VacancyView.Field>
                    )}
                    {entry.batch.length > 0 && (
                      <VacancyView.Field label={t('tertiaryEducation.batch')}>
                        <VacancyView.Tags values={entry.batch} />
                      </VacancyView.Field>
                    )}
                    {entry.tertiaryAwardingBody.length > 0 && (
                      <VacancyView.Field
                        label={t('tertiaryEducation.tertiaryAwardingBody')}
                      >
                        <VacancyView.Tags values={entry.tertiaryAwardingBody} />
                      </VacancyView.Field>
                    )}
                    {entry.levelOfQualification.length > 0 && (
                      <VacancyView.Field
                        label={t('tertiaryEducation.levelOfQualification')}
                      >
                        <VacancyView.Tags values={entry.levelOfQualification} />
                      </VacancyView.Field>
                    )}
                    {entry.specialization.length > 0 && (
                      <VacancyView.Field
                        label={t('tertiaryEducation.specialization')}
                      >
                        <VacancyView.Tags values={entry.specialization} />
                      </VacancyView.Field>
                    )}
                    {entry.studyMode.length > 0 && (
                      <VacancyView.Field
                        label={t('tertiaryEducation.studyMode')}
                      >
                        <VacancyView.Tags values={entry.studyMode} />
                      </VacancyView.Field>
                    )}
                    {entry.studyPattern.length > 0 && (
                      <VacancyView.Field
                        label={t('tertiaryEducation.studyPattern')}
                      >
                        <VacancyView.Tags values={entry.studyPattern} />
                      </VacancyView.Field>
                    )}
                    {entry.deliverySchedule.length > 0 && (
                      <VacancyView.Field
                        label={t('tertiaryEducation.deliverySchedule')}
                      >
                        <VacancyView.Tags values={entry.deliverySchedule} />
                      </VacancyView.Field>
                    )}
                    {entry.department.length > 0 && (
                      <VacancyView.Field
                        label={t('tertiaryEducation.department')}
                      >
                        <VacancyView.Tags values={entry.department} />
                      </VacancyView.Field>
                    )}
                    {entry.faculty.length > 0 && (
                      <VacancyView.Field label={t('tertiaryEducation.faculty')}>
                        <VacancyView.Tags values={entry.faculty} />
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
    <VacancyView.Section title={t('tertiaryEducation.title')}>
      {content}
    </VacancyView.Section>
  );
}

export { VacancyTertiaryEducationSection };
