import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  TEMPLATE_SKELETON_COUNT,
  TemplateCard,
  TemplateCardSkeleton,
  TemplateDeleteDialog,
  TemplateEmptyState,
  TemplateSearchEmptyState,
  TemplatesToolbar,
  VacancyTablePagination,
  useDeleteTemplateMutation,
  useVacancyTemplatesQuery,
  useVacancyTemplatesTableParams,
} from '@/views/vacancies';
import type { VacancyTemplateQueryParams } from '@/views/vacancies';
import { TABLE_PAGE_SIZE } from '@/views/vacancies/utils';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { useKeycloak } from '@react-keycloak/web';

const TEMPLATE_CREATE_ROUTE = '/dashboard/ats/templates/new';

export default function TemplatesPage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();
  const [params, setParams] = useVacancyTemplatesTableParams();
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const deleteMutation = useDeleteTemplateMutation();

  const queryParams: VacancyTemplateQueryParams = useMemo(
    () => ({
      page: params.page - 1,
      size: params.size,
      sortOrder: params.sortOrder,
      ...(params.search && { search: params.search }),
    }),
    [params]
  );

  const { data: response, isFetching } = useVacancyTemplatesQuery(queryParams, {
    enabled: initialized && !!keycloak.authenticated,
  });

  const templates = response?.data?.content ?? [];
  const totalPages = response?.data?.totalPages ?? 0;
  const hasActiveSearch = Boolean(params.search);

  useEffect(() => {
    // Detect reload: beforeunload sets this key; a shared-link open (new tab/session)
    // has an empty sessionStorage and never finds it.
    const wasHere = sessionStorage.getItem('templates_page_loaded');
    sessionStorage.removeItem('templates_page_loaded');

    if (wasHere) {
      void setParams({
        page: 1,
        size: TABLE_PAGE_SIZE,
        search: '',
        sortOrder: 'NEWEST',
      });
    }

    const markUnload = () =>
      sessionStorage.setItem('templates_page_loaded', '1');
    window.addEventListener('beforeunload', markUnload);
    return () => window.removeEventListener('beforeunload', markUnload);
    // setParams is stable; this must only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToCreate = () => void navigate(TEMPLATE_CREATE_ROUTE);

  // Launch the Create Vacancy From Template flow (DQCGP-2198).
  const goToUseTemplate = (id: string) =>
    void navigate(`/dashboard/ats/vacancies/from-template/${id}`, {
      state: { from: '/dashboard/ats/templates' },
    });

  // Edit flow is handled by its own story (DQCGP-2199). Wired here as a
  // no-op until it lands.
  const noop = () => {};

  const handleDeleteConfirm = () => {
    if (!deleteTemplateId) return;
    const isLastItemOnPage = templates.length === 1 && params.page > 1;
    deleteMutation.mutate(deleteTemplateId, {
      onSuccess: () => {
        SuccessToast({
          title: t('templates.deleteDialog.notifications.successTitle'),
          description: t('templates.deleteDialog.notifications.successMessage'),
        });
        setDeleteTemplateId(null);
        if (isLastItemOnPage) {
          void setParams({ page: params.page - 1 });
        }
      },
      onError: () => {
        ErrorToast({
          title: t('templates.deleteDialog.notifications.errorTitle'),
          description: t('templates.deleteDialog.notifications.errorMessage'),
        });
      },
    });
  };

  return (
    <section className="flex h-full flex-col overflow-hidden px-7 py-5">
      <div className="flex items-center gap-4 pb-5.5">
        <p className="shrink-0 text-2xl/8 font-bold text-slate-900">
          {t('templates.title')}
        </p>
        <TemplatesToolbar
          search={params.search}
          onSearchChange={value => void setParams({ search: value, page: 1 })}
          sortOrder={params.sortOrder}
          onSortOrderChange={value =>
            void setParams({ sortOrder: value, page: 1 })
          }
          onCreate={goToCreate}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isFetching ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: TEMPLATE_SKELETON_COUNT }, (_, index) => (
              <TemplateCardSkeleton key={index} />
            ))}
          </div>
        ) : templates.length === 0 ? (
          hasActiveSearch ? (
            <TemplateSearchEmptyState />
          ) : (
            <TemplateEmptyState />
          )
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map(template => (
              <TemplateCard
                key={template.vacancyTemplateId}
                template={template}
                onEdit={noop}
                onDelete={setDeleteTemplateId}
                onUse={goToUseTemplate}
              />
            ))}
          </div>
        )}
      </div>

      {!isFetching && templates.length > 0 && (
        <VacancyTablePagination
          currentPage={params.page - 1}
          totalPages={totalPages}
          onPageChange={page => void setParams({ page: page + 1 })}
        />
      )}

      <TemplateDeleteDialog
        open={Boolean(deleteTemplateId)}
        onOpenChange={open => {
          if (!open) setDeleteTemplateId(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </section>
  );
}
