import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyCreateStepperForm from '@/views/vacancies/components/vacancy-create-stepper-form';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null, pathname: '/' }),
}));

const setCurrentStepIndex = vi.fn();
const onNext = vi.fn();
const onBack = vi.fn();
const onSubmit = vi.fn();

const { mockContext, mockSuccessToast, mockStepDisable, mockRemoveCompleted } =
  vi.hoisted(() => ({
    mockContext: { currentStepIndex: 0, stepGuard: false },
    mockSuccessToast: vi.fn(),
    mockStepDisable: vi.fn(),
    mockRemoveCompleted: vi.fn(),
  }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { sectionName?: string }) =>
      options?.sectionName ? `${key}|${options.sectionName}` : key,
  }),
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: mockSuccessToast,
  ErrorToast: vi.fn(),
}));

vi.mock('@cgp/ui-kit/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/tabs', () => {
  let tabsOnValueChange: ((value: string) => void) | undefined;

  return {
    Tabs: ({
      children,
      onValueChange,
    }: {
      children: React.ReactNode;
      onValueChange?: (value: string) => void;
    }) => {
      tabsOnValueChange = onValueChange;
      return <div>{children}</div>;
    },
    TabsList: ({ children }: { children: React.ReactNode }) => (
      <div role="tablist">{children}</div>
    ),
    TabsTrigger: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => (
      <button
        role="tab"
        onClick={() => tabsOnValueChange?.(value)}
        value={value}
      >
        {children}
      </button>
    ),
    TabsContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

vi.mock('@/views/vacancies/context/vacancy-form-context', () => {
  const StepOne = ({
    onNext: stepOnNext,
  }: {
    onNext: () => void;
    onBack: () => void;
    onSubmit: () => void;
  }) => (
    <div>
      <p>Step One Content</p>
      <button onClick={stepOnNext} type="button">
        Trigger Next
      </button>
    </div>
  );

  const StepTwo = ({
    onBack: stepOnBack,
    onSubmit: stepOnSubmit,
  }: {
    onNext: () => void;
    onBack: () => void;
    onSubmit: () => void;
  }) => (
    <div>
      <p>Step Two Content</p>
      <button onClick={stepOnBack} type="button">
        Trigger Back
      </button>
      <button onClick={stepOnSubmit} type="button">
        Trigger Submit
      </button>
    </div>
  );

  const steps = [
    { key: 'step-one', label: 'Step One', component: StepOne },
    {
      key: 'step-two',
      label: 'Step Two',
      disableToastNameKey: 'section.disabledName',
      component: StepTwo,
    },
  ];

  return {
    VACANCY_STEPS: steps,
    useTemplateFieldVisible: () => () => true,
    useVacancyForm: () => ({
      visibleSteps: steps,
      currentStepIndex: mockContext.currentStepIndex,
      setCurrentStepIndex,
      completedSteps: new Set<number>([0]),
      stepGuard: mockContext.stepGuard,
      stepDisableRef: { current: mockStepDisable },
      removeCompletedStep: mockRemoveCompleted,
      onNext,
      onBack,
      onSubmit,
      showCancelDialog: false,
      setShowCancelDialog: vi.fn(),
      OnSaveAsDraft: vi.fn(),
      stepPersistRef: { current: null },
    }),
  };
});

describe('VacancyCreateStepperForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.currentStepIndex = 0;
    mockContext.stepGuard = false;
  });

  it('renders heading and step labels', () => {
    render(<VacancyCreateStepperForm />);

    expect(screen.getByText('vacancies.addVacancy')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Step One' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Step Two' })).toBeInTheDocument();
    expect(screen.getByText('Step One Content')).toBeInTheDocument();
  });

  it('changes step when a different tab is selected', async () => {
    const user = userEvent.setup();

    render(<VacancyCreateStepperForm />);

    await user.click(screen.getByRole('tab', { name: 'Step Two' }));

    expect(setCurrentStepIndex).toHaveBeenCalledWith(1);
  });

  it('forwards step action callbacks to the rendered step component', async () => {
    const user = userEvent.setup();

    render(<VacancyCreateStepperForm />);

    await user.click(screen.getByRole('button', { name: 'Trigger Next' }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  describe('section disabled notification via step navigation (DQCGP-4532)', () => {
    it('uses the standard section name for steps that define one', async () => {
      const user = userEvent.setup();
      mockContext.currentStepIndex = 1;
      mockContext.stepGuard = true;

      render(<VacancyCreateStepperForm />);

      await user.click(screen.getByRole('tab', { name: 'Step One' }));
      await user.click(
        screen.getByText('stepNavigation.disableDialog.confirmButton')
      );

      expect(mockStepDisable).toHaveBeenCalledTimes(1);
      expect(mockRemoveCompleted).toHaveBeenCalledWith(1);
      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'common.notifications.disable.title',
        description:
          'common.notifications.disable.message|section.disabledName',
      });
      expect(setCurrentStepIndex).toHaveBeenCalledWith(0);
    });

    it('falls back to the step label when no section name is defined', async () => {
      const user = userEvent.setup();
      mockContext.currentStepIndex = 0;
      mockContext.stepGuard = true;

      render(<VacancyCreateStepperForm />);

      await user.click(screen.getByRole('tab', { name: 'Step Two' }));
      await user.click(
        screen.getByText('stepNavigation.disableDialog.confirmButton')
      );

      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'common.notifications.disable.title',
        description: 'common.notifications.disable.message|Step One',
      });
      expect(setCurrentStepIndex).toHaveBeenCalledWith(1);
    });

    it('does not show the notification or change step when the dialog is cancelled', async () => {
      const user = userEvent.setup();
      mockContext.stepGuard = true;

      render(<VacancyCreateStepperForm />);

      await user.click(screen.getByRole('tab', { name: 'Step Two' }));
      await user.click(
        await screen.findByText('common.disableDialog.cancelButton')
      );

      expect(mockSuccessToast).not.toHaveBeenCalled();
      expect(mockStepDisable).not.toHaveBeenCalled();
      expect(setCurrentStepIndex).not.toHaveBeenCalled();
    });
  });
});
