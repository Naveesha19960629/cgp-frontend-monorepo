import { ChevronDown, ChevronUp } from 'lucide-react';

import { VacancyTableAction } from '@/views/vacancies';
import VacancyActiveToggle from '@/views/vacancies/components/vacancy-active-toggle';
import VacancyMultiValueCell from '@/views/vacancies/components/vacancy-multi-value-cell';
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
}: Readonly<SortableHeaderProps>) {
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
      data-testid={`${columnKey}-sort-button`}
    >
      <span data-testid={`${columnKey}-col-label`}>{label}</span>
      <span className="flex flex-col">
        <ChevronUp className={`size-4! ${upClass} text-slate-500`} />
        <ChevronDown className={`-mt-2 size-4! ${downClass} text-slate-500`} />
      </span>
    </Button>
  );
}

/**
 * Normalizes jobTitle/role to a string array. The list endpoint used to return
 * a single string (pre-DQCGP-3838); tolerating that shape here means the cell
 * won't crash if a deployed backend hasn't rolled out the array response yet.
 */
function toDisplayValues(
  value: string[] | string | null | undefined
): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

const createVacancyColumns = ({
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onDelete,
  onMakeACopy,
  onSaveAsTemplate,
  onToggleActive,
  onCopyLink,
  t,
}: CreateColumnsOptions): ColumnDef<VacancyTableColumn>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex h-full items-center pl-4">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          className="size-5 bg-white"
          aria-label={t('vacancies.table.selectAll')}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex h-full items-center pl-4">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label={t('vacancies.table.selectRow')}
          className="size-5 bg-white"
        />
      </div>
    ),
    enableSorting: false,
    size: 44,
  },
  {
    id: 'vacancyId',
    accessorKey: 'vacancyId',
    header: () => (
      <span data-testid="id-col-label">{t('vacancies.table.columns.id')}</span>
    ),
    // CR-27: display exactly what the backend sends; vacancies created before
    // the hashtag existed have none. vacancyId (UUID) is still used for actions.
    cell: ({ row }) => (
      <span
        className="ml-1 text-sm text-slate-600"
        data-testid="vacancy-id-hashtag"
      >
        {row.original.vacancyIdHashtag || 'N/A'}
      </span>
    ),
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
      <button
        type="button"
        title={row.original.title}
        className="block max-w-70 cursor-pointer truncate text-left text-sm font-medium text-slate-900 hover:underline"
        onClick={() => onView(row.original.vacancyId)}
      >
        {row.original.title}
      </button>
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
    cell: ({ row }) => {
      const jobTitles = toDisplayValues(row.original.jobTitle);
      return (
        <VacancyMultiValueCell
          values={jobTitles}
          countLabel={t('vacancies.table.multiValue.jobTitlesCount', {
            count: jobTitles.length,
          })}
        />
      );
    },
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
    header: () => (
      <span data-testid="careerPath-col-label">
        {t('vacancies.table.columns.careerPath')}
      </span>
    ),
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
    cell: ({ row }) => {
      const roles = toDisplayValues(row.original.role);
      return (
        <VacancyMultiValueCell
          values={roles}
          countLabel={t('vacancies.table.multiValue.rolesCount', {
            count: roles.length,
          })}
        />
      );
    },
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
    header: () => (
      <span data-testid="createdBy-col-label">
        {t('vacancies.table.columns.createdBy')}
      </span>
    ),
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
      <span
        className="text-sm text-slate-600"
        data-testid={`vacancy-applicants-${row.original.applicantCount}`}
      >
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
      <div className="px-6" data-testid="status-col-label">
        {t('vacancies.table.columns.status')}
      </div>
    ),
    cell: ({ row }) => {
      const { status } = row.original;
      const normalizedStatus = status.toLowerCase();
      const isLive = normalizedStatus === 'live';
      // API enum is ONHOLD (no underscore); on_hold is the form/UI key
      const isOnHold =
        normalizedStatus === 'onhold' || normalizedStatus === 'on_hold';
      // Toggle is shown for every status but only actionable on Live/On hold;
      // other statuses render a disabled toggle.
      const isToggleEnabled = isLive || isOnHold;
      return (
        <div className="flex items-center gap-3 px-6">
          <div className="min-w-30">
            <VacancyStatusBadge
              status={status}
              applicantCount={row.original.applicantCount}
            />
          </div>
          <VacancyActiveToggle
            isActive={isLive}
            disabled={!isToggleEnabled}
            onToggle={
              isToggleEnabled
                ? () =>
                    onToggleActive(
                      row.original.vacancyId,
                      isLive ? 'DEACTIVATE' : 'ACTIVATE'
                    )
                : undefined
            }
          />
        </div>
      );
    },
    size: 270,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex h-full items-center justify-end pr-4">
        <VacancyTableAction
          vacancy={{
            id: row.original.vacancyId,
            status: row.original.status,
            applicantCount: row.original.applicantCount,
            availableActions: row.original.availableActions,
          }}
          onEdit={() => onEdit(row.original.vacancyId)}
          onDelete={() => onDelete(row.original.vacancyId)}
          onMakeACopy={() => onMakeACopy(row.original.vacancyId)}
          onSaveAsTemplate={() => onSaveAsTemplate(row.original.vacancyId)}
          onCopyLink={() => onCopyLink(row.original.vacancyLink)}
        />
      </div>
    ),
    size: 64,
  },
];

export default createVacancyColumns;
