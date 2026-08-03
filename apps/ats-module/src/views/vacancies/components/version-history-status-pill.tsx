import { useTranslation } from 'react-i18next';

import type { VersionHistoryStatusPillProps } from '@/views/vacancies/types';
import {
  VACANCY_STATUS_CONFIG,
  VACANCY_STATUS_FALLBACK_CONFIG,
  normalizeStatusKey,
} from '@/views/vacancies/utils';

import { cn } from '@cgp/ui-kit/lib/utils';

/**
 * Small status badge for the Activity Log's "status transitioned from X to
 * Y" line — same color tokens as VacancyStatusBadge (VACANCY_STATUS_CONFIG),
 * but compact, with no applicant count, to fit inline between two pills.
 */
export default function VersionHistoryStatusPill({
  status,
  className,
}: Readonly<VersionHistoryStatusPillProps>) {
  const { t } = useTranslation('ats');
  const key = normalizeStatusKey(status);
  const config =
    VACANCY_STATUS_CONFIG[key as keyof typeof VACANCY_STATUS_CONFIG] ??
    VACANCY_STATUS_FALLBACK_CONFIG;
  const label = config.labelKey ? t(config.labelKey) : status;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      {label}
    </span>
  );
}
