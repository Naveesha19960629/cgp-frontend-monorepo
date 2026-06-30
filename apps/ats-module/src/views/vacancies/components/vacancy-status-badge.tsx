import { useTranslation } from 'react-i18next';

import type { VacancyStatusBadgeProps } from '@/views/vacancies';
import {
  VACANCY_STATUS_CONFIG,
  VACANCY_STATUS_FALLBACK_CONFIG,
} from '@/views/vacancies/utils';

import { cn } from '@cgp/ui-kit/lib/utils';

export default function VacancyStatusBadge({
  status,
  applicantCount,
}: VacancyStatusBadgeProps) {
  const { t } = useTranslation('ats');
  const key = status.toLowerCase();
  if (key === 'new') return null;
  const config =
    VACANCY_STATUS_CONFIG[key as keyof typeof VACANCY_STATUS_CONFIG] ??
    VACANCY_STATUS_FALLBACK_CONFIG;
  const statusLabel = config.labelKey ? t(config.labelKey) : status;
  const isDraft = key === 'draft';
  const label =
    !isDraft && applicantCount !== undefined
      ? `${statusLabel} - ${applicantCount} ${t('vacancies.stepBadge.applicants')}`
      : statusLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[8px] border px-3 py-2 text-[14px] leading-5 font-semibold whitespace-nowrap',
        config.bg,
        config.border,
        config.text
      )}
    >
      {label}
    </span>
  );
}
