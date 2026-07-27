import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import type { VacancyTablePaginationProps } from '@/views/vacancies/types';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { cn } from '@cgp/ui-kit/lib/utils';

const BOUNDARY_COUNT = 3;

function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | '...')[] {
  // Every page fits without truncation up to 6 pages.
  if (totalPages < 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const firstPages = [0, 1, 2];
  const lastPages = [totalPages - 3, totalPages - 2, totalPages - 1];

  // Once the current page's own neighbours no longer touch either pinned
  // boundary block, collapse to a single pinned page on each side with a
  // 3-page window centred on the current page instead of letting the
  // boundary block keep growing as the user pages through (e.g. page 3 of
  // 10 becomes "1 ... 2 3 4 ... 10", not "1 2 3 4 ... 10").
  const isNearStart = currentPage <= BOUNDARY_COUNT - 2;
  const isNearEnd = currentPage >= totalPages - (BOUNDARY_COUNT - 1);
  if (!isNearStart && !isNearEnd) {
    const lastPageIndex = totalPages - 1;
    const windowStart = currentPage - 1;
    const windowEnd = currentPage + 1;

    // The leading pinned page always stays separated by an ellipsis, even
    // when it's directly adjacent to the window, so the active page reads
    // as centred rather than the boundary block growing as you page in.
    const leading: (number | '...')[] = [0, '...'];

    // On the trailing side, an ellipsis hiding only 0-1 pages reads as
    // pointless (e.g. "... 8" skipping nothing, or "... 15" skipping only
    // page 14) — show those pages directly instead of collapsing them.
    const trailingGap = lastPageIndex - windowEnd;
    const trailing: (number | '...')[] =
      trailingGap <= 2
        ? Array.from({ length: trailingGap }, (_, i) => windowEnd + 1 + i)
        : ['...', lastPageIndex];

    return [...leading, windowStart, currentPage, windowEnd, ...trailing];
  }

  // Otherwise show the first/last `BOUNDARY_COUNT` pages, plus a window
  // around the current page, collapsing any gap into a single ellipsis.
  const windowPages = [currentPage - 1, currentPage, currentPage + 1].filter(
    page => page >= 0 && page < totalPages
  );

  const uniqueSortedPages = [
    ...new Set([...firstPages, ...windowPages, ...lastPages]),
  ].sort((a, b) => a - b);

  const pages: (number | '...')[] = [];
  uniqueSortedPages.forEach((page, idx) => {
    if (idx > 0 && page - uniqueSortedPages[idx - 1] > 1) {
      pages.push('...');
    }
    pages.push(page);
  });

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
              className="animate-in fade-in-0 zoom-in-95 flex size-9 items-center justify-center text-sm text-slate-400 duration-200"
            >
              ...
            </span>
          ) : (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className={cn(
                'animate-in fade-in-0 zoom-in-95 size-9 rounded-lg p-0 text-sm duration-200',
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
