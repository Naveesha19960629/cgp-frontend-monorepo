import { Add } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  EMPTY_STATE_ROW_WIDTHS,
  TABLE_PAGE_SIZE,
} from '@/views/vacancies/utils';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { cn } from '@cgp/ui-kit/lib/utils';

const TABLE_EMPTY_STATE_AVATAR_URL = new URL(
  '../../../assets/images/table-empty-state-avatar.svg',
  import.meta.url
).href;

export default function VacancyTableEmptyState() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();

  const skeletonColumnKeys = Array.from(
    { length: 7 },
    (_, i) => `skeleton-col-${i}`
  );
  const skeletonRowKeys = Array.from(
    { length: TABLE_PAGE_SIZE },
    (_, i) => `skeleton-row-${i}`
  );

  return (
    <div className="relative h-full overflow-hidden rounded-md border border-slate-200">
      {/* Non-scrollable skeleton table background — decorative, so hidden
          from screen readers, which would otherwise announce an empty table. */}
      <table
        aria-hidden="true"
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
            {skeletonColumnKeys.map(columnKey => (
              <th
                key={columnKey}
                className="h-11 border-b border-slate-200 bg-slate-100"
                style={{ width: 189, minWidth: 189 }}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {skeletonRowKeys.map((rowKey, rowIndex) => (
            <tr key={rowKey} className="h-18">
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
              {skeletonColumnKeys.map((columnKey, _colIndex) => (
                <td
                  key={columnKey}
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

      <div className="absolute inset-0 top-11 flex items-center justify-center bg-[rgba(255,255,255,0.1)] backdrop-blur-[5px]">
        <div className="flex items-center gap-6">
          {/* Illustration */}
          <div className="relative size-32.75 shrink-0 overflow-hidden rounded-full">
            <img
              src={TABLE_EMPTY_STATE_AVATAR_URL}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </div>

          {/* Text + CTA */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-xl font-bold tracking-tight text-slate-900">
                {t('vacancies.emptyState.title')}
              </p>
              <p className="w-66.75 text-sm font-semibold text-slate-700">
                {t('vacancies.emptyState.description')}
              </p>
            </div>
            <Button
              className="h-10 w-49.25 gap-1 text-sm font-bold"
              onClick={() => void navigate('/dashboard/ats/vacancies/new')}
            >
              <Add className="size-5" />
              {t('vacancies.createVacancyButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
