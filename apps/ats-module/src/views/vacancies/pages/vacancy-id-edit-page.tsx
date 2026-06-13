import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { VacancyCreateStepperForm } from '@/views/vacancies';
import {
  VACANCY_STEPS,
  VacancyFormProvider,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import { useVacancyByIdQuery } from '@/views/vacancies/hooks';
import type { VacancyForm } from '@/views/vacancies/types';

import { Skeleton } from '@cgp/ui-kit/components/ui/skeleton';
import { useKeycloak } from '@react-keycloak/web';

function EditVacancyContent() {
  const { id } = useParams<'id'>();
  const { t } = useTranslation('ats');
  const { keycloak, initialized } = useKeycloak();
  const { setForm, setCurrentStepIndex } = useVacancyForm();
  const isHydratedRef = useRef(false);

  const {
    data: vacancyResponse,
    isLoading,
    error,
  } = useVacancyByIdQuery(id || '', {
    enabled: initialized && !!keycloak?.authenticated && !!id,
  });

  useEffect(() => {
    if (!vacancyResponse?.success || isHydratedRef.current) {
      return;
    }

    const vacancy = vacancyResponse.data?.vacancy;
    if (!vacancy || typeof vacancy !== 'object') {
      return;
    }

    const incomingForm = vacancy as Partial<VacancyForm>;
    setForm(prev => ({ ...prev, ...incomingForm }));

    if (typeof incomingForm.lastActiveStep === 'string') {
      const stepIndex = VACANCY_STEPS.findIndex(
        step => step.key === incomingForm.lastActiveStep
      );
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
      }
    }

    isHydratedRef.current = true;
  }, [vacancyResponse, setCurrentStepIndex, setForm]);

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

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 w-76.75 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-7">
            <Skeleton className="mb-9 h-8 w-48" />
            <div className="space-y-4">
              {['step-1', 'step-2', 'step-3', 'step-4', 'step-5'].map(
                stepId => (
                  <div key={stepId} className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-1 w-0.5 bg-slate-200" />
                  </div>
                )
              )}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center px-7 py-5">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-slate-900">
            {t('common.error.title')}
          </p>
          <p className="text-sm text-slate-600">
            {t('vacancies.edit.failedToLoadVacancy')}
          </p>
        </div>
      </div>
    );
  }

  if (!vacancyResponse?.success) {
    return (
      <div className="flex min-h-full items-center justify-center px-7 py-5">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-slate-900">
            {t('common.error.title')}
          </p>
          <p className="text-sm text-slate-600">
            {vacancyResponse?.message ||
              t('vacancies.edit.failedToLoadVacancy')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <VacancyCreateStepperForm />
    </div>
  );
}

export default function VacancyIdEditPage() {
  return (
    <VacancyFormProvider>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EditVacancyContent />
      </section>
    </VacancyFormProvider>
  );
}
