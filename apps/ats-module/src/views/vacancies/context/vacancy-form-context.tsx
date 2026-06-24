import React, { createContext, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  CustomizableFormStep,
  JobRequirementsStep,
  LicenseCertificatesStep,
  PreferredCausesStep,
  PreferredClubSocietiesStep,
  PreferredHobbiesStep,
  PreferredHonoursAwardsStep,
  PreferredIndustryStep,
  PreferredLanguagesStep,
  PreferredPatentsStep,
  PreferredPublicationsStep,
  PreferredSkillsStep,
  PreferredSportsStep,
  PreferredVolunteeringStep,
  ProfileRequirementsStep,
  ProjectsRequirementsStep,
  ScheduleVacancyStep,
  SecondaryEducationStep,
  TertiaryEducationStep,
} from '@/views/vacancies';
import {
  useCreateVacancyMutation,
  useUpdateDraftVacancyMutation,
} from '@/views/vacancies/hooks';
import type { VacancyForm, VacancyStep } from '@/views/vacancies/types';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';

const VACANCY_STEPS: readonly VacancyStep[] = [
  {
    key: 'job-requirements',
    label: 'Job Requirements',
    component: JobRequirementsStep,
  },
  {
    key: 'profile-requirements',
    label: 'Profile Requirements',
    component: ProfileRequirementsStep,
  },
  {
    key: 'secondary-education',
    label: 'Secondary Education',
    component: SecondaryEducationStep,
  },
  {
    key: 'tertiary-education',
    label: 'Tertiary Education',
    component: TertiaryEducationStep,
  },
  {
    key: 'projects-requirements',
    label: 'Projects Requirements',
    component: ProjectsRequirementsStep,
  },
  {
    key: 'preferred-publications',
    label: 'Preferred Publications',
    component: PreferredPublicationsStep,
  },
  {
    key: 'preferred-club-societies',
    label: 'Preferred Club & Societies',
    component: PreferredClubSocietiesStep,
  },
  {
    key: 'preferred-sports',
    label: 'Preferred Sports',
    component: PreferredSportsStep,
  },
  {
    key: 'preferred-volunteering',
    label: 'Preferred Volunteering',
    component: PreferredVolunteeringStep,
  },
  {
    key: 'preferred-patents',
    label: 'Preferred Patents',
    component: PreferredPatentsStep,
  },
  {
    key: 'preferred-honours-awards',
    label: 'Preferred Honours and Awards',
    component: PreferredHonoursAwardsStep,
  },
  {
    key: 'license-certificates',
    label: 'License and Certificates',
    component: LicenseCertificatesStep,
  },
  {
    key: 'preferred-skills',
    label: 'Preferred Skills',
    component: PreferredSkillsStep,
  },
  {
    key: 'preferred-languages',
    label: 'Preferred Languages',
    component: PreferredLanguagesStep,
  },
  {
    key: 'preferred-causes',
    label: 'Preferred Causes',
    component: PreferredCausesStep,
  },
  {
    key: 'preferred-hobbies',
    label: 'Preferred Hobbies',
    component: PreferredHobbiesStep,
  },
  {
    key: 'preferred-industry',
    label: 'Preferred Industry',
    component: PreferredIndustryStep,
  },
  {
    key: 'customizable-form',
    label: 'Customizable Form',
    component: CustomizableFormStep,
  },
  {
    key: 'schedule-vacancy',
    label: 'Schedule Vacancy',
    component: ScheduleVacancyStep,
  },
];

const DEFAULT_FORM: VacancyForm = {
  title: '',
  status: 'draft',
  lastActiveStep: VACANCY_STEPS[0].key,
  jobRequirements: [
    {
      isEnabled: true,
      dataTakenFromCandidate: false,
      discipline: [],
      careerPath: [],
      level: [],
      role: [],
      jobTitle: [],
      employmentType: [],
      workSchedule: [],
      engagementModel: [],
      description: '',
    },
  ],
  profileRequirements: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    gender: { id: '', label: '' },
    maritalStatus: { id: '', label: '' },
    addresses: [],
  },
  secondaryEducation: [
    { isEnabled: false, dataTakenFromCandidate: false, content: [] },
  ],
  tertiaryEducation: [
    { isEnabled: false, dataTakenFromCandidate: false, content: [] },
  ],
  projectsRequirements: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    projects: [],
  },
  preferredPublications: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    publications: [],
  },
  preferredClubSocieties: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    clubSocieties: [],
  },
  preferredSports: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    sports: [],
  },
  preferredVolunteering: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    volunteering: [],
  },
  patents: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    patents: [],
  },
  preferredHonoursAwards: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    honoursAndAwards: [],
  },
  licenseCertificates: [
    { isEnabled: false, dataTakenFromCandidate: false, content: [] },
  ],
  preferredSkills: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    skills: [],
  },
  preferredLanguages: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    languages: [],
  },
  preferredCauses: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    causes: [],
  },
  preferredHobbies: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    hobbies: [],
  },
  preferredIndustries: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    industries: [],
  },
  customizableForm: {
    isEnabled: false,
    sectionTitle: '',
    forms: [],
  },
  schedule: undefined,
};

