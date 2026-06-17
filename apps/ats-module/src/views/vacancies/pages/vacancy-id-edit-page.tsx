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
import type {
  LicenseCertificates,
  PreferredIndustries,
  SecondaryEducation,
  TertiaryEducation,
  VacancyForm,
} from '@/views/vacancies/types';

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

function getRecordLabel(value: unknown): string {
  if (!isRecord(value)) {
    return '';
  }

  if (typeof value.name === 'string' && value.name.trim().length > 0) {
    return value.name;
  }

  if (typeof value.label === 'string' && value.label.trim().length > 0) {
    return value.label;
  }

  if (typeof value.id === 'string') {
    return value.id;
  }

  return '';
}

// Normalise a single { source, id, label|name } API ref to { source, id, name }
function normalizeRef(item: unknown): {
  source: 'MASTER' | 'PENDING';
  id: string;
  name?: string;
} {
  if (!isRecord(item)) return { source: 'MASTER', id: '' };
  return {
    source:
      item.source === 'MASTER' || item.source === 'PENDING'
        ? item.source
        : 'MASTER',
    id: typeof item.id === 'string' ? item.id : '',
    name:
      (typeof item.name === 'string' && item.name) ||
      (typeof item.label === 'string' && item.label) ||
      undefined,
  };
}

function normalizeRefArray(raw: unknown): ReturnType<typeof normalizeRef>[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeRef).filter(r => r.id !== '');
}

// GET: { isEnabled, dataTakenFromCandidate, industries: [{ source, id, label }] }
// Form: PreferredIndustries = { isEnabled, dataTakenFromCandidate, industries: IndustryEntry[] }
function normalizePreferredIndustries(
  value: unknown
): PreferredIndustries | undefined {
  if (!isRecord(value)) return undefined;

  const rawItems = Array.isArray(value.industries)
    ? value.industries
    : Array.isArray(value.content)
      ? value.content
      : [];

  const industries = rawItems
    .filter(isRecord)
    .map(item => ({
      id: typeof item.id === 'string' ? item.id : '',
      label: getRecordLabel(item),
      source: typeof item.source === 'string' ? item.source : 'MASTER',
    }))
    .filter(item => item.id.length > 0);

  return {
    isEnabled: Boolean(value.isEnabled),
    dataTakenFromCandidate: Boolean(value.dataTakenFromCandidate),
    industries,
  };
}

// GET: { isEnabled, dataTakenFromCandidate, licensesAndCertifications: [...] }
// Form: LicenseCertificates[] = [{ isEnabled, dataTakenFromCandidate, content: [...] }]
function extractLicenseCertContent(
  value: Record<string, unknown>
): LicenseCertificates['content'] {
  const items = Array.isArray(value.content)
    ? value.content
    : Array.isArray(value.licensesAndCertifications)
      ? value.licensesAndCertifications
      : [];
  return items as LicenseCertificates['content'];
}

function normalizeLicenseCertificates(
  value: unknown
): LicenseCertificates[] | undefined {
  if (Array.isArray(value)) {
    const groups = value
      .filter(isRecord)
      .filter(
        v =>
          typeof v.isEnabled === 'boolean' ||
          typeof v.dataTakenFromCandidate === 'boolean'
      )
      .map(v => ({
        isEnabled: Boolean(v.isEnabled),
        dataTakenFromCandidate: Boolean(v.dataTakenFromCandidate),
        content: extractLicenseCertContent(v),
      }));
    return groups.length > 0 ? groups : undefined;
  }

  if (
    isRecord(value) &&
    (typeof value.isEnabled === 'boolean' ||
      typeof value.dataTakenFromCandidate === 'boolean')
  ) {
    return [
      {
        isEnabled: Boolean(value.isEnabled),
        dataTakenFromCandidate: Boolean(value.dataTakenFromCandidate),
        content: extractLicenseCertContent(value),
      },
    ];
  }

  return undefined;
}

// GET: { isEnabled, dataTakenFromCandidate, secondaryEducation: [...entries] }
// Form: SecondaryEducation[] = [{ isEnabled, dataTakenFromCandidate, content: [...entries] }]
function normalizeSecondaryEducation(
  value: unknown
): SecondaryEducation[] | undefined {
  if (
    Array.isArray(value) &&
    (value.length === 0 ||
      (isRecord(value[0]) && Array.isArray(value[0].content)))
  ) {
    return value as SecondaryEducation[];
  }

  if (!isRecord(value)) return undefined;

  const items = Array.isArray(value.secondaryEducation)
    ? value.secondaryEducation
    : Array.isArray(value.content)
      ? value.content
      : [];

  return [
    {
      isEnabled: Boolean(value.isEnabled),
      dataTakenFromCandidate: Boolean(value.dataTakenFromCandidate),
      content: items.filter(isRecord).map(entry => ({
        acceptsHomeSchooling: Boolean(entry.acceptsHomeSchooling),
        grade: typeof entry.grade === 'string' ? entry.grade : '',
        startDate: typeof entry.startDate === 'string' ? entry.startDate : '',
        endDate: typeof entry.endDate === 'string' ? entry.endDate : '',
        result: typeof entry.result === 'string' ? entry.result : '',
        schools: normalizeRefArray(entry.schools),
        schoolLocations: normalizeRefArray(entry.schoolLocations),
        examinations: normalizeRefArray(entry.examinations),
        secondaryAwardingBody: normalizeRefArray(entry.secondaryAwardingBody),
        fieldsOfStudy: normalizeRefArray(entry.fieldsOfStudy),
      })),
    },
  ];
}

