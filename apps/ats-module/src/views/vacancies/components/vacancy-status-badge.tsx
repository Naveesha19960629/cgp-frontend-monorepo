import { useTranslation } from 'react-i18next';

import type { VacancyStatusBadgeProps } from '@/views/vacancies';
import {
  VACANCY_STATUS_CONFIG,
  VACANCY_STATUS_FALLBACK_CONFIG,
  normalizeStatusKey,
} from '@/views/vacancies/utils';

import { cn } from '@cgp/ui-kit/lib/utils';

export default function VacancyStatusBadge({
  status,
  applicantCount,
}: Readonly<VacancyStatusBadgeProps>) {
  const { t } = useTranslation('ats');
  const key = normalizeStatusKey(status);
  if (key === 'new') return null;
  const config =
    VACANCY_STATUS_CONFIG[key as keyof typeof VACANCY_STATUS_CONFIG] ??
    VACANCY_STATUS_FALLBACK_CONFIG;
  const statusLabel = config.labelKey ? t(config.labelKey) : status;
  const hidesApplicantCount = key === 'draft' || key === 'unpublished';
  const countSuffix = ` (${applicantCount} ${t('vacancies.stepBadge.applied')})`;
  const label =
    !hidesApplicantCount && applicantCount !== undefined
      ? `${statusLabel}${countSuffix}`
      : statusLabel;

  return (
    <span
      data-testid={`vacancy-${key}`}
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
