import { Add } from 'iconsax-reactjs';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useVacanciesQuery, useVacancyTableParams } from '@/views/vacancies';
import type { VacancyQueryParams, VacancyTableColumn } from '@/views/vacancies';
import {
  VacancyDataTable,
  VacancyFilteringSection,
  VacancyTablePagination,
  createVacancyColumns,
} from '@/views/vacancies';

import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';

export default function VacanciesPage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const [params, setParams] = useVacancyTableParams();

  const queryParams: VacancyQueryParams = React.useMemo(
    () => ({
      page: params.page,
      size: params.size,
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortBy && { sortOrder: params.sortOrder }),
      ...(params.search && { search: params.search }),
      ...(params.careerPath && { careerPath: params.careerPath }),
      ...(params.discipline && { discipline: params.discipline }),
      ...(params.status && { status: params.status }),
    }),
    [params]
  );

  const { data: vacanciesResponse, isLoading } = useVacanciesQuery(queryParams);

  const data = vacanciesResponse?.data.content ?? [];
  const totalPages = vacanciesResponse?.data.totalPages ?? 0;

  const handleSort = React.useCallback(
    (columnKey: string) => {
      if (params.sortBy === columnKey) {
        const newOrder = params.sortOrder === 'asc' ? 'desc' : 'asc';
        void setParams({ sortBy: columnKey, sortOrder: newOrder, page: 0 });
      } else {
        void setParams({ sortBy: columnKey, sortOrder: 'asc', page: 0 });
      }
    },
    [params.sortBy, params.sortOrder, setParams]
  );

  const columns = React.useMemo(
    () =>
      createVacancyColumns({
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        onSort: handleSort,
      }),
    [params.sortBy, params.sortOrder, handleSort]
  );

  const table = useReactTable<VacancyTableColumn>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    state: {
      columnPinning: {
        left: ['select', 'vacancyId'],
        right: ['status', 'actions'],
      },
    },
  });

  return (
    <section className="flex h-full flex-col overflow-hidden px-7 py-5">
      <div className="flex items-center justify-between pb-5.5">
        <p className="text-2xl/8 font-bold text-slate-900">
          {t('vacancies.title')}
        </p>
        <div className="flex items-center gap-4">
          <VacancyFilteringSection
            search={params.search}
            onSearchChange={value => void setParams({ search: value, page: 0 })}
            careerPathFilter={params.careerPath}
            onCareerPathChange={value =>
              void setParams({ careerPath: value, page: 0 })
            }
            disciplineFilter={params.discipline}
            onDisciplineChange={value =>
              void setParams({ discipline: value, page: 0 })
            }
            statusFilter={params.status}
            onStatusChange={value => void setParams({ status: value, page: 0 })}
          />
          <Button
            className="h-12 w-45 gap-1"
            onClick={() => {
              void navigate('/dashboard/ats/vacancies/new');
            }}
          >
            <Add className="size-5 stroke-2" />
            {t('vacancies.createVacancyButton')}
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <VacancyDataTable table={table} isLoading={isLoading} />
      </div>
      <VacancyTablePagination
        currentPage={params.page}
        totalPages={totalPages}
        onPageChange={page => void setParams({ page })}
      />
    </section>
  );
}