// GET: { isEnabled, dataTakenFromCandidate, tertiaryEducation: [...entries] }
// Form: TertiaryEducation[] = [{ isEnabled, dataTakenFromCandidate, content: [...entries] }]
function normalizeTertiaryEducation(
  value: unknown
): TertiaryEducation[] | undefined {
  if (
    Array.isArray(value) &&
    (value.length === 0 ||
      (isRecord(value[0]) && Array.isArray(value[0].content)))
  ) {
    return value as TertiaryEducation[];
  }

  if (!isRecord(value)) return undefined;

  const items = Array.isArray(value.tertiaryEducation)
    ? value.tertiaryEducation
    : Array.isArray(value.content)
      ? value.content
      : [];

  return [
    {
      isEnabled: Boolean(value.isEnabled),
      dataTakenFromCandidate: Boolean(value.dataTakenFromCandidate),
      content: items.filter(isRecord).map(entry => ({
        grade: typeof entry.grade === 'string' ? entry.grade : '',
        qualificationName: normalizeRefArray(entry.qualificationName),
        tertiaryAwardingBody: normalizeRefArray(entry.tertiaryAwardingBody),
        tertiaryAwardingBodyLocations: normalizeRefArray(
          entry.tertiaryAwardingBodyLocations
        ),
        levelOfQualification: normalizeRefArray(entry.levelOfQualification),
        specialization: normalizeRefArray(entry.specialization),
        studyMode: normalizeRefArray(entry.studyMode),
        studyPattern: normalizeRefArray(entry.studyPattern),
        deliverySchedule: normalizeRefArray(entry.deliverySchedule),
        batch: normalizeRefArray(entry.batch),
        department: normalizeRefArray(entry.department),
        faculty: normalizeRefArray(entry.faculty),
      })),
    },
  ];
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
    const normalizedTitle = [
      vacancyRecord.title,
      vacancyRecord.vacancyTitle,
      vacancyRecord.vacancy_name,
      vacancyRecord.name,
    ].find(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0
    );

    const apiDataRecord = isRecord(vacancyRecord.data)
      ? vacancyRecord.data
      : vacancyRecord;

    const incomingForm = {
      ...(vacancyRecord as Partial<VacancyForm>),
      ...(apiDataRecord as Partial<VacancyForm>),
    };

    // ── Normalize each section from GET shape → form shape ─────────────────
    const normalizedPreferredIndustries =
      incomingForm.preferredIndustries ??
      normalizePreferredIndustries(apiDataRecord.industry) ??
      normalizePreferredIndustries(vacancyRecord.industry);

    const normalizedLicenseCertificates =
      normalizeLicenseCertificates(incomingForm.licenseCertificates) ??
      normalizeLicenseCertificates(apiDataRecord.licensesAndCertifications) ??
      normalizeLicenseCertificates(vacancyRecord.licensesAndCertifications);

    // GET wraps these as objects; form needs arrays with 'content' key.
    const normalizedSecondaryEducation = normalizeSecondaryEducation(
      vacancyRecord.secondaryEducation
    );

    const normalizedTertiaryEducation = normalizeTertiaryEducation(
      vacancyRecord.tertiaryEducation
    );

    // GET uses 'scheduleRequirement'; form uses 'schedule'.
    const normalizedSchedule = isRecord(vacancyRecord.scheduleRequirement)
      ? (vacancyRecord.scheduleRequirement as unknown as VacancyForm['schedule'])
      : incomingForm.schedule;

    setForm(prev => ({
      ...prev,
      ...incomingForm,
      preferredIndustries:
        normalizedPreferredIndustries ?? prev.preferredIndustries,
      licenseCertificates:
        normalizedLicenseCertificates ?? prev.licenseCertificates,
      secondaryEducation:
        normalizedSecondaryEducation ?? prev.secondaryEducation,
      tertiaryEducation: normalizedTertiaryEducation ?? prev.tertiaryEducation,
      schedule: normalizedSchedule ?? prev.schedule,
      title:
        (typeof incomingForm.title === 'string' && incomingForm.title.trim()) ||
        !normalizedTitle
          ? (incomingForm.title ?? prev.title)
          : normalizedTitle,
    }));

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
