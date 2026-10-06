import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { VacancyDataTableProps } from '@/views/vacancies/types';
import { TABLE_PAGE_SIZE } from '@/views/vacancies/utils';

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
import { type Column, type Table, flexRender } from '@tanstack/react-table';

// Title column is flex: it expands to fill available space on wide viewports
// while keeping its defined size as a minimum.
function getTitleColumnStyles(size: number, isHeader: boolean): CSSProperties {
  const base: CSSProperties = { minWidth: `${size}px`, width: 'auto' };
  if (!isHeader) return base;

  return {
    ...base,
    position: 'sticky',
    top: 0,
    zIndex: 3,
    backgroundColor: '#F1F5F9',
  };
}

function getPinnedBoxShadow(
  isLastLeftPinned: boolean,
  isFirstRightPinned: boolean,
  canScrollLeft: boolean,
  canScrollRight: boolean
): string | undefined {
  if (isLastLeftPinned && canScrollLeft) {
    return '10px 0 6px -3px rgba(0,0,0,0.06)';
  }
  if (isFirstRightPinned && canScrollRight) {
    return '-10px 0 6px -3px rgba(0,0,0,0.06)';
  }
  return undefined;
}

function getPinnedColumnStyles<TData>(
  column: Column<TData, unknown>,
  base: CSSProperties,
  isHeader: boolean,
  isPinned: 'left' | 'right',
  table: Table<TData>,
  canScrollLeft: boolean,
  canScrollRight: boolean
): CSSProperties {
  const isLastLeftPinned =
    isPinned === 'left' && table.getLeftLeafColumns().at(-1)?.id === column.id;
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
    boxShadow: getPinnedBoxShadow(
      isLastLeftPinned,
      isFirstRightPinned,
      canScrollLeft,
      canScrollRight
    ),
  };
}

export default function VacancyDataTable<TData>({
  table,
  isLoading,
  onRowClick,
}: Readonly<VacancyDataTableProps<TData>>) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Stable, item-derived keys for the fixed-size set of skeleton placeholder
  // rows rendered while loading. Memoized (not per render) since the
  // skeleton rows carry no data of their own to key off.
  const skeletonRowKeys = useMemo(
    () =>
      Array.from({ length: TABLE_PAGE_SIZE }, (_, i) => `skeleton-row-${i}`),
    []
  );

  useEffect(() => {
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
  ): CSSProperties => {
    const isPinned = column.getIsPinned();
    const size = column.getSize();

    if (column.id === 'title') {
      return getTitleColumnStyles(size, isHeader);
    }

    // Always enforce explicit width so column.getStart() / column.getAfter()
    // offsets match the actual rendered widths (prevents sticky gaps).
    const base: CSSProperties = {
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

    return getPinnedColumnStyles(
      column,
      base,
      isHeader,
      isPinned,
      table,
      canScrollLeft,
      canScrollRight
    );
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
                ? skeletonRowKeys.map((rowKey, i) => (
                    <TableRow key={rowKey} className="h-18">
                      {table.getAllColumns().map(column => (
                        <TableCell
                          key={column.id}
                          style={getCellStyles(column)}
                          className={cn(
                            i < TABLE_PAGE_SIZE - 1 &&
                              'border-b border-slate-200'
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
                      className={cn(
                        'h-18 hover:bg-transparent',
                        onRowClick && 'cursor-pointer'
                      )}
                      onClick={event => {
                        if (!onRowClick) {
                          return;
                        }

                        const target = event.target as HTMLElement;
                        const isInteractive = target.closest(
                          'button, input, a, label, [role="checkbox"], [data-row-click-ignore="true"]'
                        );

                        if (isInteractive) {
                          return;
                        }

                        // Dragging to select text (e.g. to copy the Vacancy ID)
                        // ends in a click on the row; don't navigate then.
                        if (globalThis.getSelection()?.toString()) {
                          return;
                        }

                        onRowClick(row.original);
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell
                          key={cell.id}
                          style={getCellStyles(cell.column)}
                          // Status/actions cells never navigate on click; only the
                          // toggle and action buttons inside them stay interactive.
                          data-row-click-ignore={
                            cell.column.id === 'status' ||
                            cell.column.id === 'actions'
                              ? 'true'
                              : undefined
                          }
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
