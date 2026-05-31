import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { cn } from '@cgp/ui-kit/lib/utils';

interface VacancyTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

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
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between py-4">
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
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
              className="px-2 text-sm text-slate-500"
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant="ghost"
              size="sm"
              className={cn(
                'size-9 p-0 text-sm',
                currentPage === page
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
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
        className="gap-1"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
      >
        Next
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
