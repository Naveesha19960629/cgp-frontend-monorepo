import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { VacancyCreateStepperForm } from '@/views/vacancies';
import {
  VACANCY_STEPS,
  VacancyFormProvider,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import { useVacancyByIdQuery } from '@/views/vacancies/hooks';
import { toVacancyFormFromResponse } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import { Skeleton } from '@cgp/ui-kit/components/ui/skeleton';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';
import { useKeycloak } from '@react-keycloak/web';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function EditVacancyTitleStep() {
  const navigate = useNavigate();
  const { t } = useTranslation('ats');
  const { form, setForm, onNext } = useVacancyForm();

  const handleTitleChange = (value: string) => {
    const sanitizedTitle = removeEmoji(value);
    setForm(prev => ({ ...prev, title: sanitizedTitle }));
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="pt-7 pl-7">
        <p className="text-2xl/8 font-bold text-slate-900">
          {t('vacancies.editVacancy')}
        </p>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-99.5">
          <p className="mb-4 text-xl font-bold text-slate-900">
            {t('vacancies.createVacancy.formTitle')}
          </p>
          <div className="mb-1 flex items-center justify-between">
            <Label
              htmlFor="vacancy-title"
              className="text-sm font-semibold text-slate-900"
            >
              {t('vacancies.createVacancy.fieldTitle')}
            </Label>
            <CharacterCount
              maxLength={50}
              currentLength={form.title.length}
              className={'font-["Plus_Jakarta_Sans",sans-serif]'}
            />
          </div>
          <Input
            id="vacancy-title"
            className="h-11 w-full"
            maxLength={50}
            placeholder={t('vacancies.createVacancy.titlePlaceholder')}
            required
            value={form.title}
            onChange={e => handleTitleChange(e.target.value)}
          />
          <div className="mt-4 flex gap-4">
            <Button
              variant="secondary"
              className="h-12 flex-1"
              onClick={() => void navigate('/dashboard/ats/vacancies')}
            >
              {t('vacancies.createVacancy.cancelButton')}
            </Button>
            <Button className="h-12 flex-1" onClick={() => onNext()}>
              {t('vacancies.createVacancy.nextButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditVacancyContent() {
  const { id } = useParams<'id'>();
  const { t } = useTranslation('ats');
  const { keycloak, initialized } = useKeycloak();
  const { isInitialStep, setForm, setCurrentStepIndex } = useVacancyForm();
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

    const rawData = vacancyResponse.data;
    const vacancyCandidate = rawData?.vacancy ?? rawData;
    if (!isRecord(vacancyCandidate)) {
      return;
    }

    const vacancyRecord = vacancyCandidate;

    setForm(prev => toVacancyFormFromResponse(vacancyRecord, prev));

    if (typeof vacancyRecord.lastActiveStep === 'string') {
      const stepIndex = VACANCY_STEPS.findIndex(
        step => step.key === vacancyRecord.lastActiveStep
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
      {isInitialStep ? (
        <EditVacancyTitleStep />
      ) : (
        <VacancyCreateStepperForm mode="edit" />
      )}
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
