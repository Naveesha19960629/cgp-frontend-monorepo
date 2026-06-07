import * as React from 'react';

import type { VacancyDataTableProps } from '@/views/vacancies/types';

import { ScrollArea } from '@cgp/ui-kit/components/ui/scroll-area';
import { Skeleton } from '@cgp/ui-kit/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@cgp/ui-kit/components/ui/table';
import { cn } from '@cgp/ui-kit/lib/utils';
import { type Column, flexRender } from '@tanstack/react-table';

const SKELETON_ROWS = 12;

export default function VacancyDataTable<TData>({
  table,
  isLoading,
}: VacancyDataTableProps<TData>) {
  const scrollRootRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  React.useEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;

    const viewport = root.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    if (!viewport) return;

    const update = () => {
      setCanScrollLeft(viewport.scrollLeft > 0);
      setCanScrollRight(
        viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 1
      );
    };

    update();
    viewport.addEventListener('scroll', update, { passive: true });

    const ro = new ResizeObserver(update);
    ro.observe(viewport);

    return () => {
      viewport.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  const getCellStyles = (
    column: Column<TData, unknown>,
    isHeader = false
  ): React.CSSProperties => {
    const isPinned = column.getIsPinned();
    const size = column.getSize();

    // Title column is flex: it expands to fill available space on wide viewports
    // while keeping 317 px as its minimum (matching its defined size).
    if (column.id === 'title') {
      const base: React.CSSProperties = {
        minWidth: `${size}px`,
        width: 'auto',
      };
      if (isHeader) {
        return {
          ...base,
          position: 'sticky',
          top: 0,
          zIndex: 3,
          backgroundColor: '#F1F5F9',
        };
      }
      return base;
    }

    // Always enforce explicit width so column.getStart() / column.getAfter()
    // offsets match the actual rendered widths (prevents sticky gaps).
    const base: React.CSSProperties = {
      width: `${size}px`,
      minWidth: `${size}px`,
      maxWidth: `${size}px`,
    };

    // Non-pinned header cells: sticky to top only.
    // z-index 3 keeps them above body content on vertical scroll.
    if (isHeader && !isPinned) {
      return {
        ...base,
        position: 'sticky',
        top: 0,
        zIndex: 3,
        backgroundColor: '#F1F5F9',
      };
    }

    if (!isPinned) return base;

    const isLastLeftPinned =
      isPinned === 'left' &&
      table.getLeftLeafColumns().at(-1)?.id === column.id;
    const isFirstRightPinned =
      isPinned === 'right' && table.getRightLeafColumns()[0]?.id === column.id;

    return {
      ...base,
      position: 'sticky',
      // Pinned header cells must stick to both axes; body cells only horizontally.
      top: isHeader ? 0 : undefined,
      left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
      right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
      // z-index 4: pinned header corners sit above non-pinned headers (3) and pinned body (1).
      zIndex: isHeader ? 4 : 1,
      backgroundColor: isHeader ? '#F1F5F9' : '#fff',
      boxShadow:
        isLastLeftPinned && canScrollLeft
          ? '6px 0 6px rgba(0,0,0,0.03)'
          : isFirstRightPinned && canScrollRight
            ? '-7px 0 6px rgba(0,0,0,0.03)'
            : undefined,
    };
  };

  return (
    <div ref={scrollRootRef} className="h-full">
      <div className="h-full overflow-hidden rounded-md border border-slate-200">
        <ScrollArea className="h-full" type="auto">
          <table
            data-slot="table"
            className="w-full caption-bottom text-sm"
            style={{
              width: '100%',
              minWidth: table.getTotalSize(),
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: 0,
            }}
          >
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead
                      className="h-11 border-b bg-slate-300 text-base font-bold text-slate-900"
                      key={header.id}
                      style={getCellStyles(header.column, true)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading || !table.getRowModel().rows?.length
                ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                    <TableRow key={i} className="h-18">
                      {table.getAllColumns().map(column => (
                        <TableCell
                          key={column.id}
                          style={getCellStyles(column)}
                          className={cn(
                            i < SKELETON_ROWS - 1 && 'border-b border-slate-200'
                          )}
                        >
                          <Skeleton className="h-4 w-full rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : table.getRowModel().rows.map((row, rowIndex, rows) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="h-18 hover:bg-transparent"
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          style={getCellStyles(cell.column)}
                          className={cn(
                            'overflow-hidden text-ellipsis whitespace-nowrap',
                            rowIndex < rows.length - 1 &&
                              'border-b border-slate-200'
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );
}
