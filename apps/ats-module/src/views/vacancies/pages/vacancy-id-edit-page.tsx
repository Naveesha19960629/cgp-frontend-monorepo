import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { VacancyCreateStepperForm } from '@/views/vacancies';
import {
  VacancyEditCancelDialog,
  VacancyStatusBadge,
} from '@/views/vacancies/components';
import {
  VACANCY_STEPS,
  VacancyFormProvider,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import { useVacancyByIdQuery } from '@/views/vacancies/hooks';
import type { VacancyForm } from '@/views/vacancies/types';
import { toVacancyFormFromResponse } from '@/views/vacancies/utils/vacancy-edit-response-helpers';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { SuccessToast } from '@cgp/ui-kit/components/custom-toast';
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
  const location = useLocation();
  const { t } = useTranslation('ats');
  const { form, setForm, onNext, setCurrentStepIndex } = useVacancyForm();
  const showStatusBadge = form.status && form.status !== 'new';
  const fromPath = (location.state as { from?: string } | null)?.from ?? '';
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [titleError, setTitleError] = useState('');

  const handleTitleChange = (value: string) => {
    const sanitizedTitle = removeEmoji(value);
    setForm(prev => ({ ...prev, title: sanitizedTitle }));

    if (sanitizedTitle.trim()) {
      setTitleError('');
    }
  };

  const handleNext = () => {
    if (!form.title.trim()) {
      setTitleError(t('vacancies.createVacancy.titleRequired'));
      return;
    }

    setTitleError('');
    // Always land on Job Requirements (first step) when leaving the title
    // form — hydration may have set currentStepIndex to the saved
    // lastActiveStep, which would otherwise skip the user forward.
    setCurrentStepIndex(0);
    onNext();
  };

  const leaveEditPage = () => {
    if (fromPath.includes('/dashboard/ats/vacancies')) {
      void navigate(-1);
    } else {
      void navigate('/dashboard/ats/vacancies');
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    SuccessToast({
      title: t('vacancyEditCancelDialog.notifications.discard.title'),
      description: t('vacancyEditCancelDialog.notifications.discard.message'),
    });
    leaveEditPage();
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 pt-7 pl-7">
          <p className="text-2xl/8 font-bold text-slate-900">
            {t('vacancies.editVacancy')}
          </p>
          {showStatusBadge && (
            <VacancyStatusBadge
              status={form.status}
              applicantCount={form.applicantCount}
            />
          )}
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
            {titleError && (
              <p className="mt-1 text-xs font-medium text-rose-500">
                {titleError}
              </p>
            )}
            <div className="mt-4 flex gap-4">
              <Button
                variant="secondary"
                className="h-12 flex-1"
                onClick={() => setShowCancelDialog(true)}
              >
                {t('vacancies.createVacancy.cancelButton')}
              </Button>
              <Button className="h-12 flex-1" onClick={handleNext}>
                {t('vacancies.createVacancy.nextButton')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <VacancyEditCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelConfirm}
      />
    </>
  );
}

function EditVacancyContent({ id }: { id: string | undefined }) {
  const { t } = useTranslation('ats');
  const location = useLocation();
  const { keycloak, initialized } = useKeycloak();
  const initialStep = (location.state as { initialStep?: string } | null)
    ?.initialStep;
  const {
    isInitialStep,
    setIsInitialStep,
    setForm,
    setCurrentStepIndex,
    initCompletedStepsFromForm,
  } = useVacancyForm();
  const isHydratedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const {
    data: vacancyResponse,
    isLoading,
    error,
  } = useVacancyByIdQuery(id || '', {
    enabled: initialized && !!keycloak?.authenticated && !!id,
  });

  useEffect(() => {
    if (
      !vacancyResponse?.success ||
      isHydratedRef.current ||
      isLoading ||
      !!error
    ) {
      return;
    }

    const vacancyCandidate = vacancyResponse.data;
    if (!isRecord(vacancyCandidate)) {
      return;
    }

    const vacancyRecord = vacancyCandidate;

    let resolvedForm: VacancyForm | undefined;
    setForm((prev: VacancyForm): VacancyForm => {
      resolvedForm = toVacancyFormFromResponse(vacancyRecord, prev);
      return resolvedForm;
    });
    if (resolvedForm) {
      initCompletedStepsFromForm(resolvedForm);
    }

    const requestedStepIndex = initialStep
      ? VACANCY_STEPS.findIndex(step => step.key === initialStep)
      : -1;
    if (requestedStepIndex >= 0) {
      // Deep link (e.g. Schedule from the toggle popup) lands on the requested step
      setCurrentStepIndex(requestedStepIndex);
      setIsInitialStep(false);
    } else if (typeof vacancyRecord.lastActiveStep === 'string') {
      const stepIndex = VACANCY_STEPS.findIndex(
        step => step.key === vacancyRecord.lastActiveStep
      );
      if (stepIndex >= 0) {
        // Preserve the last active step for in-form navigation, but always
        // open the Edit Vacancy Title form first (drafts included). The title
        // form is the entry point for editing any vacancy.
        setCurrentStepIndex(stepIndex);
      }
    }

    isHydratedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, [
    error,
    initCompletedStepsFromForm,
    initialStep,
    isLoading,
    setCurrentStepIndex,
    setForm,
    setIsInitialStep,
    vacancyResponse,
  ]);

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

  if (
    isLoading ||
    (!isHydrated && !error && vacancyResponse?.success !== false)
  ) {
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
  const { id } = useParams<'id'>();
  return (
    <VacancyFormProvider vacancyId={id}>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EditVacancyContent id={id} />
      </section>
    </VacancyFormProvider>
  );
}
