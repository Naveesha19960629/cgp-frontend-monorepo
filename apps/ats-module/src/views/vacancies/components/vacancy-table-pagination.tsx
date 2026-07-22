import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import type { VacancyTablePaginationProps } from '@/views/vacancies/types';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { cn } from '@cgp/ui-kit/lib/utils';

function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages: (number | '...')[] = [];

  // Always show first page
  pages.push(0);

  if (currentPage > 2) {
    pages.push('...');
  }

  // Pages around current
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 3) {
    pages.push('...');
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages - 1);
  }

  return pages;
}

export default function VacancyTablePagination({
  currentPage,
  totalPages,
  onPageChange,
}: Readonly<VacancyTablePaginationProps>) {
  const { t } = useTranslation('ats');
  const effectiveTotal = Math.max(1, totalPages);
  const pageNumbers = getPageNumbers(currentPage, effectiveTotal);
  // Derive a stable, data-based key for each entry up front (rather than the
  // array index) — an ellipsis is uniquely identified by the numeric pages
  // surrounding it, since there are at most two ellipses and their neighbours
  // always differ.
  const pageItems = pageNumbers.map((page, idx) => ({
    page,
    key:
      page === '...'
        ? `ellipsis-${pageNumbers[idx - 1]}-${pageNumbers[idx + 1]}`
        : `page-${page}`,
  }));

  return (
    <div className="flex items-center justify-between pt-5">
      <Button
        variant="outline"
        size="sm"
        className="h-10 w-32 gap-1 border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        data-testid="back-table-button"
      >
        <ChevronLeft className="size-5" />
        {t('vacancies.table.pagination.back')}
      </Button>

      <div className="flex items-center gap-1">
        {pageItems.map(({ page, key }) =>
          page === '...' ? (
            <span
              key={key}
              className="flex size-9 items-center justify-center text-sm text-slate-400"
            >
              ...
            </span>
          ) : (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className={cn(
                'size-9 rounded-lg p-0 text-sm',
                currentPage === page
                  ? 'bg-[#075056] text-white hover:bg-[#075056]/90 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
              onClick={() => onPageChange(page)}
            >
              {page + 1}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-10 w-32 gap-1 border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= effectiveTotal - 1}
        data-testid="next-table-button"
      >
        {t('vacancies.table.pagination.next')}
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
