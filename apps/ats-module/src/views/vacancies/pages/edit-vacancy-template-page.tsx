import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import TemplateFormBody from '@/views/vacancies/components/template-form-body';
import VacancyLoadingState from '@/views/vacancies/components/vacancy-loading-state';
import VacancyTemplatePageHeader from '@/views/vacancies/components/vacancy-template-page-header';
import {
  useTemplateSaveToastHandlers,
  useUpdateTemplateMutation,
  useVacancyTemplateByIdQuery,
  useVacancyTemplateForm,
} from '@/views/vacancies/hooks';
import { TEMPLATES_LIST_ROUTE } from '@/views/vacancies/utils/constants';
import { TEMPLATE_NAME_MAX_LENGTH } from '@/views/vacancies/utils/vacancy-template-config';
import {
  hasAnySelection,
  toTemplateFormStateFromResponse,
} from '@/views/vacancies/utils/vacancy-template-payload-helpers';

import { Button } from '@cgp/ui-kit/components/ui/button';

export default function EditVacancyTemplatePage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();

  const { form, setDataTakenFromCandidate } = useVacancyTemplateForm();
  const values = form.watch();

  const {
    data: response,
    isLoading,
    isError,
  } = useVacancyTemplateByIdQuery(id);
  const updateTemplate = useUpdateTemplateMutation();
  const saveToastHandlers = useTemplateSaveToastHandlers('editTemplate');

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

  const handleCancel = () => {
    void navigate(TEMPLATES_LIST_ROUTE);
  };

  const handleUpdate = () => {
    if (!canUpdate || !id) return;

    updateTemplate.mutate(
      { id, state: values, templateName: values.templateName },
      saveToastHandlers
    );
  };

  const renderBody = () => {
    if (isLoading) return <VacancyLoadingState />;
    if (isError || !template) {
      return (
        <p className="pt-10 text-sm text-slate-500">
          {t('editTemplate.loadError')}
        </p>
      );
    }
    return (
      <TemplateFormBody
        form={form}
        setDataTakenFromCandidate={setDataTakenFromCandidate}
      />
    );
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <VacancyTemplatePageHeader
        headingKey="editTemplate.heading"
        refNumber={refNumber}
        onBack={handleCancel}
      />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-7 pb-6">{renderBody()}</div>

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
    </section>
  );
}