interface VacancyFormContextValue {
  form: VacancyForm;
  setForm: React.Dispatch<React.SetStateAction<VacancyForm>>;
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  completedSteps: Set<number>;
  removeCompletedStep: (index: number) => void;
  isInitialStep: boolean;
  setIsInitialStep: (val: boolean) => void;
  onNext: (data?: Partial<VacancyForm>, completed?: boolean) => void;
  onBack: () => void;
  onCancel: () => void;
  lockCancelDialog: () => void;
  onSubmit: () => void;
  OnSaveAsDraft: () => void;
  isSavingDraft: boolean;
  showCancelDialog: boolean;
  setShowCancelDialog: (open: boolean) => void;
  stepGuard: boolean;
  setStepGuard: (guard: boolean) => void;
  stepPersistRef: React.MutableRefObject<(() => void) | null>;
  stepDisableRef: React.MutableRefObject<(() => void) | null>;
  stepDraftSaveRef: React.MutableRefObject<
    (() => Promise<Partial<VacancyForm> | null>) | null
  >;
}

const VacancyFormContext = createContext<VacancyFormContextValue | null>(null);

function VacancyFormProvider({
  children,
  vacancyId,
}: {
  children: React.ReactNode;
  vacancyId?: string;
}) {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { mutateAsync: createVacancy } = useCreateVacancyMutation();
  const { mutateAsync: updateDraftVacancy } = useUpdateDraftVacancyMutation();
  const [form, setForm] = useState<VacancyForm>(DEFAULT_FORM);
  const [currentStepIndex, _setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isInitialStep, setIsInitialStep] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [stepGuard, setStepGuard] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const stepPersistRef = useRef<(() => void) | null>(null);
  const stepDisableRef = useRef<(() => void) | null>(null);
  const stepDraftSaveRef = useRef<
    (() => Promise<Partial<VacancyForm> | null>) | null
  >(null);
  const cancelLockRef = useRef(false);

  const setCurrentStepIndex = (index: number) => {
    _setCurrentStepIndex(index);
    setForm(prev => ({ ...prev, lastActiveStep: VACANCY_STEPS[index].key }));
    setStepGuard(false);
  };

  const removeCompletedStep = (index: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const isStepEnabled = (
    data?: Partial<VacancyForm>,
    completed?: boolean
  ): boolean => {
    if (completed !== undefined) return completed;
    if (!data) return false;
    return Object.values(data).some(val => {
      if (Array.isArray(val))
        return val.length > 0 && Boolean(val[0]?.isEnabled);
      if (val !== null && typeof val === 'object' && 'isEnabled' in val)
        return Boolean((val as { isEnabled?: unknown }).isEnabled);
      return false;
    });
  };

  const onNext = (data?: Partial<VacancyForm>, completed?: boolean) => {
    const stepKey =
      VACANCY_STEPS[currentStepIndex]?.key ?? `step-${currentStepIndex}`;
    console.group(`[Vacancy Wizard] Step payload — ${stepKey}`);
    console.log('Step data:', data);
    console.log('Full form after merge:', data ? { ...form, ...data } : form);
    console.groupEnd();
    if (data) {
      setForm(prev => ({ ...prev, ...data }));
    }
    if (isInitialStep) {
      setIsInitialStep(false);
      return;
    }
    if (currentStepIndex < VACANCY_STEPS.length - 1) {
      const shouldComplete =
        currentStepIndex === 0 || isStepEnabled(data, completed);
      if (shouldComplete) {
        setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
      } else if (currentStepIndex !== 0) {
        removeCompletedStep(currentStepIndex);
      }
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const onBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      setIsInitialStep(true);
    }
  };

  const lockCancelDialog = () => {
    cancelLockRef.current = true;
  };

  const onCancel = () => {
    if (cancelLockRef.current) return;
    stepPersistRef.current?.();
    setShowCancelDialog(true);
  };

  const onSubmit = () => {
    // TODO: submit form
  };

  const OnSaveAsDraft = () => {
    void (async () => {
      setIsSavingDraft(true);
      try {
        let draftForm = form;

        if (stepDraftSaveRef.current) {
          const stepValues = await stepDraftSaveRef.current();
          if (!stepValues) {
            setShowCancelDialog(false);
            return;
          }
          draftForm = { ...form, ...stepValues };
        }

        if (vacancyId) {
          await updateDraftVacancy({
            id: vacancyId,
            form: draftForm,
            status: 'DRAFT',
          });
        } else {
          await createVacancy({ form: draftForm, status: 'DRAFT' });
        }
        SuccessToast({
          title: t('vacancyCancelDialog.notifications.saveAsDraft.title'),
          description: t(
            'vacancyCancelDialog.notifications.saveAsDraft.message'
          ),
        });
        void navigate('/dashboard/ats/vacancies');
      } catch {
        ErrorToast({
          title: t('vacancyCancelDialog.notifications.saveAsDraft.errorTitle'),
          description: t(
            'vacancyCancelDialog.notifications.saveAsDraft.errorMessage'
          ),
        });
      } finally {
        setIsSavingDraft(false);
      }
    })();
  };

  return (
    <VacancyFormContext.Provider
      value={{
        form,
        setForm,
        currentStepIndex,
        setCurrentStepIndex,
        completedSteps,
        removeCompletedStep,
        isInitialStep,
        setIsInitialStep,
        onNext,
        onBack,
        onCancel,
        lockCancelDialog,
        onSubmit,
        OnSaveAsDraft,
        isSavingDraft,
        showCancelDialog,
        setShowCancelDialog,
        stepGuard,
        setStepGuard,
        stepPersistRef,
        stepDisableRef,
        stepDraftSaveRef,
      }}
    >
      {children}
    </VacancyFormContext.Provider>
  );
}

function useVacancyForm() {
  const context = useContext(VacancyFormContext);
  if (!context) {
    throw new Error('useVacancyForm must be used within VacancyFormProvider');
  }
  return context;
}

export { VacancyFormProvider, useVacancyForm, VACANCY_STEPS };
