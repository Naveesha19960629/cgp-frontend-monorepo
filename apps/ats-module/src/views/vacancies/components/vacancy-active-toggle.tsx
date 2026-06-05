import { useTranslation } from 'react-i18next';

import { cn } from '@cgp/ui-kit/lib/utils';

interface VacancyActiveToggleProps {
  isActive: boolean;
  onToggle?: (isActive: boolean) => void;
}

export default function VacancyActiveToggle({
  isActive,
  onToggle,
}: VacancyActiveToggleProps) {
  const { t } = useTranslation('ats');

  return (
    <button
      type="button"
      onClick={() => onToggle?.(!isActive)}
      className={cn(
        'inline-flex h-[28px] items-center rounded-[100px] transition-opacity',
        isActive
          ? 'bg-[#059669] py-[4px] pr-[4px] pl-[8px]'
          : 'bg-[#e5e5e5] py-[4px] pr-[8px] pl-[4px] opacity-50'
      )}
    >
      {isActive ? (
        <>
          <span className="text-[14px] leading-[20px] font-semibold text-white">
            {t('vacancies.table.statusOptions.active')}
          </span>
          <span className="ml-[4px] size-[20px] shrink-0 rounded-full bg-white" />
        </>
      ) : (
        <>
          <span className="size-[20px] shrink-0 rounded-full bg-white" />
          <span className="ml-[4px] text-[14px] leading-[20px] font-semibold text-[#64748b]">
            {t('vacancies.table.statusOptions.inactive')}
          </span>
        </>
      )}
    </button>
  );
}
