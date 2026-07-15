import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  TemplateCard,
  TemplateDeleteDialog,
  TemplateEmptyState,
  TemplateSearchEmptyState,
  TemplatesToolbar,
  VacancyLoadingState,
  VacancyTablePagination,
  useDeleteTemplateMutation,
  useVacancyTemplatesQuery,
  useVacancyTemplatesTableParams,
} from '@/views/vacancies';
import type { VacancyTemplateQueryParams } from '@/views/vacancies';

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

  const { data: response, isLoading } = useVacancyTemplatesQuery(queryParams, {
    enabled: initialized && !!keycloak.authenticated,
  });

  const templates = response?.data?.content ?? [];
  const totalPages = response?.data?.totalPages ?? 0;
  const hasActiveSearch = Boolean(params.search);

  const goToCreate = () => void navigate(TEMPLATE_CREATE_ROUTE);

  // Launch the Create Vacancy From Template flow (DQCGP-2198).
  const goToUseTemplate = (id: string) =>
    void navigate(`/dashboard/ats/vacancies/from-template/${id}`, {
      state: { from: '/dashboard/ats/templates' },
    });

  // Edit Vacancy Template flow (DQCGP-2199).
  const goToEdit = (id: string) =>
    void navigate(`/dashboard/ats/templates/${id}/edit`);

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
        {isLoading ? (
          <VacancyLoadingState />
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
                onEdit={goToEdit}
                onDelete={setDeleteTemplateId}
                onUse={goToUseTemplate}
              />
            ))}
          </div>
        )}
      </div>

      {!isLoading && templates.length > 0 && (
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
