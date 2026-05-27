import React, { createContext, useContext, useState } from 'react';

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
import type { VacancyForm, VacancyStep } from '@/views/vacancies/types';

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
  jobRequirements: [],
  profileRequirements: [],
  secondaryEducation: [
    { isEnabled: false, dataTakenFromCandidate: false, content: [] },
  ],
  tertiaryEducation: [
    { isEnabled: false, dataTakenFromCandidate: false, content: [] },
  ],
  patents: {
    isEnabled: false,
    dataTakenFromCandidate: false,
    patents: [],
  },
};

interface VacancyFormContextValue {
  form: VacancyForm;
  setForm: React.Dispatch<React.SetStateAction<VacancyForm>>;
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  completedSteps: Set<number>;
  isInitialStep: boolean;
  onNext: (data?: Partial<VacancyForm>) => void;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const VacancyFormContext = createContext<VacancyFormContextValue | null>(null);

function VacancyFormProvider({ children }: { children: React.ReactNode }) {
  const [form, setForm] = useState<VacancyForm>(DEFAULT_FORM);
  const [currentStepIndex, _setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isInitialStep, setIsInitialStep] = useState(true);

  const setCurrentStepIndex = (index: number) => {
    _setCurrentStepIndex(index);
    setForm(prev => ({ ...prev, lastActiveStep: VACANCY_STEPS[index].key }));
  };

  const onNext = (data?: Partial<VacancyForm>) => {
    console.log(data);
    if (data) {
      setForm(prev => ({ ...prev, ...data }));
    }
    if (isInitialStep) {
      setIsInitialStep(false);
      return;
    }
    if (currentStepIndex < VACANCY_STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
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

  const onCancel = () => {
    // TODO: save as draft and navigate away
  };

  const onSubmit = () => {
    // TODO: submit form
  };

  return (
    <VacancyFormContext.Provider
      value={{
        form,
        setForm,
        currentStepIndex,
        setCurrentStepIndex,
        completedSteps,
        isInitialStep,
        onNext,
        onBack,
        onCancel,
        onSubmit,
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
