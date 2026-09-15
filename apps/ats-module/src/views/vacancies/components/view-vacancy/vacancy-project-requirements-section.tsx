import { Clock } from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { formatDateRange } from '@/views/vacancies/utils/format-date-range';

function VacancyProjectRequirementsSection({
  preferredProjects,
}: Readonly<{
  preferredProjects: VacancyViewModel['preferredProjects'];
}>) {
  const { t } = useTranslation('ats');

  if (!preferredProjects?.isEnabled) {
    return null;
  }

  let content: ReactNode;
  if (preferredProjects.dataTakenFromCandidate) {
    content = <VacancyNoDetailsState />;
  } else if (preferredProjects.content.length === 0) {
    content = <p className="text-sm text-slate-500">-</p>;
  } else {
    content = (
      <div className="flex flex-col gap-6">
        {preferredProjects.content.map((project, index) => {
          const dateRange = formatDateRange(project.startDate, project.endDate);

          return (
            <div
              key={`${project.startDate}-${project.endDate}-${index}`}
              className="flex flex-col gap-4"
            >
              {dateRange && (
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Clock size={18} className="text-slate-600" variant="Bold" />
                  <span className="font-semibold">{dateRange}</span>
                </div>
              )}

              <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
                <VacancyView.Grid>
                  <VacancyView.Field
                    label={t('projectsRequirements.relatedIndustry')}
                    isEmpty={project.relatedIndustry.length === 0}
                  >
                    <VacancyView.Tags values={project.relatedIndustry} />
                  </VacancyView.Field>

                  <VacancyView.Field
                    label={t('projectsRequirements.organizationLocation')}
                    isEmpty={project.organizationLocations.length === 0}
                  >
                    <VacancyView.Tags values={project.organizationLocations} />
                  </VacancyView.Field>

                  <VacancyView.Field
                    label={t('projectsRequirements.organizationName')}
                    isEmpty={project.organization.length === 0}
                  >
                    <VacancyView.Tags values={project.organization} />
                  </VacancyView.Field>
                </VacancyView.Grid>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <VacancyView.Section
      title={t('vacancies.view.sections.projectRequirements')}
    >
      {content}
    </VacancyView.Section>
  );
}

export { VacancyProjectRequirementsSection };
