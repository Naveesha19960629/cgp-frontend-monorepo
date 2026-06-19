import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import {
  VacancyJobRequirementsSection,
  VacancyStatusBadge,
  VacancyView,
} from '@/views/vacancies/components';
import { useVacancyByIdQuery } from '@/views/vacancies/hooks';
import { toVacancyViewModel } from '@/views/vacancies/utils/vacancy-view-response-helpers';

import { Skeleton } from '@cgp/ui-kit/components/ui/skeleton';
import { useKeycloak } from '@react-keycloak/web';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function formatViewStatusLabel({
  status,
  applicantCount,
  t,
}: {
  status: string;
  applicantCount: number;
  t: (key: string, options?: Record<string, unknown>) => string;
}): string {
  const normalized = status.trim().toLowerCase();
  const normalizedWithUnderscore = normalized.replace(/\s+/g, '_');

  if (
    normalizedWithUnderscore === 'live' ||
    normalizedWithUnderscore === 'expired' ||
    normalizedWithUnderscore === 'onhold' ||
    normalizedWithUnderscore === 'on_hold'
  ) {
    return `${status} (${applicantCount} ${t('vacancies.view.applied')})`;
  }

  return status;
}

export default function VacancyIdViewPage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const { keycloak, initialized } = useKeycloak();

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
  const statusLabel = formatViewStatusLabel({
    status: viewModel.status || t('vacancies.table.filter.statusOptions.draft'),
    applicantCount: viewModel.applicantCount,
    t,
  });

  return (
    <VacancyView.Root>
      <VacancyView.BackHeader
        title={title}
        status={<VacancyStatusBadge status={statusLabel} />}
        onBack={() => void navigate('/dashboard/ats/vacancies')}
      />

      <VacancyView.Body>
        <VacancyJobRequirementsSection
          jobRequirement={viewModel.jobRequirement}
        />
      </VacancyView.Body>
    </VacancyView.Root>
  );
}
