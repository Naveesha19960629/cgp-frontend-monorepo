import { Add } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { cn } from '@cgp/ui-kit/lib/utils';

const tableEmptyStateAvatar = new URL(
  '../../../assets/images/table-empty-state-avatar.svg',
  import.meta.url
).href;

const EMPTY_ROWS = 12;

const rowWidths = [
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[220px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[250px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[200px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[240px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[230px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[210px]', rest: 'w-[141px]' },
];

export default function VacancyTableEmptyState() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();

  return (
    <div className="relative h-full overflow-hidden rounded-md border border-slate-200">
      {/* Non-scrollable skeleton table background */}
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
        <tbody>
          {Array.from({ length: EMPTY_ROWS }).map((_, rowIndex) => (
            <tr key={rowIndex} className="h-18">
              <td
                className={cn(
                  'px-6 py-4',
                  rowIndex < EMPTY_ROWS - 1 && 'border-b border-slate-200'
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
                  rowIndex < EMPTY_ROWS - 1 && 'border-b border-slate-200'
                )}
                style={{ minWidth: 317, width: 'auto' }}
              >
                <div
                  className={cn(
                    'h-5 rounded bg-slate-100',
                    rowWidths[rowIndex]?.first ?? 'w-67.25'
                  )}
                />
              </td>
              {Array.from({ length: 7 }).map((_, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    'px-6 py-4',
                    rowIndex < EMPTY_ROWS - 1 && 'border-b border-slate-200'
                  )}
                  style={{ width: 189, minWidth: 189 }}
                >
                  <div
                    className={cn(
                      'h-5 rounded bg-slate-100',
                      rowWidths[rowIndex]?.rest ?? 'w-35.25'
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-6">
          {/* Illustration */}
          <div className="relative size-32.75 shrink-0 overflow-hidden rounded-full">
            <img
              src={tableEmptyStateAvatar}
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
              className="h-10 w-fit gap-1"
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
