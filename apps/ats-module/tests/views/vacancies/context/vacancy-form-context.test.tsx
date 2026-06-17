import { useEffect } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  VACANCY_STEPS,
  VacancyFormProvider,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockNavigate = vi.hoisted(() => vi.fn());
const mockCreateVacancy = vi.hoisted(() => vi.fn());
const mockSuccessToast = vi.hoisted(() => vi.fn());
const mockErrorToast = vi.hoisted(() => vi.fn());
const mockToCreateVacancyPayload = vi.hoisted(() =>
  vi.fn((_form: unknown, status?: string) => ({
    title: 'mock-vacancy',
    status: status ?? 'UNPUBLISHED',
    lastActiveStep: 'job-requirements',
    data: {},
  }))
);

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/views/vacancies/services', () => ({
  vacancyService: {
    createVacancy: (...args: unknown[]) =>
      mockCreateVacancy(...args) as Promise<void>,
  },
}));

vi.mock('@/views/vacancies/utils', () => ({
  toCreateVacancyPayload: (...args: unknown[]) =>
    // @ts-expect-error - Return type is not compatible with the actual function, but it's sufficient for testing the context logic
    mockToCreateVacancyPayload(...args),
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: (...args: unknown[]) => {
    mockSuccessToast(...args);
  },
  ErrorToast: (...args: unknown[]) => {
    mockErrorToast(...args);
  },
}));

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeQueryClient()}>
      <VacancyFormProvider>{children}</VacancyFormProvider>
    </QueryClientProvider>
  );
}

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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('vacancy-form-context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateVacancy.mockResolvedValue(undefined);
  });

  it('throws when useVacancyForm is used outside provider', () => {
    expect(() => render(<ContextConsumer />)).toThrow(
      'useVacancyForm must be used within VacancyFormProvider'
    );
  });

  it('exposes initial state from provider', () => {
    render(
      <Wrapper>
        <ContextConsumer />
      </Wrapper>
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
      <Wrapper>
        <ContextConsumer />
      </Wrapper>
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
      <Wrapper>
        <ContextConsumer />
      </Wrapper>
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
      <Wrapper>
        <ContextConsumer />
      </Wrapper>
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
      <Wrapper>
        <ContextConsumer />
      </Wrapper>
    );

    await user.click(screen.getByRole('button', { name: 'Jump To 2' }));

    expect(screen.getByText('current-step: 2')).toBeInTheDocument();
    expect(
      screen.getByText(`last-active-step: ${VACANCY_STEPS[2].key}`)
    ).toBeInTheDocument();
  });

  describe('onCancel', () => {
    const mockPersistFn = vi.fn();

    function CancelConsumer() {
      const { onCancel, showCancelDialog, stepPersistRef } = useVacancyForm();

      useEffect(() => {
        stepPersistRef.current = mockPersistFn;
      }, [stepPersistRef]);

      return (
        <div>
          <p data-testid="show-dialog">{String(showCancelDialog)}</p>
          <button onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      );
    }

    it('calls stepPersistRef.current before opening the cancel dialog', async () => {
      const user = userEvent.setup();

      render(
        <Wrapper>
          <CancelConsumer />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockPersistFn).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('show-dialog')).toHaveTextContent('true');
    });

    it('still opens cancel dialog when stepPersistRef.current is null', async () => {
      const user = userEvent.setup();

      function CancelConsumerNoRef() {
        const { onCancel, showCancelDialog } = useVacancyForm();
        return (
          <div>
            <p data-testid="show-dialog">{String(showCancelDialog)}</p>
            <button onClick={onCancel} type="button">
              Cancel
            </button>
          </div>
        );
      }

      render(
        <Wrapper>
          <CancelConsumerNoRef />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByTestId('show-dialog')).toHaveTextContent('true');
    });
  });

  describe('OnSaveAsDraft', () => {
    function DraftConsumer({
      draftSaveFn,
    }: {
      draftSaveFn?: () => Promise<Record<string, unknown> | null>;
    }) {
      const { OnSaveAsDraft, isSavingDraft, stepDraftSaveRef } =
        useVacancyForm();

      useEffect(() => {
        if (draftSaveFn) {
          stepDraftSaveRef.current = draftSaveFn;
        }
        return () => {
          stepDraftSaveRef.current = null;
        };
      }, [draftSaveFn, stepDraftSaveRef]);

      return (
        <div>
          <p data-testid="is-saving">{String(isSavingDraft)}</p>
          <button onClick={OnSaveAsDraft} type="button">
            Save Draft
          </button>
        </div>
      );
    }

    it('calls createVacancy with status DRAFT', async () => {
      const user = userEvent.setup();

      render(
        <Wrapper>
          <DraftConsumer />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Save Draft' }));

      await waitFor(() => {
        expect(mockCreateVacancy).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'DRAFT' })
        );
      });
    });

    it('shows SuccessToast and navigates on successful save', async () => {
      const user = userEvent.setup();

      render(
        <Wrapper>
          <DraftConsumer />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Save Draft' }));

      await waitFor(() => {
        expect(mockSuccessToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'vacancyCancelDialog.notifications.saveAsDraft.title',
            description:
              'vacancyCancelDialog.notifications.saveAsDraft.message',
          })
        );
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/ats/vacancies');
      });
    });

    it('shows ErrorToast and does not navigate when createVacancy rejects', async () => {
      const user = userEvent.setup();
      mockCreateVacancy.mockRejectedValueOnce(new Error('API Error'));

      render(
        <Wrapper>
          <DraftConsumer />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Save Draft' }));

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'vacancyCancelDialog.notifications.saveAsDraft.errorTitle',
            description:
              'vacancyCancelDialog.notifications.saveAsDraft.errorMessage',
          })
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not call createVacancy when stepDraftSaveRef returns null', async () => {
      const user = userEvent.setup();
      const failingDraftSaveFn = vi.fn().mockResolvedValueOnce(null);

      render(
        <Wrapper>
          <DraftConsumer draftSaveFn={failingDraftSaveFn} />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Save Draft' }));

      await waitFor(() => {
        expect(failingDraftSaveFn).toHaveBeenCalledTimes(1);
      });

      expect(mockCreateVacancy).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('merges stepDraftSaveRef values into the form before calling createVacancy', async () => {
      const user = userEvent.setup();
      const stepValues = {
        jobRequirements: [{ isEnabled: true, discipline: [] }],
      };
      const successfulDraftSaveFn = vi.fn().mockResolvedValueOnce(stepValues);

      render(
        <Wrapper>
          <DraftConsumer draftSaveFn={successfulDraftSaveFn} />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Save Draft' }));

      await waitFor(() => {
        expect(mockToCreateVacancyPayload).toHaveBeenCalledWith(
          expect.objectContaining({
            jobRequirements: stepValues.jobRequirements,
          }),
          'DRAFT'
        );
      });
    });

    it('resets isSavingDraft to false after a successful save', async () => {
      const user = userEvent.setup();

      render(
        <Wrapper>
          <DraftConsumer />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Save Draft' }));

      await waitFor(() => {
        expect(screen.getByTestId('is-saving')).toHaveTextContent('false');
      });
    });

    it('resets isSavingDraft to false after a failed save', async () => {
      const user = userEvent.setup();
      mockCreateVacancy.mockRejectedValueOnce(new Error('API Error'));

      render(
        <Wrapper>
          <DraftConsumer />
        </Wrapper>
      );

      await user.click(screen.getByRole('button', { name: 'Save Draft' }));

      await waitFor(() => {
        expect(screen.getByTestId('is-saving')).toHaveTextContent('false');
      });
    });
  });
});
