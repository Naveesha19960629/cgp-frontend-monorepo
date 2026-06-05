import { ChevronDown, ChevronUp } from 'lucide-react';

import { VacancyTableAction } from '@/views/vacancies';
import type {
  CreateColumnsOptions,
  SortableHeaderProps,
  VacancyTableColumn,
} from '@/views/vacancies/types';

import { Badge } from '@cgp/ui-kit/components/ui/badge';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { cn } from '@cgp/ui-kit/lib/utils';
import { type ColumnDef } from '@tanstack/react-table';

const STATUS_VARIANT_MAP: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-300',
  unpublished: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  live: 'bg-emerald-100 border-emerald-300 text-emerald-600',
  expired: 'bg-[#33260317] text-[#492503] border-[#38230021]',
  on_hold: 'bg-blue-100 border-blue-200 text-blue-500',
};

function SortableHeader({
  label,
  columnKey,
  currentSortBy,
  currentSortOrder,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSortBy === columnKey;
  const upClass =
    isActive && currentSortOrder === 'asc'
      ? 'text-slate-900'
      : 'text-slate-300';
  const downClass =
    isActive && currentSortOrder === 'desc'
      ? 'text-slate-900'
      : 'text-slate-300';

  return (
    <Button
      variant="ghost"
      className="h-auto gap-1 p-0 font-bold text-slate-900 hover:bg-transparent"
      onClick={() => onSort(columnKey)}
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp className={`size-4! ${upClass}`} />
        <ChevronDown className={`-mt-2 size-4! ${downClass}`} />
      </span>
    </Button>
  );
}

const createVacancyColumns = ({
  sortBy,
  sortOrder,
  onSort,
  t,
}: CreateColumnsOptions): ColumnDef<VacancyTableColumn>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label={t('vacancies.table.selectAll')}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label={t('vacancies.table.selectRow')}
      />
    ),
    enableSorting: false,
    size: 40,
  },
  {
    id: 'vacancyId',
    accessorKey: 'vacancyId',
    header: t('vacancies.table.columns.id'),
    cell: ({ row }) => {
      const id = row.original.vacancyId;
      const shortId = id.slice(0, 4).toUpperCase();
      return <span className="text-sm text-slate-600">#{shortId}</span>;
    },
    size: 80,
  },
  {
    accessorKey: 'title',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.title')}
        columnKey="title"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium text-slate-900">
        {row.original.title}
      </span>
    ),
    size: 317,
  },
  {
    accessorKey: 'jobTitle',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.jobTitle')}
        columnKey="jobTitle"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.jobTitle}</span>
    ),
    size: 211,
  },
  {
    accessorKey: 'discipline',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.discipline')}
        columnKey="discipline"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.discipline}</span>
    ),
    size: 189,
  },
  {
    accessorKey: 'careerPath',
    header: t('vacancies.table.columns.careerPath'),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.careerPath}</span>
    ),
    size: 189,
  },
  {
    accessorKey: 'role',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.role')}
        columnKey="role"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.role}</span>
    ),
    size: 216,
  },
  {
    accessorKey: 'createdAt',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.createdAt')}
        columnKey="createdAt"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">
        {row.original.createdAtLabel}
      </span>
    ),
    size: 194,
  },
  {
    accessorKey: 'createdBy',
    header: t('vacancies.table.columns.createdBy'),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.createdBy}</span>
    ),
    size: 203,
  },
  {
    accessorKey: 'schedulePublishAt',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.schedulePublishAt')}
        columnKey="schedulePublishAt"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">
        {row.original.schedulePublishAtLabel}
      </span>
    ),
    size: 292,
  },
  {
    accessorKey: 'expirationAt',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.expirationAt')}
        columnKey="expirationAt"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">
        {row.original.expirationAtLabel}
      </span>
    ),
    size: 272,
  },
  {
    accessorKey: 'applicantCount',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.applicants')}
        columnKey="applicantCount"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">
        {row.original.applicantCount}
      </span>
    ),
    size: 153,
  },
  {
    accessorKey: 'updatedAt',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.updatedAt')}
        columnKey="updatedAt"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">
        {row.original.updatedAtLabel}
      </span>
    ),
    size: 213,
  },
  {
    accessorKey: 'updatedBy',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.updatedBy')}
        columnKey="updatedBy"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.updatedBy}</span>
    ),
    size: 203,
  },
  {
    accessorKey: 'version',
    header: () => (
      <SortableHeader
        label={t('vacancies.table.columns.version')}
        columnKey="version"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.version}</span>
    ),
    size: 100,
  },
  {
    accessorKey: 'status',
    header: t('vacancies.table.columns.status'),
    cell: ({ row }) => {
      const status = row.original.status;
      const variantClass =
        STATUS_VARIANT_MAP[status.toLowerCase()] ??
        'bg-slate-100 text-slate-700';
      return (
        <Badge
          className={cn(
            `border-none px-3 py-1 text-xs font-medium`,
            variantClass
          )}
        >
          {status}
        </Badge>
      );
    },
    size: 120,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <VacancyTableAction vacancy={{ id: row.original.vacancyId }} />
    ),
    size: 50,
  },
];

export default createVacancyColumns;
