import { ChevronLeft } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import TemplateCancelDialog from '@/views/vacancies/components/template-cancel-dialog';
import TemplateFormBody from '@/views/vacancies/components/template-form-body';
import {
  useCreateTemplateMutation,
  useNextTemplateNameQuery,
  useVacancyTemplateForm,
} from '@/views/vacancies/hooks';
import { TEMPLATE_NAME_MAX_LENGTH } from '@/views/vacancies/utils/vacancy-template-config';
import { hasAnySelection } from '@/views/vacancies/utils/vacancy-template-payload-helpers';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';

const TEMPLATES_LIST_ROUTE = '/dashboard/ats/templates';

export default function NewVacancyTemplatePage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();

  const { form, setDataTakenFromCandidate } = useVacancyTemplateForm();
  const values = form.watch();
  // Read `isDirty` during render so RHF's formState proxy subscribes to it —
  // otherwise reading it only inside the cancel handler returns a stale `false`.
  const { isDirty } = form.formState;
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: nextNameResponse } = useNextTemplateNameQuery();
  const createTemplate = useCreateTemplateMutation();

  const autoName = nextNameResponse?.data?.templateName ?? '';
  const refNumber = nextNameResponse?.data?.refNumber ?? '';

  // Pre-fill the auto-generated name once it loads, unless the recruiter has
  // already edited the field.
  useEffect(() => {
    if (autoName && !form.formState.dirtyFields.templateName) {
      // reset (not setValue) so the generated name becomes the pristine
      // baseline — an untouched form stays non-dirty and cancels without the
      // confirmation prompt (DQCGP-2202 AC.1).
      form.reset({ ...form.getValues(), templateName: autoName });
    }
  }, [autoName, form]);

  const canCreate =
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

  const handleCreate = () => {
    if (!canCreate) return;

    createTemplate.mutate(
      { state: values, templateName: values.templateName, refNumber },
      {
        onSuccess: () => {
          SuccessToast({
            title: t('createTemplate.notifications.success.title'),
            description: t('createTemplate.notifications.success.message'),
          });
          void navigate(TEMPLATES_LIST_ROUTE);
        },
        onError: () => {
          ErrorToast({
            title: t('createTemplate.notifications.error.title'),
            description: t('createTemplate.notifications.error.message'),
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
          <span>{t('createTemplate.heading')}</span>
        </div>
        {refNumber && (
          <span className="text-xs font-medium text-slate-400">
            {refNumber}
          </span>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-7 pb-6">
        <TemplateFormBody
          form={form}
          setDataTakenFromCandidate={setDataTakenFromCandidate}
        />
      </div>

      {/* Footer */}
      <footer className="flex justify-end gap-3 border-t border-slate-200 px-7 py-7">
        <Button
          variant="secondary"
          className="h-14 w-48"
          onClick={handleCancel}
          disabled={createTemplate.isPending}
        >
          {t('createTemplate.cancel')}
        </Button>
        <Button
          className="h-14 w-48"
          onClick={handleCreate}
          disabled={!canCreate || createTemplate.isPending}
        >
          {t('createTemplate.create')}
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
