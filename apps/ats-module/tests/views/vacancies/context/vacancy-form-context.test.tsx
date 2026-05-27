import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  VACANCY_STEPS,
  VacancyFormProvider,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';

vi.mock('@/views/vacancies', () => {
  const MockStep = () => <div>Mock Step</div>;

  return {
    CustomizableFormStep: MockStep,
    JobRequirementsStep: MockStep,
    LicenseCertificatesStep: MockStep,
    PreferredCausesStep: MockStep,
    PreferredClubSocietiesStep: MockStep,
    PreferredHobbiesStep: MockStep,
    PreferredHonoursAwardsStep: MockStep,
    PreferredIndustryStep: MockStep,
    PreferredLanguagesStep: MockStep,
    PreferredPatentsStep: MockStep,
    PreferredPublicationsStep: MockStep,
    PreferredSkillsStep: MockStep,
    PreferredSportsStep: MockStep,
    PreferredVolunteeringStep: MockStep,
    ProfileRequirementsStep: MockStep,
    ProjectsRequirementsStep: MockStep,
    ScheduleVacancyStep: MockStep,
    SecondaryEducationStep: MockStep,
    TertiaryEducationStep: MockStep,
  };
});

function ContextConsumer() {
  const {
    form,
    currentStepIndex,
    completedSteps,
    isInitialStep,
    onNext,
    onBack,
    setCurrentStepIndex,
  } = useVacancyForm();

  return (
    <div>
      <p>current-step: {currentStepIndex}</p>
      <p>last-active-step: {form.lastActiveStep}</p>
      <p>is-initial-step: {String(isInitialStep)}</p>
      <p>completed-steps-count: {completedSteps.size}</p>
      <button onClick={() => onNext()} type="button">
        Next
      </button>
      <button onClick={() => onBack()} type="button">
        Back
      </button>
      <button onClick={() => setCurrentStepIndex(2)} type="button">
        Jump To 2
      </button>
    </div>
  );
}

describe('vacancy-form-context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when useVacancyForm is used outside provider', () => {
    expect(() => render(<ContextConsumer />)).toThrow(
      'useVacancyForm must be used within VacancyFormProvider'
    );
  });

  it('exposes initial state from provider', () => {
    render(
      <VacancyFormProvider>
        <ContextConsumer />
      </VacancyFormProvider>
    );

    expect(screen.getByText('current-step: 0')).toBeInTheDocument();
    expect(
      screen.getByText(`last-active-step: ${VACANCY_STEPS[0].key}`)
    ).toBeInTheDocument();
    expect(screen.getByText('is-initial-step: true')).toBeInTheDocument();
    expect(screen.getByText('completed-steps-count: 0')).toBeInTheDocument();
  });

  it('moves from title step to first form step on first next, then advances and marks completed', async () => {
    const user = userEvent.setup();

    render(
      <VacancyFormProvider>
        <ContextConsumer />
      </VacancyFormProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('is-initial-step: false')).toBeInTheDocument();
    expect(screen.getByText('current-step: 0')).toBeInTheDocument();
    expect(screen.getByText('completed-steps-count: 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('current-step: 1')).toBeInTheDocument();
    expect(screen.getByText('completed-steps-count: 1')).toBeInTheDocument();
    expect(
      screen.getByText(`last-active-step: ${VACANCY_STEPS[1].key}`)
    ).toBeInTheDocument();
  });

  it('goes back one step when current step is greater than zero', async () => {
    const user = userEvent.setup();

    render(
      <VacancyFormProvider>
        <ContextConsumer />
      </VacancyFormProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('current-step: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByText('current-step: 0')).toBeInTheDocument();
    expect(
      screen.getByText(`last-active-step: ${VACANCY_STEPS[0].key}`)
    ).toBeInTheDocument();
  });

  it('sets initial step true when backing from the first step', async () => {
    const user = userEvent.setup();

    render(
      <VacancyFormProvider>
        <ContextConsumer />
      </VacancyFormProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('is-initial-step: false')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByText('is-initial-step: true')).toBeInTheDocument();
    expect(screen.getByText('current-step: 0')).toBeInTheDocument();
  });

  it('updates current step and last active step when setCurrentStepIndex is used', async () => {
    const user = userEvent.setup();

    render(
      <VacancyFormProvider>
        <ContextConsumer />
      </VacancyFormProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Jump To 2' }));

    expect(screen.getByText('current-step: 2')).toBeInTheDocument();
    expect(
      screen.getByText(`last-active-step: ${VACANCY_STEPS[2].key}`)
    ).toBeInTheDocument();
  });
});
