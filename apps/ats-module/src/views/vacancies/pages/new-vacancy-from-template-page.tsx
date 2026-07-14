import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { VacancyCreateStepperForm, VacancyTitleStep } from '@/views/vacancies';
import {
  DEFAULT_FORM,
  VacancyFormProvider,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import { useVacancyTemplateByIdQuery } from '@/views/vacancies/hooks';
import { toVacancyFormFromTemplateUsePayload } from '@/views/vacancies/utils';
import type { TemplateUseMapResult } from '@/views/vacancies/utils/vacancy-template-use-helpers';

import { Skeleton } from '@cgp/ui-kit/components/ui/skeleton';
import { useKeycloak } from '@react-keycloak/web';

/** Hydrates the wizard form once from the mapped template payload. */
function FromTemplateContent({ mapped }: { mapped: TemplateUseMapResult }) {
  const { isInitialStep, setForm, setCurrentStepIndex } = useVacancyForm();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    // Do NOT pre-seed completedSteps: step navigation must stay disabled until the
    // recruiter completes Job Requirements, matching the normal create-vacancy flow.
    setForm(mapped.form);
    setCurrentStepIndex(0);
  }, [mapped, setForm, setCurrentStepIndex]);

  return (
    <div className="flex min-h-0 flex-1">
      {isInitialStep ? (
        <VacancyTitleStep />
      ) : (
        <VacancyCreateStepperForm mode="create" />
      )}
    </div>
  );
}

function TemplateLoadingState() {
  return (
    <div className="flex min-h-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 w-76.75 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-7">
          <Skeleton className="mb-9 h-8 w-48" />
          <div className="space-y-4">
            {['step-1', 'step-2', 'step-3', 'step-4', 'step-5'].map(stepId => (
              <div key={stepId} className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-1 w-0.5 bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white" />
      </div>
    </div>
  );
}

function TemplateErrorState({ message }: { message: string }) {
  const { t } = useTranslation('ats');
  return (
    <div className="flex min-h-full items-center justify-center px-7 py-5">
      <div className="flex flex-col items-center gap-3">
        <p className="text-lg font-bold text-slate-900">
          {t('common.error.title')}
        </p>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}

export default function NewVacancyFromTemplatePage() {
  const { templateId } = useParams<'templateId'>();
  const { t } = useTranslation('ats');
  const { keycloak, initialized } = useKeycloak();

  const {
    data: response,
    isLoading,
    error,
  } = useVacancyTemplateByIdQuery(templateId ?? '', {
    enabled: initialized && !!keycloak?.authenticated && !!templateId,
  });

  if (!templateId) {
    return <TemplateErrorState message={t('vacancies.edit.invalidId')} />;
  }

  if (isLoading) {
    return <TemplateLoadingState />;
  }

  if (error || !response?.success || !response.data?.requestBody) {
    return (
      <TemplateErrorState
        message={
          response?.message || t('templates.useTemplate.failedToLoadTemplate')
        }
      />
    );
  }

  const mapped = toVacancyFormFromTemplateUsePayload(
    response.data.requestBody,
    DEFAULT_FORM
  );

  return (
    <VacancyFormProvider
      visibleStepKeys={mapped.visibleStepKeys}
      templateFieldVisibility={mapped.templateFieldVisibility}
      templateId={templateId}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <FromTemplateContent mapped={mapped} />
      </section>
    </VacancyFormProvider>
  );
}
