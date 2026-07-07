import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  useAddAwardingBodyMutation,
  useAddBatchMutation,
  useAddCareerPathMutation,
  useAddDepartmentMutation,
  useAddDisciplineMutation,
  useAddExaminationMutation,
  useAddFacultyMutation,
  useAddFieldOfStudyMutation,
  useAddJobTitleMutation,
  useAddLevelOfQualificationMutation,
  useAddLicenseCertificateMutation,
  useAddQualificationMutation,
  useAddRoleMutation,
  useAddSchoolMutation,
  useAddSpecializationMutation,
  useAddTertiaryAwardingBodyMutation,
  useCreateCareerPathMutation,
  useCreateCauseMutation,
  useCreateHobbyMutation,
  useCreateIndustryMutation,
  useCreateLanguageMutation,
  useCreateOrganizationMutation,
  useCreateSkillCareerPathMutation,
  useCreateSocietyMutation,
  useCreateSportLevelMutation,
  useCreateSportMutation,
  useCreateVacancyMutation,
  useUpdateDraftVacancyMutation,
} from '@/views/vacancies/hooks';
import type { VacancyForm, VacancyStep } from '@/views/vacancies/types';
import {
  MANDATORY_TEMPLATE_STEP_KEYS,
  resolveDraftUserCreatedEntries,
} from '@/views/vacancies/utils';

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
    label: 'Project Requirements',
    component: ProjectsRequirementsStep,
  },
  {
    key: 'preferred-publications',
    label: 'Preferred Publications',
    component: PreferredPublicationsStep,
  },
  {
    key: 'preferred-club-societies',
    label: 'Preferred Clubs & Societies',
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
  /**
   * The steps shown in the navigator. Equals `VACANCY_STEPS` in the normal
   * create/edit flow; a filtered subset in the "Use Template" flow. All
   * index-based step logic (currentStepIndex, completedSteps) is keyed off this.
   */
  visibleSteps: readonly VacancyStep[];
  /**
   * When set (Use Template flow), maps a backend section key to the field codes
   * that are visible. Undefined in the normal flow (all fields visible).
   */
  templateFieldVisibility?: Record<string, Record<string, boolean>>;
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  completedSteps: Set<number>;
  removeCompletedStep: (index: number) => void;
  initCompletedStepsFromForm: (loadedForm: VacancyForm) => void;
  isInitialStep: boolean;
  setIsInitialStep: (val: boolean) => void;
  onNext: (data?: Partial<VacancyForm>, completed?: boolean) => void;
  onBack: () => void;
  onCancel: () => void;
  lockCancelDialog: () => void;
  onSubmit: () => void;
  OnSaveAsDraft: () => void;
  resolveFormUserCreatedEntries: (form: VacancyForm) => Promise<VacancyForm>;
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
  isJobRequirementsFormValid: boolean;
  setIsJobRequirementsFormValid: React.Dispatch<React.SetStateAction<boolean>>;
}

const VacancyFormContext = createContext<VacancyFormContextValue | null>(null);

