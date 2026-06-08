import { ChevronDown, ChevronUp } from 'lucide-react';

import { VacancyTableAction } from '@/views/vacancies';
import VacancyActiveToggle from '@/views/vacancies/components/vacancy-active-toggle';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import type {
  CreateColumnsOptions,
  SortableHeaderProps,
  VacancyTableColumn,
} from '@/views/vacancies/types';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { type ColumnDef } from '@tanstack/react-table';

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
        <ChevronUp className={`size-4! ${upClass} text-slate-500`} />
        <ChevronDown className={`-mt-2 size-4! ${downClass} text-slate-500`} />
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
        className="bg-white"
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
    size: 30,
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
    header: () => (
      <div className="px-6">{t('vacancies.table.columns.status')}</div>
    ),
    cell: ({ row }) => {
      const { status } = row.original;
      const normalizedStatus = status.toLowerCase();
      return (
        <div className="flex items-center gap-3 px-6">
          <div className="min-w-30">
            <VacancyStatusBadge status={status} />
          </div>
          <VacancyActiveToggle isActive={normalizedStatus === 'live'} />
        </div>
      );
    },
    size: 270,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <VacancyTableAction
        vacancy={{
          id: row.original.vacancyId,
          status: row.original.status,
          applicantCount: row.original.applicantCount,
        }}
      />
    ),
    size: 50,
  },
];

export default createVacancyColumns;
