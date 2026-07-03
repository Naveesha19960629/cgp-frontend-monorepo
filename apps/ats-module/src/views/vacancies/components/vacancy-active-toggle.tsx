import { useTranslation } from 'react-i18next';

import type { VacancyActiveToggleProps } from '@/views/vacancies';

import { cn } from '@cgp/ui-kit/lib/utils';

export default function VacancyActiveToggle({
  isActive,
  onToggle,
}: VacancyActiveToggleProps) {
  const { t } = useTranslation('ats');

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onToggle?.(!isActive);
      }}
      className={cn(
        'inline-flex h-7 cursor-pointer items-center rounded-[100px] transition-opacity',
        isActive
          ? 'bg-[#059669] py-1 pr-1 pl-2'
          : 'bg-[#e5e5e5] py-1 pr-2 pl-1 opacity-50'
      )}
    >
      {isActive ? (
        <>
          <span className="text-[14px] leading-5 font-semibold text-white">
            {t('vacancies.table.statusOptions.active')}
          </span>
          <span className="ml-1 size-5 shrink-0 rounded-full bg-white" />
        </>
      ) : (
        <>
          <span className="size-5 shrink-0 rounded-full bg-white" />
          <span className="ml-1 text-[14px] leading-5 font-semibold text-[#64748b]">
            {t('vacancies.table.statusOptions.inactive')}
          </span>
        </>
      )}
    </button>
  );
}
