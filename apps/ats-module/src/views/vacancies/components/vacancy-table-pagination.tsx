import { ChevronLeft, ChevronRight } from 'lucide-react';

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
}: VacancyTablePaginationProps) {
  const effectiveTotal = Math.max(1, totalPages);
  const pageNumbers = getPageNumbers(currentPage, effectiveTotal);

  return (
    <div className="flex items-center justify-between border-t border-slate-200 py-4">
      <Button
        variant="outline"
        size="sm"
        className="h-10 gap-1 px-4"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <ChevronLeft className="size-4" />
        Back
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex size-9 items-center justify-center text-sm text-slate-400"
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
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
        className="h-10 gap-1 px-4"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= effectiveTotal - 1}
      >
        Next
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
