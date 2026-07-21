import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import TemplateFormBody from '@/views/vacancies/components/template-form-body';
import VacancyTemplatePageHeader from '@/views/vacancies/components/vacancy-template-page-header';
import {
  useCreateTemplateMutation,
  useNextTemplateNameQuery,
  useTemplateSaveToastHandlers,
  useVacancyTemplateForm,
} from '@/views/vacancies/hooks';
import { TEMPLATES_LIST_ROUTE } from '@/views/vacancies/utils/constants';
import { TEMPLATE_NAME_MAX_LENGTH } from '@/views/vacancies/utils/vacancy-template-config';
import { hasAnySelection } from '@/views/vacancies/utils/vacancy-template-payload-helpers';

import { Button } from '@cgp/ui-kit/components/ui/button';

export default function NewVacancyTemplatePage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();

  const { form, setDataTakenFromCandidate } = useVacancyTemplateForm();
  const values = form.watch();

  const { data: nextNameResponse } = useNextTemplateNameQuery();
  const createTemplate = useCreateTemplateMutation();
  const saveToastHandlers = useTemplateSaveToastHandlers('createTemplate');

  const autoName = nextNameResponse?.data?.templateName ?? '';
  const refNumber = nextNameResponse?.data?.refNumber ?? '';

  // Pre-fill the auto-generated name once it loads, unless the recruiter has
  // already edited the field. `setValue` is RHF state, not React state.
  useEffect(() => {
    if (autoName && !form.formState.dirtyFields.templateName) {
      form.setValue('templateName', autoName);
    }
  }, [autoName, form]);

  const canCreate =
    values.templateName.trim().length > 0 &&
    values.templateName.length <= TEMPLATE_NAME_MAX_LENGTH &&
    hasAnySelection(values);

  const handleCancel = () => {
    void navigate(TEMPLATES_LIST_ROUTE);
  };

  const handleCreate = () => {
    if (!canCreate) return;

    createTemplate.mutate(
      { state: values, templateName: values.templateName, refNumber },
      saveToastHandlers
    );
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <VacancyTemplatePageHeader
        headingKey="createTemplate.heading"
        refNumber={refNumber}
        onBack={handleCancel}
      />

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
    </section>
  );
}
