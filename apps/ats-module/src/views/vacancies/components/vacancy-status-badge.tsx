import { useTranslation } from 'react-i18next';

import type { StatusConfig } from '@/views/vacancies';

import { cn } from '@cgp/ui-kit/lib/utils';

type VacancyStatus = 'draft' | 'unpublished' | 'live' | 'expired' | 'on_hold';

const STATUS_CONFIG: Record<VacancyStatus, StatusConfig> = {
  draft: {
    bg: 'bg-[#f1f5f9]',
    border: 'border-[#cbd5e1]',
    text: 'text-[#475569]',
    labelKey: 'vacancies.table.filter.statusOptions.draft',
  },
  unpublished: {
    bg: 'bg-[#fff3e0]',
    border: 'border-[#fecc7e]',
    text: 'text-[#ca9239]',
    labelKey: 'vacancies.table.filter.statusOptions.unpublished',
  },
  live: {
    bg: 'bg-[#ecfdf5]',
    border: 'border-[#a7f3d0]',
    text: 'text-[#059669]',
    labelKey: 'vacancies.table.filter.statusOptions.live',
  },
  expired: {
    bg: 'bg-[rgba(51,38,3,0.09)]',
    border: 'border-[rgba(56,35,0,0.13)]',
    text: 'text-[#492503]',
    labelKey: 'vacancies.table.filter.statusOptions.expired',
  },
  on_hold: {
    bg: 'bg-[#dbeafe]',
    border: 'border-[#bfdbfe]',
    text: 'text-[#3b82f6]',
    labelKey: 'vacancies.table.filter.statusOptions.onHold',
  },
};

const FALLBACK_CONFIG: StatusConfig = {
  bg: 'bg-[#f1f5f9]',
  border: 'border-[#cbd5e1]',
  text: 'text-[#475569]',
  labelKey: '',
};

interface VacancyStatusBadgeProps {
  status: string;
}

export default function VacancyStatusBadge({
  status,
}: VacancyStatusBadgeProps) {
  const { t } = useTranslation('ats');
  const key = status.toLowerCase() as VacancyStatus;
  const config = STATUS_CONFIG[key] ?? FALLBACK_CONFIG;
  const label = config.labelKey ? t(config.labelKey) : status;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[8px] border px-[12px] py-[8px] text-[14px] leading-[20px] font-semibold whitespace-nowrap',
        config.bg,
        config.border,
        config.text
      )}
    >
      {label}
    </span>
  );
}
