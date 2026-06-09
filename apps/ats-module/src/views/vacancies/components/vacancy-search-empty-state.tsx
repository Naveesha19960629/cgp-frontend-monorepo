import { useTranslation } from 'react-i18next';

import {
  EMPTY_STATE_ROW_WIDTHS,
  TABLE_PAGE_SIZE,
} from '@/views/vacancies/utils';

import { cn } from '@cgp/ui-kit/lib/utils';

const tableEmptyStateAvatar = new URL(
  '../../../assets/images/table-empty-state-avatar.svg',
  import.meta.url
).href;

export default function VacancySearchEmptyState() {
  const { t } = useTranslation('ats');

  return (
    <div className="relative h-full overflow-hidden rounded-md border border-slate-200">
      {/* Skeleton table background */}
      <table
        className="w-full caption-bottom text-sm"
        style={{
          tableLayout: 'fixed',
          borderCollapse: 'separate',
          borderSpacing: 0,
        }}
      >
        <thead>
          <tr>
            <th
              className="h-11 border-b border-slate-200 bg-slate-100"
              style={{ width: 141, minWidth: 141 }}
            />
            <th
              className="h-11 border-b border-slate-200 bg-slate-100"
              style={{ minWidth: 317, width: 'auto' }}
            />
            {Array.from({ length: 7 }).map((_, i) => (
              <th
                key={i}
                className="h-11 border-b border-slate-200 bg-slate-100"
                style={{ width: 189, minWidth: 189 }}
              />
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {Array.from({ length: TABLE_PAGE_SIZE }).map((_, rowIndex) => (
            <tr key={rowIndex} className="h-18">
              <td
                className={cn(
                  'px-6 py-4',
                  rowIndex < TABLE_PAGE_SIZE - 1 && 'border-b border-slate-200'
                )}
                style={{ width: 141, minWidth: 141 }}
              >
                <div className="flex items-center gap-3">
                  <div className="size-5 shrink-0 rounded bg-slate-100" />
                  <div className="h-5 w-15.25 rounded bg-slate-100" />
                </div>
              </td>
              <td
                className={cn(
                  'px-6 py-4',
                  rowIndex < TABLE_PAGE_SIZE - 1 && 'border-b border-slate-200'
                )}
                style={{ minWidth: 317, width: 'auto' }}
              >
                <div
                  className={cn(
                    'h-5 rounded bg-slate-100',
                    EMPTY_STATE_ROW_WIDTHS[rowIndex]?.first ?? 'w-67.25'
                  )}
                />
              </td>
              {Array.from({ length: 7 }).map((_, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    'px-6 py-4',
                    rowIndex < TABLE_PAGE_SIZE - 1 &&
                      'border-b border-slate-200'
                  )}
                  style={{ width: 189, minWidth: 189 }}
                >
                  <div
                    className={cn(
                      'h-5 rounded bg-slate-100',
                      EMPTY_STATE_ROW_WIDTHS[rowIndex]?.rest ?? 'w-35.25'
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Blurred overlay with search-specific empty state */}
      <div className="absolute inset-0 top-11 flex items-center justify-center bg-[rgba(255,255,255,0.1)] backdrop-blur-[5px]">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative size-32.75 shrink-0 overflow-hidden rounded-full">
            <img
              src={tableEmptyStateAvatar}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </div>

          {/* Text */}
          <div className="flex w-66.25 flex-col gap-2">
            <p className="text-xl font-bold tracking-[-0.1px] text-slate-900">
              {t('vacancies.searchEmptyState.title')}
            </p>
            <p className="text-sm font-semibold text-[#334155]">
              {t('vacancies.searchEmptyState.descriptionLine1')}
              <br />
              {t('vacancies.searchEmptyState.descriptionLine2')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
