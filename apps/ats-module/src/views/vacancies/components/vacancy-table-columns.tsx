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
import { type ColumnDef } from '@tanstack/react-table';

const STATUS_VARIANT_MAP: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Unpublished: 'bg-amber-100 text-amber-700',
  Live: 'bg-emerald-100 text-emerald-700',
  Active: 'bg-emerald-100 text-emerald-700',
  Expired: 'bg-red-100 text-red-700',
  Onhold: 'bg-orange-100 text-orange-700',
  On_Hold: 'bg-orange-100 text-orange-700',
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
      className="h-auto gap-1 p-0 font-medium hover:bg-transparent"
      onClick={() => onSort(columnKey)}
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp className={`size-3 ${upClass}`} />
        <ChevronDown className={`size-3 ${downClass}`} />
      </span>
    </Button>
  );
}

const createVacancyColumns = ({
  sortBy,
  sortOrder,
  onSort,
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
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    size: 40,
  },
  {
    id: 'vacancyId',
    accessorKey: 'vacancyId',
    header: 'ID',
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
        label="Job Title"
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
    size: 200,
  },
  {
    accessorKey: 'discipline',
    header: () => (
      <SortableHeader
        label="Discipline"
        columnKey="discipline"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.discipline}</span>
    ),
    size: 180,
  },
  {
    accessorKey: 'careerPath',
    header: 'Career Path',
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.careerPath}</span>
    ),
    size: 180,
  },
  {
    accessorKey: 'role',
    header: () => (
      <SortableHeader
        label="Role"
        columnKey="role"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.role}</span>
    ),
    size: 180,
  },
  {
    accessorKey: 'jobTitle',
    header: () => (
      <SortableHeader
        label="Job Title"
        columnKey="jobTitle"
        currentSortBy={sortBy}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.jobTitle}</span>
    ),
    size: 180,
  },
  {
    accessorKey: 'createdBy',
    header: 'Created By',
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.createdBy}</span>
    ),
    size: 140,
  },
  {
    accessorKey: 'createdAt',
    header: () => (
      <SortableHeader
        label="Created At"
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
    size: 160,
  },
  {
    accessorKey: 'schedulePublishAt',
    header: () => (
      <SortableHeader
        label="Schedule Publish"
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
    size: 180,
  },
  {
    accessorKey: 'expirationAt',
    header: () => (
      <SortableHeader
        label="Expiration"
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
    size: 160,
  },
  {
    accessorKey: 'applicantCount',
    header: () => (
      <SortableHeader
        label="Applicants"
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
    size: 120,
  },
  {
    accessorKey: 'updatedBy',
    header: 'Updated By',
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.updatedBy}</span>
    ),
    size: 140,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">
        {row.original.updatedAtLabel}
      </span>
    ),
    size: 160,
  },
  {
    accessorKey: 'version',
    header: 'Version',
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.version}</span>
    ),
    size: 80,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const variantClass =
        STATUS_VARIANT_MAP[status] ?? 'bg-slate-100 text-slate-700';
      return (
        <Badge
          className={`border-none px-3 py-1 text-xs font-medium ${variantClass}`}
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
