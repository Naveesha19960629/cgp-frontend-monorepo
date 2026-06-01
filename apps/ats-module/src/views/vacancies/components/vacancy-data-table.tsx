import * as React from 'react';

import type { VacancyDataTableProps } from '@/views/vacancies/types';

import { Skeleton } from '@cgp/ui-kit/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@cgp/ui-kit/components/ui/table';
import { type Column, flexRender } from '@tanstack/react-table';

const SKELETON_ROWS = 12;

export default function VacancyDataTable<TData>({
  table,
  isLoading,
}: VacancyDataTableProps<TData>) {
  const getCellStyles = (
    column: Column<TData, unknown>,
    isHeader = false
  ): React.CSSProperties => {
    const isPinned = column.getIsPinned();
    const size = column.getSize();

    // Always enforce explicit width so column.getStart() / column.getAfter()
    // offsets match the actual rendered widths (prevents sticky gaps).
    const base: React.CSSProperties = {
      width: `${size}px`,
      minWidth: `${size}px`,
      maxWidth: `${size}px`,
    };

    if (!isPinned) return base;

    const isLastLeftPinned =
      isPinned === 'left' &&
      table.getLeftLeafColumns().at(-1)?.id === column.id;
    const isFirstRightPinned =
      isPinned === 'right' && table.getRightLeafColumns()[0]?.id === column.id;

    return {
      ...base,
      position: 'sticky',
      left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
      right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
      zIndex: isHeader ? 2 : 1,
      backgroundColor: '#fff',
      boxShadow: isLastLeftPinned
        ? '4px 0 8px -4px rgba(0,0,0,0.12)'
        : isFirstRightPinned
          ? '-4px 0 8px -4px rgba(0,0,0,0.12)'
          : undefined,
    };
  };

  return (
    <div className="rounded-md border">
      <Table style={{ width: table.getTotalSize(), tableLayout: 'fixed' }}>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead
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
                <TableRow key={i}>
                  {table.getAllColumns().map(column => (
                    <TableCell key={column.id} style={getCellStyles(column)}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      style={getCellStyles(cell.column)}
                      className="overflow-hidden text-ellipsis whitespace-nowrap"
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
      </Table>
    </div>
  );
}
