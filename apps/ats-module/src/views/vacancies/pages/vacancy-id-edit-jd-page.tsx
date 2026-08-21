import { ChevronLeft } from 'lucide-react';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { VacancyEditCancelDialog } from '@/views/vacancies/components';
import FieldToggle from '@/views/vacancies/components/field-toggle';
import SectionCard from '@/views/vacancies/components/section-card';
import {
  useEditJobDescriptionForm,
  useUpdateVacancyJobDescriptionMutation,
  useVacancyJobDescriptionQuery,
} from '@/views/vacancies/hooks';
import { getFieldLabelKey, getSectionTitleKey } from '@/views/vacancies/utils';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Skeleton } from '@cgp/ui-kit/components/ui/skeleton';

const VACANCIES_LIST_ROUTE = '/dashboard/ats/vacancies';

export default function VacancyIdEditJdPage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { id } = useParams<'id'>();

  const {
    data: jobDescriptionResponse,
    isLoading,
    error,
  } = useVacancyJobDescriptionQuery(id || '');
  const jobDescription = jobDescriptionResponse?.data;

  const { form, toggleField, getAllFields, isDirty } =
    useEditJobDescriptionForm(jobDescription);
  const updateJobDescription = useUpdateVacancyJobDescriptionMutation();
  const values = form.watch();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleCancel = () => {
    if (isDirty) {
      setCancelDialogOpen(true);
    } else {
      void navigate(VACANCIES_LIST_ROUTE);
    }
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    void navigate(VACANCIES_LIST_ROUTE);
  };

  const handleUpdate = () => {
    if (!id || !isDirty) return;

    // The backend PATCH is a full-state replace scoped to eligible fields, so
    // every loaded field's current toggle state must be sent, not just the
    // ones the recruiter touched.
    const fields = getAllFields();
    if (fields.length === 0) return;

    updateJobDescription.mutate(
      { vacancyId: id, payload: { fields } },
      {
        onSuccess: () => {
          SuccessToast({
            title: t('editJobDescription.notifications.success.title'),
            description: t('editJobDescription.notifications.success.message'),
          });
          void navigate(VACANCIES_LIST_ROUTE);
        },
        onError: () => {
          ErrorToast({
            title: t('editJobDescription.notifications.error.title'),
            description: t('editJobDescription.notifications.error.message'),
          });
        },
      }
    );
  };

  if (!id) {
    return (
      <div className="flex min-h-full items-center justify-center px-7 py-5">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-slate-900">
            {t('common.error.title')}
          </p>
          <p className="text-sm text-slate-600">
            {t('vacancies.edit.invalidId')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-2 px-7 pt-6 text-xl font-bold tracking-tight text-slate-900">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={handleCancel}
          className="flex cursor-pointer items-center rounded-md focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:outline-none"
        >
          <ChevronLeft className="size-6" />
        </button>
        <span>{t('editJobDescription.heading')}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-30 w-full" />
            <Skeleton className="h-30 w-full" />
            <Skeleton className="h-30 w-full" />
          </div>
        )}

        {!isLoading && (error || !jobDescriptionResponse?.success) && (
          <div className="flex min-h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <p className="text-lg font-bold text-slate-900">
                {t('common.error.title')}
              </p>
              <p className="text-sm text-slate-600">
                {jobDescriptionResponse?.message ||
                  t('editJobDescription.notifications.error.message')}
              </p>
            </div>
          </div>
        )}

        {!isLoading && jobDescription && (
          <div className="flex flex-col gap-6">
            {jobDescription.sections.map(section => (
              <SectionCard
                key={section.sectionKey}
                title={t(getSectionTitleKey(section.sectionKey))}
              >
                <div className="mt-6 grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                  {section.fields.map(field => (
                    <FieldToggle
                      key={field.fieldKey}
                      label={t(
                        getFieldLabelKey(section.sectionKey, field.fieldKey)
                      )}
                      checked={
                        values[section.sectionKey]?.[field.fieldKey] ?? true
                      }
                      onToggle={value =>
                        toggleField(section.sectionKey, field.fieldKey, value)
                      }
                    />
                  ))}
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>

      <footer className="flex justify-end gap-3 border-t border-slate-200 px-7 py-4">
        <Button
          variant="secondary"
          className="h-14 w-48.25 rounded-lg bg-[#e5e5e5] text-[#525252] hover:bg-[#d4d4d4]"
          onClick={handleCancel}
          disabled={updateJobDescription.isPending}
        >
          {t('editJobDescription.cancel')}
        </Button>
        <Button
          className="h-14 w-48.25 rounded-lg bg-[#075056] text-white hover:bg-[#075056]/90"
          onClick={handleUpdate}
          disabled={!isDirty || updateJobDescription.isPending}
        >
          {t('editJobDescription.update')}
        </Button>
      </footer>

      <VacancyEditCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
      />
    </section>
  );
}
