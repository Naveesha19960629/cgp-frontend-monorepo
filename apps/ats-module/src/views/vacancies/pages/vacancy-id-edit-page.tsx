import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { VacancyCreateStepperForm } from '@/views/vacancies';
import {
  VacancyEditCancelDialog,
  VacancyStatusBadge,
} from '@/views/vacancies/components';
import {
  DEFAULT_FORM,
  VacancyFormProvider,
  getEnabledStepKeys,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import {
  useVacancyApplicantWs,
  useVacancyByIdQuery,
  useVacancyTemplateByIdQuery,
  useVacancyTemplateSnapshotQuery,
} from '@/views/vacancies/hooks';
import type { VacancyForm } from '@/views/vacancies/types';
import {
  disableOptionalSections,
  toVacancyFormFromResponse,
} from '@/views/vacancies/utils/vacancy-edit-response-helpers';
import { toVacancyFormFromTemplateUsePayload } from '@/views/vacancies/utils/vacancy-template-use-helpers';

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

/** Navigator + empty body skeleton shown while the edit page loads. */
function EditNavigatorSkeleton() {
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

function EditVacancyContent({
  id,
  baseVacancyId,
}: Readonly<{ id: string | undefined; baseVacancyId: string | undefined }>) {
  const { t } = useTranslation('ats');
  const location = useLocation();
  const { keycloak, initialized } = useKeycloak();
  const initialStep = (location.state as { initialStep?: string } | null)
    ?.initialStep;
  const {
    form,
    visibleSteps,
    isInitialStep,
    setIsInitialStep,
    setForm,
    setCurrentStepIndex,
    initCompletedStepsFromForm,
    originalFormRef,
    templateId,
  } = useVacancyForm();
  const isHydratedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const {
    data: vacancyResponse,
    isLoading,
    isFetching,
    error,
  } = useVacancyByIdQuery(id || '', {
    enabled: initialized && !!keycloak?.authenticated && !!id,
  });

  // Tracked against the base (version-independent) id, matching how applicantCount accrues across versions.
  useVacancyApplicantWs({
    vacancyId: baseVacancyId ?? id,
    enabled: form.status === 'live',
  });

  useEffect(() => {
    // `isFetching` (not just `isLoading`) is the settle signal. Hydration runs
    // exactly once, so it must not run against a cached-but-revalidating
    // payload: after a status toggle the list mutation invalidates this key,
    // React Query serves the pre-toggle entry while refetching in the
    // background, and `isLoading` stays false because cached data exists.
    // Hydrating there would latch the stale status into the form and the
    // one-shot guard would then discard the fresh result (DQCGP: Edit page
    // showed "Live" for a vacancy just moved to On Hold until a full reload).
    if (
      !vacancyResponse?.success ||
      isHydratedRef.current ||
      isLoading ||
      isFetching ||
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
      // DQCGP-3840: a template-backed vacancy persists `isEnabled: true` for
      // every section the template included, even when the recruiter never
      // filled it in. Reset those to the same "off by default" state as a
      // vacancy created without a template; the recruiter re-enables via the
      // section toggle as usual.
      if (templateId) {
        resolvedForm = disableOptionalSections(resolvedForm);
      }
      return resolvedForm;
    });
    if (resolvedForm) {
      initCompletedStepsFromForm(resolvedForm);
      originalFormRef.current = resolvedForm;
    }

    const requestedStepIndex = initialStep
      ? visibleSteps.findIndex(step => step.key === initialStep)
      : -1;
    if (requestedStepIndex >= 0) {
      // Deep link (e.g. Schedule from the toggle popup) lands on the requested step
      setCurrentStepIndex(requestedStepIndex);
      setIsInitialStep(false);
    } else if (typeof vacancyRecord.lastActiveStep === 'string') {
      const stepIndex = visibleSteps.findIndex(
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
    isFetching,
    isLoading,
    originalFormRef,
    setCurrentStepIndex,
    setForm,
    setIsInitialStep,
    templateId,
    vacancyResponse,
    visibleSteps,
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
    return <EditNavigatorSkeleton />;
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
  const { keycloak, initialized } = useKeycloak();

  // Same query key as EditVacancyContent → served from cache (no extra request).
  const { data: vacancyResponse, isLoading: isVacancyLoading } =
    useVacancyByIdQuery(id || '', {
      enabled: initialized && !!keycloak?.authenticated && !!id,
    });

  const vacancyRecord = useMemo<Record<string, unknown> | undefined>(() => {
    const record = vacancyResponse?.success ? vacancyResponse.data : undefined;
    return isRecord(record) ? record : undefined;
  }, [vacancyResponse]);

  const readString = (key: string): string | undefined =>
    typeof vacancyRecord?.[key] === 'string' ? vacancyRecord[key] : undefined;

  // Only version 1 of a template-created vacancy carries `vacancyTemplateId`:
  // the backend's `createNewVersion` does not copy the column, so editing a
  // LIVE/EXPIRED/ONHOLD vacancy produces a version where it is null. Treated as
  // a hint, never as the deciding signal — see `baseVacancyId` below.
  const vacancyTemplateId = readString('vacancyTemplateId');

  // The template snapshot is written once, against version 1's id, and
  // `baseVacancyId === vacancyId` for version 1 — so the base id reaches the
  // snapshot from ANY version, whether or not that version kept the template
  // column. This is what makes the edit form survive a version bump.
  const baseVacancyId = readString('baseVacancyId') ?? id;

  // A later version may have lost `vacancyTemplateId`, so its absence does not
  // prove the vacancy is template-free. Probe the snapshot whenever the vacancy
  // is either known template-backed or is not its own base (i.e. a later
  // version, which may have been stripped). A plain first-version vacancy is
  // its own base and has no template id, so it skips the request entirely.
  const mayBeTemplateBacked =
    !!vacancyTemplateId || (!!baseVacancyId && baseVacancyId !== id);

  // For template-created vacancies the edit navigator must mirror the Use
  // Template create flow at BOTH levels: which steps show AND which fields
  // within them. The GET /vacancies/{id} payload only carries per-section
  // `isEnabled` (not per-field flags), so field visibility has to come from the
  // template definition.
  //
  // Source of truth is the SNAPSHOT taken at creation time, not the live
  // template: DQCGP-2560 AC 8 requires later template edits (and deletions) to
  // leave already-created vacancies untouched. A 404 here is a normal answer
  // meaning "not created from a template".
  const { data: snapshotResponse, isFetched: isSnapshotFetched } =
    useVacancyTemplateSnapshotQuery(baseVacancyId ?? '', {
      enabled: initialized && !!keycloak?.authenticated && mayBeTemplateBacked,
    });

  const snapshotRequestBody = snapshotResponse?.success
    ? snapshotResponse.data?.requestBody
    : undefined;

  // The snapshot carries the template id, so lineage is recoverable even when
  // the vacancy row itself lost it.
  const resolvedTemplateId =
    vacancyTemplateId ??
    (typeof snapshotRequestBody?.templateId === 'string'
      ? snapshotRequestBody.templateId
      : undefined);

  // Legacy fallback: vacancies created before snapshotting existed have no
  // snapshot row (404). Only then do we read the live template — better a
  // possibly-drifted definition than an unrestricted form.
  const needsLiveTemplateFallback =
    !!resolvedTemplateId && isSnapshotFetched && !snapshotRequestBody;

  const { data: templateResponse, isFetched: isTemplateFetched } =
    useVacancyTemplateByIdQuery(resolvedTemplateId ?? '', {
      enabled:
        initialized && !!keycloak?.authenticated && needsLiveTemplateFallback,
    });

  const templateMapped = useMemo(() => {
    const liveRequestBody = templateResponse?.success
      ? templateResponse.data?.requestBody
      : undefined;
    const requestBody = snapshotRequestBody ?? liveRequestBody;
    return requestBody
      ? toVacancyFormFromTemplateUsePayload(requestBody, DEFAULT_FORM)
      : undefined;
  }, [snapshotRequestBody, templateResponse]);

  // Last-resort step list, for a template-backed vacancy whose definition is
  // unreachable (pre-snapshot row and a deleted template). Reconstructed from
  // the saved vacancy's enabled sections, so it cannot list a section the
  // recruiter has disabled — good enough to keep the navigator restricted, but
  // always outranked by the snapshot above.
  const inferredVisibleStepKeys = useMemo<string[] | undefined>(() => {
    if (!vacancyRecord?.vacancyTemplateId) {
      return undefined;
    }
    return getEnabledStepKeys(
      toVacancyFormFromResponse(vacancyRecord, DEFAULT_FORM)
    );
  }, [vacancyRecord]);

  // Hold the provider until the vacancy and (for templated ones) its template
  // definition are ready, so step + field restrictions are correct on first
  // paint and the provider mounts exactly once. Without this the form would
  // briefly render unrestricted.
  // `isFetched` (not `isLoading`) is the settle signal: it flips true on both
  // success and 404, and stays false across the render where the query is first
  // enabled but has not started fetching — the window `isLoading` would miss.
  const isTemplateDefinitionPending =
    mayBeTemplateBacked &&
    (!isSnapshotFetched || (needsLiveTemplateFallback && !isTemplateFetched));

  if (isVacancyLoading || isTemplateDefinitionPending) {
    return <EditNavigatorSkeleton />;
  }

  // Prefer the template's authoritative step list; fall back to inference.
  const visibleStepKeys =
    templateMapped?.visibleStepKeys ?? inferredVisibleStepKeys;

  return (
    <VacancyFormProvider
      vacancyId={id}
      visibleStepKeys={visibleStepKeys}
      templateFieldVisibility={templateMapped?.templateFieldVisibility}
      templateId={resolvedTemplateId}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EditVacancyContent id={id} baseVacancyId={baseVacancyId} />
      </section>
    </VacancyFormProvider>
  );
}
