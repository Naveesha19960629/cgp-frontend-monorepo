import { Add } from 'iconsax-reactjs';

import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useVacanciesQuery, useVacancyTableParams } from '@/views/vacancies';
import type { VacancyQueryParams, VacancyTableColumn } from '@/views/vacancies';
import {
  VacancyDataTable,
  VacancyFilteringSection,
  VacancyLoadingState,
  VacancySearchEmptyState,
  VacancyTableEmptyState,
  VacancyTablePagination,
  createVacancyColumns,
} from '@/views/vacancies';
import { TABLE_PAGE_SIZE } from '@/views/vacancies/utils';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { useKeycloak } from '@react-keycloak/web';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';

export default function VacanciesPage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const [params, setParams] = useVacancyTableParams();
  const { keycloak, initialized } = useKeycloak();

  const queryParams: VacancyQueryParams = useMemo(
    () => ({
      page: params.page,
      size: params.size,
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortBy && { sortOrder: params.sortOrder ?? 'asc' }),
      ...(params.search && { search: params.search }),
      ...(params.careerPath && { careerPath: params.careerPath }),
      ...(params.discipline && { discipline: params.discipline }),
      ...(params.status && { status: params.status }),
    }),
    [params]
  );

  const { data: vacanciesResponse, isLoading } = useVacanciesQuery(
    queryParams,
    {
      enabled: initialized && !!keycloak.authenticated,
    }
  );

  const data = vacanciesResponse?.data.content ?? [];
  const totalPages = vacanciesResponse?.data.totalPages ?? 0;
  const hasActiveFilters = Boolean(
    params.search || params.careerPath || params.discipline || params.status
  );
  const showHeaderControls = isLoading || data.length > 0 || hasActiveFilters;

  useEffect(() => {
    // Detect reload: beforeunload sets this key; a shared-link open (new tab/session)
    // has an empty sessionStorage and never finds it.
    const wasHere = sessionStorage.getItem('vacancies_page_loaded');
    sessionStorage.removeItem('vacancies_page_loaded');

    if (wasHere) {
      void setParams({
        page: 0,
        size: TABLE_PAGE_SIZE,
        sortBy: '',
        sortOrder: null,
        search: '',
        careerPath: '',
        discipline: '',
        status: '',
      });
    }

    const markUnload = () =>
      sessionStorage.setItem('vacancies_page_loaded', '1');
    window.addEventListener('beforeunload', markUnload);
    return () => window.removeEventListener('beforeunload', markUnload);
    // setParams is stable; this must only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = useCallback(
    (columnKey: string) => {
      if (params.sortBy !== columnKey) {
        // New column: start ascending
        void setParams({ sortBy: columnKey, sortOrder: 'asc', page: 0 });
      } else if (params.sortOrder === 'asc') {
        // Same column, ascending → descending
        void setParams({ sortOrder: 'desc', page: 0 });
      } else {
        // Same column, descending → clear sort (back to backend default: most recently created)
        void setParams({ sortBy: '', sortOrder: null, page: 0 });
      }
    },
    [params.sortBy, params.sortOrder, setParams]
  );

  const columns = useMemo(
    () =>
      createVacancyColumns({
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        onSort: handleSort,
        onEdit: (vacancyId: string) =>
          void navigate(`/dashboard/ats/vacancies/${vacancyId}/edit`),
        t,
      }),
    [params.sortBy, params.sortOrder, handleSort, navigate, t]
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
      <div className="flex items-center gap-4 pb-5.5">
        {!isLoading && (
          <p className="shrink-0 text-2xl/8 font-bold text-slate-900">
            {t('vacancies.title')}
          </p>
        )}
        {showHeaderControls && (
          <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
            {!isLoading && (
              <VacancyFilteringSection
                search={params.search}
                onSearchChange={value =>
                  void setParams({ search: value, page: 0 })
                }
                careerPathFilter={params.careerPath}
                onCareerPathChange={value =>
                  void setParams({ careerPath: value, page: 0 })
                }
                disciplineFilter={params.discipline}
                onDisciplineChange={value =>
                  void setParams({ discipline: value, page: 0 })
                }
                statusFilter={params.status}
                onStatusChange={value =>
                  void setParams({ status: value, page: 0 })
                }
              />
            )}
            {!isLoading && (
              <Button
                className="h-12 w-45 shrink-0 gap-1"
                onClick={() => {
                  void navigate('/dashboard/ats/vacancies/new');
                }}
              >
                <Add className="size-5 stroke-2" />
                {t('vacancies.createVacancyButton')}
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading ? (
          <VacancyLoadingState />
        ) : data.length === 0 ? (
          hasActiveFilters ? (
            <VacancySearchEmptyState />
          ) : (
            <VacancyTableEmptyState />
          )
        ) : (
          <VacancyDataTable table={table} isLoading={false} />
        )}
      </div>
      {!isLoading && data.length > 0 && (
        <VacancyTablePagination
          currentPage={params.page}
          totalPages={totalPages}
          onPageChange={page => void setParams({ page })}
        />
      )}
    </section>
  );
}
