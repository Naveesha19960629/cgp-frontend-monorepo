import { Add } from 'iconsax-reactjs';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type {
  VacancyQueryParams,
  VacancyTableColumn,
  VacancyToggleAction,
} from '@/views/vacancies';
import {
  VacancyDataTable,
  VacancyDeleteDialog,
  VacancyFilteringSection,
  VacancyLoadingState,
  VacancySaveAsTemplateDialog,
  VacancySearchEmptyState,
  VacancyTableEmptyState,
  VacancyTablePagination,
  VacancyToggleStatusDialog,
  createVacancyColumns,
  useDeleteVacancyMutation,
  useDuplicateVacancyMutation,
  useNextTemplateNameQuery,
  useSaveVacancyAsTemplateMutation,
  useToggleVacancyStatusMutation,
  useVacanciesQuery,
  useVacancyStatusRevalidation,
  useVacancyTableParams,
} from '@/views/vacancies';
import { TABLE_PAGE_SIZE } from '@/views/vacancies/utils';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Spinner } from '@cgp/ui-kit/components/ui/spinner';
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

  const [deleteVacancyId, setDeleteVacancyId] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{
    id: string;
    action: VacancyToggleAction;
  } | null>(null);
  const [saveAsTemplateVacancyId, setSaveAsTemplateVacancyId] = useState<
    string | null
  >(null);
  const [templateName, setTemplateName] = useState('');
  const [isTemplateNameDirty, setIsTemplateNameDirty] = useState(false);
  const deleteMutation = useDeleteVacancyMutation();
  const toggleStatusMutation = useToggleVacancyStatusMutation();
  const { mutate: duplicateVacancy, isPending: isDuplicating } =
    useDuplicateVacancyMutation();
  const saveAsTemplateMutation = useSaveVacancyAsTemplateMutation();
  const {
    data: nextTemplateNameResponse,
    isLoading: isNextTemplateNameLoading,
  } = useNextTemplateNameQuery({
    enabled: Boolean(saveAsTemplateVacancyId),
  });

  const queryParams: VacancyQueryParams = useMemo(
    () => ({
      page: params.page - 1,
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

  const {
    data: vacanciesResponse,
    isLoading,
    isFetching,
    refetch: refetchVacancies,
  } = useVacanciesQuery(queryParams, {
    enabled: initialized && !!keycloak.authenticated,
  });

  const data = vacanciesResponse?.data?.content ?? [];

  // Vacancy status flips (Unpublished -> Live, On hold -> Live, Live ->
  // Expired) purely by the clock reaching schedulePublishAt/expirationAt,
  // with no user action to trigger a refetch — schedule one for the next
  // such transition.
  useVacancyStatusRevalidation(data, () => {
    void refetchVacancies();
  });

  const totalPages = vacanciesResponse?.data?.totalPages ?? 0;
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
        page: 1,
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
        void setParams({ sortBy: columnKey, sortOrder: 'asc', page: 1 });
      } else if (params.sortOrder === 'asc') {
        // Same column, ascending → descending
        void setParams({ sortOrder: 'desc', page: 1 });
      } else {
        // Same column, descending → clear sort (back to backend default: most recently created)
        void setParams({ sortBy: '', sortOrder: null, page: 1 });
      }
    },
    [params.sortBy, params.sortOrder, setParams]
  );

  const handleDeleteConfirm = () => {
    if (!deleteVacancyId) return;
    const isLastItemOnPage = data.length === 1 && params.page > 1;
    deleteMutation.mutate(deleteVacancyId, {
      onSuccess: () => {
        SuccessToast({
          title: t('vacancies.deleteDialog.notifications.successTitle'),
          description: t('vacancies.deleteDialog.notifications.successMessage'),
        });
        setDeleteVacancyId(null);
        if (isLastItemOnPage) {
          void setParams({ page: params.page - 1 });
        }
      },
      onError: () => {
        ErrorToast({
          title: t('vacancies.deleteDialog.notifications.errorTitle'),
          description: t('vacancies.deleteDialog.notifications.errorMessage'),
        });
      },
    });
  };

  const handleMakeACopy = useCallback(
    (vacancyId: string) => {
      duplicateVacancy(vacancyId, {
        onSuccess: () => {
          SuccessToast({
            title: t('vacancies.duplicateVacancy.notifications.successTitle'),
            description: t(
              'vacancies.duplicateVacancy.notifications.successMessage'
            ),
          });
        },
        onError: () => {
          ErrorToast({
            title: t('vacancies.duplicateVacancy.notifications.errorTitle'),
            description: t(
              'vacancies.duplicateVacancy.notifications.errorMessage'
            ),
          });
        },
      });
    },
    [duplicateVacancy, t]
  );

  const handleCopyLink = useCallback(
    (vacancyLink: string) => {
      if (!vacancyLink) {
        ErrorToast({
          title: t('vacancies.copyLink.notifications.errorTitle'),
          description: t('vacancies.copyLink.notifications.errorMessage'),
        });
        return;
      }

      navigator.clipboard
        .writeText(vacancyLink)
        .then(() => {
          SuccessToast({
            title: t('vacancies.copyLink.notifications.successTitle'),
            description: t('vacancies.copyLink.notifications.successMessage'),
          });
        })
        .catch(() => {
          ErrorToast({
            title: t('vacancies.copyLink.notifications.errorTitle'),
            description: t('vacancies.copyLink.notifications.errorMessage'),
          });
        });
    },
    [t]
  );

  const handleToggleConfirm = () => {
    if (!toggleTarget) return;
    const { id, action } = toggleTarget;
    const isActivate = action === 'ACTIVATE';
    toggleStatusMutation.mutate(
      { id, action },
      {
        onSuccess: () => {
          SuccessToast({
            title: t(
              isActivate
                ? 'vacancies.toggleStatusDialog.notifications.activateSuccessTitle'
                : 'vacancies.toggleStatusDialog.notifications.deactivateSuccessTitle'
            ),
            description: t(
              isActivate
                ? 'vacancies.toggleStatusDialog.notifications.activateSuccessMessage'
                : 'vacancies.toggleStatusDialog.notifications.deactivateSuccessMessage'
            ),
          });
          setToggleTarget(null);
        },
        onError: () => {
          ErrorToast({
            title: t('vacancies.toggleStatusDialog.notifications.errorTitle'),
            description: t(
              'vacancies.toggleStatusDialog.notifications.errorMessage'
            ),
          });
        },
      }
    );
  };

  const handleToggleSchedule = () => {
    if (!toggleTarget) return;
    const { id } = toggleTarget;
    setToggleTarget(null);
    // Scheduling from the toggle always parks the vacancy in On hold until the
    // configured date; scheduleToOnhold makes the schedule step submit as ONHOLD.
    void navigate(`/dashboard/ats/vacancies/${id}/edit`, {
      state: { initialStep: 'schedule-vacancy', scheduleToOnhold: true },
    });
  };

  // Pre-fill the system-generated template name once it loads, unless the
  // recruiter has already edited the field.
  useEffect(() => {
    const autoName = nextTemplateNameResponse?.data?.templateName;
    if (saveAsTemplateVacancyId && autoName && !isTemplateNameDirty) {
      setTemplateName(autoName);
    }
  }, [nextTemplateNameResponse, saveAsTemplateVacancyId, isTemplateNameDirty]);

  const handleSaveAsTemplateOpenChange = (open: boolean) => {
    if (!open) {
      setSaveAsTemplateVacancyId(null);
      setTemplateName('');
      setIsTemplateNameDirty(false);
    }
  };

  const handleSaveAsTemplateConfirm = () => {
    if (!saveAsTemplateVacancyId || !templateName.trim()) return;
    saveAsTemplateMutation.mutate(
      { vacancyId: saveAsTemplateVacancyId, templateName: templateName.trim() },
      {
        onSuccess: () => {
          SuccessToast({
            title: t('vacancies.saveAsTemplate.notifications.successTitle'),
            description: t(
              'vacancies.saveAsTemplate.notifications.successMessage'
            ),
          });
          handleSaveAsTemplateOpenChange(false);
        },
        onError: () => {
          ErrorToast({
            title: t('vacancies.saveAsTemplate.notifications.errorTitle'),
            description: t(
              'vacancies.saveAsTemplate.notifications.errorMessage'
            ),
          });
        },
      }
    );
  };

  const columns = useMemo(
    () =>
      createVacancyColumns({
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        onSort: handleSort,
        onView: (vacancyId: string) =>
          void navigate(`/dashboard/ats/vacancies/${vacancyId}/view`),
        onEdit: (vacancyId: string) =>
          void navigate(`/dashboard/ats/vacancies/${vacancyId}/edit`),
        onDelete: (vacancyId: string) => setDeleteVacancyId(vacancyId),
        onMakeACopy: handleMakeACopy,
        onSaveAsTemplate: (vacancyId: string) =>
          setSaveAsTemplateVacancyId(vacancyId),
        onToggleActive: (vacancyId: string, action: VacancyToggleAction) =>
          setToggleTarget({ id: vacancyId, action }),
        onCopyLink: handleCopyLink,
        t,
      }),
    [
      params.sortBy,
      params.sortOrder,
      handleSort,
      handleMakeACopy,
      handleCopyLink,
      navigate,
      t,
    ]
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

  let tableContent: ReactNode;
  if (isLoading) {
    tableContent = <VacancyLoadingState />;
  } else if (data.length === 0) {
    tableContent = hasActiveFilters ? (
      <VacancySearchEmptyState />
    ) : (
      <VacancyTableEmptyState />
    );
  } else {
    tableContent = (
      <VacancyDataTable
        table={table}
        isLoading={isFetching}
        onRowClick={row =>
          void navigate(`/dashboard/ats/vacancies/${row.vacancyId}/view`)
        }
      />
    );
  }

  return (
    <>
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
                    void setParams({ search: value, page: 1 })
                  }
                  careerPathFilter={params.careerPath}
                  onCareerPathChange={value =>
                    void setParams({ careerPath: value, page: 1 })
                  }
                  disciplineFilter={params.discipline}
                  onDisciplineChange={value =>
                    void setParams({ discipline: value, page: 1 })
                  }
                  statusFilter={params.status}
                  onStatusChange={value =>
                    void setParams({ status: value, page: 1 })
                  }
                />
              )}
              {!isLoading && (
                <Button
                  className="h-12 w-45 shrink-0 gap-1"
                  data-testid="create-vacancy-button"
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
        <div className="min-h-0 flex-1 overflow-hidden">{tableContent}</div>
        {!isLoading && data.length > 0 && (
          <VacancyTablePagination
            currentPage={params.page - 1}
            totalPages={totalPages}
            onPageChange={page => void setParams({ page: page + 1 })}
          />
        )}
      </section>
      <VacancyDeleteDialog
        open={Boolean(deleteVacancyId)}
        onOpenChange={open => {
          if (!open) setDeleteVacancyId(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
      <VacancyToggleStatusDialog
        open={Boolean(toggleTarget)}
        onOpenChange={open => {
          if (!open) setToggleTarget(null);
        }}
        action={toggleTarget?.action ?? 'ACTIVATE'}
        onConfirm={handleToggleConfirm}
        onSchedule={handleToggleSchedule}
        isToggling={toggleStatusMutation.isPending}
      />
      <VacancySaveAsTemplateDialog
        open={Boolean(saveAsTemplateVacancyId)}
        onOpenChange={handleSaveAsTemplateOpenChange}
        templateName={templateName}
        onTemplateNameChange={value => {
          setTemplateName(value);
          setIsTemplateNameDirty(true);
        }}
        onConfirm={handleSaveAsTemplateConfirm}
        isSaving={saveAsTemplateMutation.isPending}
        isTemplateNameLoading={isNextTemplateNameLoading}
      />
      {isDuplicating && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/70"
        >
          <Spinner className="size-8 text-slate-900" />
          <p className="text-sm font-semibold text-slate-900">
            {t('vacancies.duplicateVacancy.inProgress')}
          </p>
        </div>
      )}
    </>
  );
}
