import { BrifecaseTimer, ChartSquare, Routing2 } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';

import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';

function VacancyJobRequirementsSection({
  jobRequirement,
}: Readonly<{
  jobRequirement: VacancyViewModel['jobRequirement'];
}>) {
  const { t } = useTranslation('ats');

  return (
    <VacancyView.Section title={t('vacancies.view.sections.jobRequirements')}>
      {/* Top Metadata Info Rows */}
      <div className="mb-2 flex flex-col gap-2">
        <VacancyView.InfoRow
          icon={
            <BrifecaseTimer
              size={20}
              className="text-slate-600"
              variant="Bold"
            />
          }
          label={t('jobRequirements.discipline')}
          value={jobRequirement.discipline}
        />
        <VacancyView.InfoRow
          icon={
            <Routing2 size={20} className="text-slate-600" variant="Bold" />
          }
          label={t('jobRequirements.careerPath')}
          value={jobRequirement.careerPath}
        />
        <VacancyView.InfoRow
          icon={
            <ChartSquare size={20} className="text-slate-600" variant="Bold" />
          }
          label={t('jobRequirements.level')}
          value={jobRequirement.level}
        />
      </div>

      {/* Description Text */}
      {jobRequirement.description && (
        <div className="mb-4">
          <VacancyView.Description value={jobRequirement.description} />
        </div>
      )}

      {/* Grid of Chips inside a shaded box */}
      <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
        <VacancyView.Grid>
          <VacancyView.Field
            label={t('jobRequirements.role')}
            isEmpty={jobRequirement.role.length === 0}
          >
            <VacancyView.Tags values={jobRequirement.role} />
          </VacancyView.Field>

          <VacancyView.Field
            label={t('jobRequirements.jobTitle')}
            isEmpty={jobRequirement.jobTitle.length === 0}
          >
            <VacancyView.Tags values={jobRequirement.jobTitle} />
          </VacancyView.Field>

          <VacancyView.Field
            label={t('jobRequirements.employmentType')}
            isEmpty={jobRequirement.employmentType.length === 0}
          >
            <VacancyView.Tags values={jobRequirement.employmentType} />
          </VacancyView.Field>

          <VacancyView.Field
            label={t('jobRequirements.workSchedule')}
            isEmpty={jobRequirement.workSchedule.length === 0}
          >
            <VacancyView.Tags values={jobRequirement.workSchedule} />
          </VacancyView.Field>

          <VacancyView.Field
            label={t('jobRequirements.engagementModel')}
            isEmpty={jobRequirement.engagementModel.length === 0}
          >
            <VacancyView.Tags values={jobRequirement.engagementModel} />
          </VacancyView.Field>
        </VacancyView.Grid>
      </div>
    </VacancyView.Section>
  );
}

export { VacancyJobRequirementsSection };