function VacancyFormProvider({
  children,
  vacancyId,
  visibleStepKeys,
  templateFieldVisibility,
  templateId,
}: {
  children: React.ReactNode;
  vacancyId?: string;
  /** When provided (Use Template flow), restricts the navigator to these step keys
   * (mandatory steps are always included). Absent → full `VACANCY_STEPS`. */
  visibleStepKeys?: string[];
  /** Per-section field visibility for the Use Template flow. */
  templateFieldVisibility?: Record<string, Record<string, boolean>>;
  /** Source template id, echoed to the backend on create for lineage. */
  templateId?: string;
}) {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { mutateAsync: createVacancy } = useCreateVacancyMutation();
  const { mutateAsync: updateDraftVacancy } = useUpdateDraftVacancyMutation();
  const { mutateAsync: addDiscipline } = useAddDisciplineMutation();
  const { mutateAsync: addCareerPath } = useAddCareerPathMutation();
  const { mutateAsync: addRole } = useAddRoleMutation();
  const { mutateAsync: addJobTitle } = useAddJobTitleMutation();
  const { mutateAsync: createIndustry } = useCreateIndustryMutation();
  const { mutateAsync: createOrganization } = useCreateOrganizationMutation();
  const { mutateAsync: createCause } = useCreateCauseMutation();
  const { mutateAsync: createHobby } = useCreateHobbyMutation();
  const { mutateAsync: createLanguage } = useCreateLanguageMutation();
  const { mutateAsync: createSociety } = useCreateSocietyMutation();
  const { mutateAsync: createSport } = useCreateSportMutation();
  const { mutateAsync: createSportLevel } = useCreateSportLevelMutation();
  const { mutateAsync: createCareerPath } = useCreateCareerPathMutation();
  const { mutateAsync: createSkillCareerPath } =
    useCreateSkillCareerPathMutation();
  const { mutateAsync: addLicenseCertificate } =
    useAddLicenseCertificateMutation();
  const { mutateAsync: addSchool } = useAddSchoolMutation();
  const { mutateAsync: addTertiaryAwardingBody } =
    useAddTertiaryAwardingBodyMutation();
  const { mutateAsync: addExamination } = useAddExaminationMutation();
  const { mutateAsync: addSecondaryAwardingBody } =
    useAddAwardingBodyMutation();
  const { mutateAsync: addFieldOfStudy } = useAddFieldOfStudyMutation();
  const { mutateAsync: addQualification } = useAddQualificationMutation();
  const { mutateAsync: addLevelOfQualification } =
    useAddLevelOfQualificationMutation();
  const { mutateAsync: addSpecialization } = useAddSpecializationMutation();
  const { mutateAsync: addBatch } = useAddBatchMutation();
  const { mutateAsync: addDepartment } = useAddDepartmentMutation();
  const { mutateAsync: addFaculty } = useAddFacultyMutation();
  const [form, setForm] = useState<VacancyForm>(DEFAULT_FORM);
  const [currentStepIndex, _setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isInitialStep, setIsInitialStep] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [stepGuard, setStepGuard] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isJobRequirementsFormValid, setIsJobRequirementsFormValid] = useState(
    () => Boolean(vacancyId)
  );
  const stepPersistRef = useRef<(() => void) | null>(null);
  const stepDisableRef = useRef<(() => void) | null>(null);
  const stepDraftSaveRef = useRef<
    (() => Promise<Partial<VacancyForm> | null>) | null
  >(null);
  const cancelLockRef = useRef(false);

  // In the normal flow `visibleSteps === VACANCY_STEPS`. In the Use Template flow
  // it is the master list filtered to the template's sections (mandatory steps
  // always kept), preserving master order. All index-based step logic keys off this.
  const visibleSteps = useMemo<readonly VacancyStep[]>(() => {
    if (!visibleStepKeys) return VACANCY_STEPS;
    const allowed = new Set<string>([
      ...MANDATORY_TEMPLATE_STEP_KEYS,
      ...visibleStepKeys,
    ]);
    return VACANCY_STEPS.filter(step => allowed.has(step.key));
  }, [visibleStepKeys]);

  const setCurrentStepIndex = (index: number) => {
    _setCurrentStepIndex(index);
    setForm(prev => ({ ...prev, lastActiveStep: visibleSteps[index].key }));
    setStepGuard(false);
  };

  const removeCompletedStep = (index: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const initCompletedStepsFromForm = (loadedForm: VacancyForm) => {
    // Keyed by step key (not position) so it stays correct when `visibleSteps` is
    // a filtered subset in the Use Template flow.
    const stepEnabledChecks: Record<string, () => boolean> = {
      'job-requirements': () =>
        loadedForm.jobRequirements.length > 0 &&
        loadedForm.jobRequirements[0].isEnabled,
      'profile-requirements': () => loadedForm.profileRequirements.isEnabled,
      'secondary-education': () =>
        loadedForm.secondaryEducation.length > 0 &&
        loadedForm.secondaryEducation[0].isEnabled,
      'tertiary-education': () =>
        loadedForm.tertiaryEducation.length > 0 &&
        loadedForm.tertiaryEducation[0].isEnabled,
      'projects-requirements': () =>
        Boolean(loadedForm.projectsRequirements?.isEnabled),
      'preferred-publications': () =>
        Boolean(loadedForm.preferredPublications?.isEnabled),
      'preferred-club-societies': () =>
        Boolean(loadedForm.preferredClubSocieties?.isEnabled),
      'preferred-sports': () => Boolean(loadedForm.preferredSports?.isEnabled),
      'preferred-volunteering': () =>
        Boolean(loadedForm.preferredVolunteering?.isEnabled),
      'preferred-patents': () => Boolean(loadedForm.patents?.isEnabled),
      'preferred-honours-awards': () =>
        Boolean(loadedForm.preferredHonoursAwards?.isEnabled),
      'license-certificates': () =>
        (loadedForm.licenseCertificates?.length ?? 0) > 0 &&
        Boolean(loadedForm.licenseCertificates?.[0]?.isEnabled),
      'preferred-skills': () => Boolean(loadedForm.preferredSkills?.isEnabled),
      'preferred-languages': () =>
        Boolean(loadedForm.preferredLanguages?.isEnabled),
      'preferred-causes': () => Boolean(loadedForm.preferredCauses?.isEnabled),
      'preferred-hobbies': () =>
        Boolean(loadedForm.preferredHobbies?.isEnabled),
      'preferred-industry': () =>
        Boolean(loadedForm.preferredIndustries?.isEnabled),
      'customizable-form': () =>
        Boolean(loadedForm.customizableForm?.isEnabled),
      'schedule-vacancy': () => loadedForm.schedule !== undefined,
    };

    const completed = new Set<number>();
    visibleSteps.forEach((step, index) => {
      if (stepEnabledChecks[step.key]?.()) completed.add(index);
    });
    setCompletedSteps(completed);
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
    if (data) {
      setForm(prev => ({ ...prev, ...data }));
    }
    if (isInitialStep) {
      setIsInitialStep(false);
      return;
    }
    if (currentStepIndex < visibleSteps.length - 1) {
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

  const resolveFormUserCreatedEntries = (formToResolve: VacancyForm) =>
    resolveDraftUserCreatedEntries(formToResolve, {
      addDiscipline,
      addCareerPath,
      addRole,
      addJobTitle,
      createIndustry,
      createOrganization,
      createCause,
      createHobby,
      createLanguage,
      createSociety,
      createSport,
      createSportLevel,
      createCareerPath,
      createSkillCareerPath,
      addLicenseCertificate,
      addSchool,
      addTertiaryAwardingBody,
      addExamination,
      addSecondaryAwardingBody,
      addFieldOfStudy,
      addQualification,
      addLevelOfQualification,
      addSpecialization,
      addBatch,
      addDepartment,
      addFaculty,
    });

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

        draftForm = await resolveFormUserCreatedEntries(draftForm);
        setForm(draftForm);

        if (vacancyId) {
          await updateDraftVacancy({
            id: vacancyId,
            form: draftForm,
            status: 'DRAFT',
          });
        } else {
          await createVacancy({ form: draftForm, status: 'DRAFT', templateId });
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
        visibleSteps,
        templateFieldVisibility,
        currentStepIndex,
        setCurrentStepIndex,
        completedSteps,
        removeCompletedStep,
        initCompletedStepsFromForm,
        isInitialStep,
        setIsInitialStep,
        onNext,
        onBack,
        onCancel,
        lockCancelDialog,
        onSubmit,
        OnSaveAsDraft,
        resolveFormUserCreatedEntries,
        isSavingDraft,
        showCancelDialog,
        setShowCancelDialog,
        stepGuard,
        setStepGuard,
        stepPersistRef,
        stepDisableRef,
        stepDraftSaveRef,
        isJobRequirementsFormValid,
        setIsJobRequirementsFormValid,
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

/**
 * Returns a `(fieldCode) => boolean` predicate for a template section key.
 * Normal create/edit flow: always `true` (every field renders). Use Template
 * flow: only fields the template configured (content boolean true) are visible.
 * Field codes match `TEMPLATE_SECTIONS` in vacancy-template-config.ts.
 */
function useTemplateFieldVisible(
  sectionKey: string
): (fieldCode: string) => boolean {
  const { templateFieldVisibility } = useVacancyForm();
  const sectionMap = templateFieldVisibility?.[sectionKey];
  return (fieldCode: string) =>
    sectionMap ? Boolean(sectionMap[fieldCode]) : true;
}

export {
  VacancyFormProvider,
  useVacancyForm,
  useTemplateFieldVisible,
  VACANCY_STEPS,
  DEFAULT_FORM,
};
