import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  VacancyCausesSection,
  VacancyClubsSocietiesSection,
  VacancyCustomizableFormSection,
  VacancyHobbiesSection,
  VacancyHonoursAwardsSection,
  VacancyIndustriesSection,
  VacancyJobRequirementsSection,
  VacancyLanguagesSection,
  VacancyLicensesCertificationsSection,
  VacancyPatentsSection,
  VacancyProfileRequirementsSection,
  VacancyProjectRequirementsSection,
  VacancyPublicationsSection,
  VacancyScheduledVacancySection,
  VacancySecondaryEducationSection,
  VacancySkillsSection,
  VacancySportsSection,
  VacancyStatusBadge,
  VacancyTertiaryEducationSection,
  VacancyView,
  VacancyVolunteeringSection,
} from '@/views/vacancies/components';
import { useVacancyByIdQuery } from '@/views/vacancies/hooks';
import { toVacancyViewModel } from '@/views/vacancies/utils/vacancy-view-response-helpers';

import { Skeleton } from '@cgp/ui-kit/components/ui/skeleton';
import { useKeycloak } from '@react-keycloak/web';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export default function VacancyIdViewPage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<'id'>();
  const { keycloak, initialized } = useKeycloak();
  const fromPath = (location.state as { from?: string } | null)?.from ?? '';

  const {
    data: vacancyResponse,
    isLoading,
    error,
  } = useVacancyByIdQuery(id || '', {
    enabled: initialized && !!keycloak?.authenticated && !!id,
  });

  if (!id) {
    return (
      <div className="flex min-h-full items-center justify-center px-7 py-5">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-slate-900">
            {t('common.error.title')}
          </p>
          <p className="text-sm text-slate-600">
            {t('vacancies.edit.invalidId')}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <VacancyView.Root>
        <div className="space-y-4">
          <Skeleton className="h-9 w-1/3" />
          <Skeleton className="h-70 w-full" />
        </div>
      </VacancyView.Root>
    );
  }

  if (error || !vacancyResponse?.success || !isRecord(vacancyResponse.data)) {
    return (
      <div className="flex min-h-full items-center justify-center px-7 py-5">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-slate-900">
            {t('common.error.title')}
          </p>
          <p className="text-sm text-slate-600">
            {vacancyResponse?.message ||
              t('vacancies.edit.failedToLoadVacancy')}
          </p>
        </div>
      </div>
    );
  }

  const vacancyCandidate = isRecord(vacancyResponse.data.vacancy)
    ? vacancyResponse.data.vacancy
    : vacancyResponse.data;

  const viewModel = toVacancyViewModel(vacancyCandidate);

  const title = viewModel.title || t('vacancies.view.untitledVacancy');

  // VacancyStatusBadge owns both the label and the colour tokens, so it needs
  // the raw status ("LIVE"/"ONHOLD"/…) — a pre-formatted string misses
  // VACANCY_STATUS_CONFIG and falls back to the neutral grey pill.
  return (
    <VacancyView.Root>
      <VacancyView.BackHeader
        title={title}
        status={
          <VacancyStatusBadge
            status={viewModel.status || 'draft'}
            applicantCount={viewModel.applicantCount}
          />
        }
        onBack={() => void navigate(fromPath || '/dashboard/ats/vacancies')}
      />

      <VacancyView.Body>
        <VacancyJobRequirementsSection
          jobRequirement={viewModel.jobRequirement}
        />
        <VacancyProfileRequirementsSection
          profileRequirement={viewModel.profileRequirement}
        />
        <VacancySecondaryEducationSection
          secondaryEducation={viewModel.secondaryEducation}
        />
        <VacancyTertiaryEducationSection
          tertiaryEducation={viewModel.tertiaryEducation}
        />
        <VacancyProjectRequirementsSection
          preferredProjects={viewModel.preferredProjects}
        />
        <VacancyPublicationsSection
          preferredPublications={viewModel.preferredPublications}
        />
        <VacancyClubsSocietiesSection
          preferredClubSocieties={viewModel.preferredClubSocieties}
        />
        <VacancySportsSection preferredSports={viewModel.preferredSports} />
        <VacancyVolunteeringSection
          preferredVolunteering={viewModel.preferredVolunteering}
        />
        <VacancyPatentsSection preferredPatents={viewModel.preferredPatents} />
        <VacancyHonoursAwardsSection
          preferredHonoursAwards={viewModel.preferredHonoursAwards}
        />
        <VacancyLicensesCertificationsSection
          licenseCertificates={viewModel.licenseCertificates}
        />
        <VacancySkillsSection preferredSkills={viewModel.preferredSkills} />
        <VacancyLanguagesSection
          preferredLanguages={viewModel.preferredLanguages}
        />
        <VacancyCausesSection preferredCauses={viewModel.preferredCauses} />
        <VacancyHobbiesSection preferredHobbies={viewModel.preferredHobbies} />
        <VacancyIndustriesSection
          preferredIndustries={viewModel.preferredIndustries}
        />
        <VacancyCustomizableFormSection
          customizableForm={viewModel.customizableForm}
        />
        <VacancyScheduledVacancySection
          scheduledVacancy={viewModel.scheduledVacancy}
        />
      </VacancyView.Body>
    </VacancyView.Root>
  );
}
