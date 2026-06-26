import { Clock } from 'iconsax-reactjs';

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

function VacancyProjectRequirementsSection({
  preferredProjects,
}: {
  preferredProjects?: VacancyViewModel['preferredProjects'];
}) {
  const { t } = useTranslation('ats');

  if (!preferredProjects || !preferredProjects.isEnabled) {
    return null;
  }

  return (
    <VacancyView.Section
      title={t('vacancies.view.sections.projectRequirements')}
    >
      {preferredProjects.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : preferredProjects.content.length === 0 ? (
        <p className="text-sm text-slate-500">-</p>
      ) : (
        <div className="flex flex-col gap-4">
          {preferredProjects.content.map((project, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Clock size={18} className="text-slate-600" variant="Bold" />
                <span className="font-semibold">
                  {formatDateRange(project.startDate, project.endDate) || '-'}
                </span>
              </div>

              <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
                <VacancyView.Grid>
                  <VacancyView.Field
                    label={t('projectsRequirements.relatedIndustry')}
                  >
                    <VacancyView.Tags values={project.relatedIndustry} />
                  </VacancyView.Field>

                  <VacancyView.Field
                    label={t('projectsRequirements.organizationLocation')}
                  >
                    <VacancyView.Tags values={project.organizationLocations} />
                  </VacancyView.Field>

                  <VacancyView.Field
                    label={t('projectsRequirements.organizationName')}
                  >
                    <VacancyView.Tags values={project.organization} />
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

export { VacancyProjectRequirementsSection };
