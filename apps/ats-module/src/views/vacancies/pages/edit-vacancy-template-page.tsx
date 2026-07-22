import { ChevronLeft } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import TemplateCancelDialog from '@/views/vacancies/components/template-cancel-dialog';
import TemplateFormBody from '@/views/vacancies/components/template-form-body';
import VacancyLoadingState from '@/views/vacancies/components/vacancy-loading-state';
import {
  useUpdateTemplateMutation,
  useVacancyTemplateByIdQuery,
  useVacancyTemplateForm,
} from '@/views/vacancies/hooks';
import { TEMPLATE_NAME_MAX_LENGTH } from '@/views/vacancies/utils/vacancy-template-config';
import {
  hasAnySelection,
  toTemplateFormStateFromResponse,
} from '@/views/vacancies/utils/vacancy-template-payload-helpers';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';

const TEMPLATES_LIST_ROUTE = '/dashboard/ats/templates';

export default function EditVacancyTemplatePage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();

  const { form, setDataTakenFromCandidate } = useVacancyTemplateForm();
  const values = form.watch();
  // Read `isDirty` during render so RHF's formState proxy subscribes to it —
  // otherwise reading it only inside the cancel handler returns a stale `false`.
  const { isDirty } = form.formState;
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
  } = useVacancyTemplateByIdQuery(id);
  const updateTemplate = useUpdateTemplateMutation();

  const template = response?.data;
  const refNumber = template?.refNumber ?? '';

  // Rehydrate the form from the saved template exactly once, when it first
  // loads. Guarded by a ref so subsequent refetches/renders don't clobber the
  // recruiter's in-progress edits.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !template) return;
    hydratedRef.current = true;
    form.reset({
      templateName: template.templateName,
      ...toTemplateFormStateFromResponse(template.requestBody),
    });
  }, [template, form]);

  const canUpdate =
    values.templateName.trim().length > 0 &&
    values.templateName.length <= TEMPLATE_NAME_MAX_LENGTH &&
    hasAnySelection(values);

  // Cancel with unsaved changes → confirm first; a pristine form leaves
  // straight away (DQCGP-2202).
  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
      return;
    }
    void navigate(TEMPLATES_LIST_ROUTE);
  };

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    void navigate(TEMPLATES_LIST_ROUTE);
  };

  const handleUpdate = () => {
    if (!canUpdate || !id) return;

    updateTemplate.mutate(
      { id, state: values, templateName: values.templateName },
      {
        onSuccess: () => {
          SuccessToast({
            title: t('editTemplate.notifications.success.title'),
            description: t('editTemplate.notifications.success.message'),
          });
          void navigate(TEMPLATES_LIST_ROUTE);
        },
        onError: () => {
          ErrorToast({
            title: t('editTemplate.notifications.error.title'),
            description: t('editTemplate.notifications.error.message'),
          });
        },
      }
    );
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header — only the back arrow navigates; the title is plain text. */}
      <header className="flex items-center justify-between px-7 pt-6">
        <div className="flex items-center gap-2 text-2xl leading-8 font-bold tracking-[-0.144px] text-slate-900">
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={handleCancel}
            className="flex cursor-pointer items-center rounded-md focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:outline-none"
          >
            <ChevronLeft className="size-6" />
          </button>
          <span>{t('editTemplate.heading')}</span>
        </div>
        {/* System-generated Template ID (#T…), display-only (AC 3). */}
        {refNumber && (
          <span className="text-xs font-medium text-slate-400">
            {refNumber}
          </span>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-7 pb-6">
        {isLoading ? (
          <VacancyLoadingState />
        ) : isError || !template ? (
          <p className="pt-10 text-sm text-slate-500">
            {t('editTemplate.loadError')}
          </p>
        ) : (
          <TemplateFormBody
            form={form}
            setDataTakenFromCandidate={setDataTakenFromCandidate}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="flex justify-end gap-3 border-t border-slate-200 px-7 py-7">
        <Button
          variant="secondary"
          className="h-14 w-48"
          onClick={handleCancel}
          disabled={updateTemplate.isPending}
        >
          {t('editTemplate.cancel')}
        </Button>
        <Button
          className="h-14 w-48"
          onClick={handleUpdate}
          disabled={!canUpdate || updateTemplate.isPending}
        >
          {t('editTemplate.update')}
        </Button>
      </footer>

      <TemplateCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelConfirm}
      />
    </section>
  );
}
