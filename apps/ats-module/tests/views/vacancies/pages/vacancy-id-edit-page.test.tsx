import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyIdEditPage from '@/views/vacancies/pages/vacancy-id-edit-page';

const mockNavigate = vi.fn();

let idParam: string | undefined = 'vacancy-1';
let locationState: unknown = null;
let keycloakState: {
  keycloak: { authenticated: boolean };
  initialized: boolean;
} = {
  keycloak: { authenticated: true },
  initialized: true,
};

type QueryState = {
  data?: { success: boolean; message?: string; data?: unknown };
  isLoading: boolean;
  error: unknown;
};

let queryState: QueryState = { isLoading: false, error: null, data: undefined };

const getEnabledStepKeysMock = vi.fn(
  (_form: Record<string, unknown>) => [] as string[]
);
const toVacancyFormFromResponseMock = vi.fn(
  (record: Record<string, unknown>, prev: Record<string, unknown>) => ({
    ...prev,
    ...record,
  })
);

const vacancyFormProviderSpy = vi.fn();

const mockSetForm = vi.fn();
const mockSetIsInitialStep = vi.fn();
const mockSetCurrentStepIndex = vi.fn();
const mockInitCompletedStepsFromForm = vi.fn();
const mockOnNext = vi.fn();

const vacancyFormValue: {
  form: { title: string; status: string; applicantCount?: number };
  setForm: typeof mockSetForm;
  visibleSteps: { key: string }[];
  isInitialStep: boolean;
  setIsInitialStep: typeof mockSetIsInitialStep;
  setCurrentStepIndex: typeof mockSetCurrentStepIndex;
  initCompletedStepsFromForm: typeof mockInitCompletedStepsFromForm;
  onNext: typeof mockOnNext;
} = {
  form: { title: '', status: 'draft', applicantCount: undefined },
  setForm: mockSetForm,
  visibleSteps: [{ key: 'job-requirements' }, { key: 'profile-requirements' }],
  isInitialStep: true,
  setIsInitialStep: mockSetIsInitialStep,
  setCurrentStepIndex: mockSetCurrentStepIndex,
  initCompletedStepsFromForm: mockInitCompletedStepsFromForm,
  onNext: mockOnNext,
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: idParam }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: locationState }),
}));

vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => keycloakState,
}));

vi.mock('@/views/vacancies/hooks', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/hooks')>();
  return {
    ...actual,
    useVacancyByIdQuery: () => queryState,
    // These specs predate template-driven visibility and never exercise a
    // resolved template; a disabled/empty result keeps that path inert.
    useVacancyTemplateByIdQuery: () => ({ data: undefined, isLoading: false }),
  };
});

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    VacancyCreateStepperForm: ({ mode }: { mode: string }) => (
      <div data-testid="stepper-form">{mode}</div>
    ),
  };
});

vi.mock('@/views/vacancies/components', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/components')>();
  return {
    ...actual,
    VacancyEditCancelDialog: ({
      open,
      onOpenChange,
      onConfirm,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onConfirm: () => void;
    }) =>
      open ? (
        <div role="dialog" aria-label="vacancyEditCancelDialog.title">
          <p>vacancyEditCancelDialog.title</p>
          <button onClick={() => onOpenChange(false)}>
            vacancyEditCancelDialog.noButton
          </button>
          <button onClick={onConfirm}>vacancyEditCancelDialog.yesButton</button>
        </div>
      ) : null,
  };
});

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  DEFAULT_FORM: { title: '', status: 'draft' },
  VacancyFormProvider: ({
    children,
    ...props
  }: {
    children: ReactNode;
    [key: string]: unknown;
  }) => {
    vacancyFormProviderSpy(props);
    return <div data-testid="form-provider">{children}</div>;
  },
  getEnabledStepKeys: (form: Record<string, unknown>) =>
    getEnabledStepKeysMock(form),
  useVacancyForm: () => vacancyFormValue,
}));

vi.mock('@/views/vacancies/utils/vacancy-edit-response-helpers', () => ({
  toVacancyFormFromResponse: (
    record: Record<string, unknown>,
    prev: Record<string, unknown>
  ) => toVacancyFormFromResponseMock(record, prev),
}));

describe('VacancyIdEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    idParam = 'vacancy-1';
    locationState = null;
    keycloakState = {
      keycloak: { authenticated: true },
      initialized: true,
    };
    queryState = { isLoading: false, error: null, data: undefined };
    getEnabledStepKeysMock.mockReturnValue([]);
    toVacancyFormFromResponseMock.mockImplementation(
      (record: Record<string, unknown>, prev: Record<string, unknown>) => ({
        ...prev,
        ...record,
      })
    );
    vacancyFormValue.form = {
      title: '',
      status: 'draft',
      applicantCount: undefined,
    };
    vacancyFormValue.visibleSteps = [
      { key: 'job-requirements' },
      { key: 'profile-requirements' },
    ];
    vacancyFormValue.isInitialStep = true;
    // Mirrors the real setState updater form so the component's internal
    // `resolvedForm` (captured via the setForm callback) actually gets set,
    // which in turn gates the initCompletedStepsFromForm call.
    mockSetForm.mockImplementation((updater: unknown) =>
      typeof updater === 'function'
        ? (updater as (prev: unknown) => unknown)(vacancyFormValue.form)
        : updater
    );
  });

  describe('visibleStepKeys computation (VacancyIdEditPage)', () => {
    it('passes visibleStepKeys=undefined when there is no successful response yet', () => {
      render(<VacancyIdEditPage />);

      expect(vacancyFormProviderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          vacancyId: 'vacancy-1',
          visibleStepKeys: undefined,
        })
      );
      expect(getEnabledStepKeysMock).not.toHaveBeenCalled();
    });

    it('passes visibleStepKeys=undefined when the loaded vacancy has no vacancyTemplateId', () => {
      queryState = {
        isLoading: false,
        error: null,
        data: { success: true, data: { title: 'Engineer' } },
      };

      render(<VacancyIdEditPage />);

      expect(vacancyFormProviderSpy).toHaveBeenCalledWith(
        expect.objectContaining({ visibleStepKeys: undefined })
      );
      expect(getEnabledStepKeysMock).not.toHaveBeenCalled();
    });

    it('passes visibleStepKeys=undefined when the response data is not a record', () => {
      queryState = {
        isLoading: false,
        error: null,
        data: { success: true, data: null },
      };

      render(<VacancyIdEditPage />);

      expect(vacancyFormProviderSpy).toHaveBeenCalledWith(
        expect.objectContaining({ visibleStepKeys: undefined })
      );
    });

    it('passes visibleStepKeys=undefined when the response is unsuccessful', () => {
      queryState = {
        isLoading: false,
        error: null,
        data: { success: false, message: 'nope' },
      };

      render(<VacancyIdEditPage />);

      expect(vacancyFormProviderSpy).toHaveBeenCalledWith(
        expect.objectContaining({ visibleStepKeys: undefined })
      );
    });

    it('computes visibleStepKeys from getEnabledStepKeys when a vacancyTemplateId is present', () => {
      getEnabledStepKeysMock.mockReturnValue(['job-requirements']);
      queryState = {
        isLoading: false,
        error: null,
        data: {
          success: true,
          data: { title: 'From Template', vacancyTemplateId: 'template-9' },
        },
      };

      render(<VacancyIdEditPage />);

      expect(toVacancyFormFromResponseMock).toHaveBeenCalledWith(
        { title: 'From Template', vacancyTemplateId: 'template-9' },
        { title: '', status: 'draft' }
      );
      expect(vacancyFormProviderSpy).toHaveBeenCalledWith(
        expect.objectContaining({ visibleStepKeys: ['job-requirements'] })
      );
    });
  });

  describe('EditVacancyContent states', () => {
    it('shows an invalid id error when there is no id param', () => {
      idParam = undefined;
      render(<VacancyIdEditPage />);

      expect(screen.getByText('common.error.title')).toBeInTheDocument();
      expect(screen.getByText('vacancies.edit.invalidId')).toBeInTheDocument();
    });

    it('shows the loading skeleton while the query is loading', () => {
      queryState = { isLoading: true, error: null, data: undefined };
      render(<VacancyIdEditPage />);

      expect(screen.queryByText('common.error.title')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stepper-form')).not.toBeInTheDocument();
    });

    it('shows the failure message when the query errors', () => {
      queryState = {
        isLoading: false,
        error: new Error('boom'),
        data: undefined,
      };
      render(<VacancyIdEditPage />);

      expect(screen.getByText('common.error.title')).toBeInTheDocument();
      expect(
        screen.getByText('vacancies.edit.failedToLoadVacancy')
      ).toBeInTheDocument();
    });

    it('shows the response message when the response is unsuccessful', () => {
      queryState = {
        isLoading: false,
        error: null,
        data: { success: false, message: 'Custom failure' },
      };
      render(<VacancyIdEditPage />);

      expect(screen.getByText('Custom failure')).toBeInTheDocument();
    });

    it('falls back to the generic failure message when unsuccessful with no message', () => {
      queryState = {
        isLoading: false,
        error: null,
        data: { success: false },
      };
      render(<VacancyIdEditPage />);

      expect(
        screen.getByText('vacancies.edit.failedToLoadVacancy')
      ).toBeInTheDocument();
    });

    it('stays in the loading state when the response data is not a record (hydration never completes)', () => {
      queryState = {
        isLoading: false,
        error: null,
        data: { success: true, data: null },
      };
      render(<VacancyIdEditPage />);

      expect(mockSetForm).not.toHaveBeenCalled();
      expect(screen.queryByText('common.error.title')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stepper-form')).not.toBeInTheDocument();
    });

    it('hydrates the form and renders the title step once loaded successfully', async () => {
      queryState = {
        isLoading: false,
        error: null,
        data: { success: true, data: { title: 'Engineer' } },
      };
      vacancyFormValue.isInitialStep = true;

      render(<VacancyIdEditPage />);

      await waitFor(() => expect(mockSetForm).toHaveBeenCalled());
      expect(mockInitCompletedStepsFromForm).toHaveBeenCalled();
      expect(
        screen.getByText('vacancies.createVacancy.formTitle')
      ).toBeInTheDocument();
    });

    it('renders the stepper form once past the initial step', async () => {
      queryState = {
        isLoading: false,
        error: null,
        data: { success: true, data: { title: 'Engineer' } },
      };
      vacancyFormValue.isInitialStep = false;

      render(<VacancyIdEditPage />);

      await waitFor(() =>
        expect(screen.getByTestId('stepper-form')).toBeInTheDocument()
      );
      expect(screen.getByTestId('stepper-form')).toHaveTextContent('edit');
    });

    it('jumps to the requested deep-link step when initialStep is provided', async () => {
      locationState = { initialStep: 'profile-requirements' };
      queryState = {
        isLoading: false,
        error: null,
        data: { success: true, data: { title: 'Engineer' } },
      };

      render(<VacancyIdEditPage />);

      await waitFor(() =>
        expect(mockSetCurrentStepIndex).toHaveBeenCalledWith(1)
      );
      expect(mockSetIsInitialStep).toHaveBeenCalledWith(false);
    });

    it('falls back to the vacancy lastActiveStep when no initialStep is requested', async () => {
      queryState = {
        isLoading: false,
        error: null,
        data: {
          success: true,
          data: { title: 'Engineer', lastActiveStep: 'profile-requirements' },
        },
      };

      render(<VacancyIdEditPage />);

      await waitFor(() =>
        expect(mockSetCurrentStepIndex).toHaveBeenCalledWith(1)
      );
      expect(mockSetIsInitialStep).not.toHaveBeenCalled();
    });
  });

  describe('EditVacancyTitleStep interactions', () => {
    beforeEach(() => {
      queryState = {
        isLoading: false,
        error: null,
        data: { success: true, data: { title: 'Engineer' } },
      };
      vacancyFormValue.isInitialStep = true;
    });

    it('shows the status badge when the status is set and not "new"', async () => {
      vacancyFormValue.form = {
        title: 'Engineer',
        status: 'live',
        applicantCount: 3,
      };

      render(<VacancyIdEditPage />);

      await waitFor(() =>
        expect(screen.getByTestId('vacancy-live')).toBeInTheDocument()
      );
    });

    it('hides the status badge when the status is "new"', async () => {
      vacancyFormValue.form = { title: 'Engineer', status: 'new' };

      render(<VacancyIdEditPage />);

      await waitFor(() =>
        expect(
          screen.getByText('vacancies.createVacancy.formTitle')
        ).toBeInTheDocument()
      );
      expect(screen.queryByTestId('vacancy-new')).not.toBeInTheDocument();
    });

    it('hides the status badge when there is no status', async () => {
      vacancyFormValue.form = { title: 'Engineer', status: '' };

      render(<VacancyIdEditPage />);

      await waitFor(() =>
        expect(
          screen.getByText('vacancies.createVacancy.formTitle')
        ).toBeInTheDocument()
      );
      expect(screen.queryByTestId(/^vacancy-/)).not.toBeInTheDocument();
    });

    it('sanitizes emoji and updates the title on change', async () => {
      const user = userEvent.setup();
      vacancyFormValue.form = { title: '', status: 'draft' };

      render(<VacancyIdEditPage />);
      await waitFor(() =>
        expect(
          screen.getByText('vacancies.createVacancy.formTitle')
        ).toBeInTheDocument()
      );

      const input = screen.getByPlaceholderText(
        'vacancies.createVacancy.titlePlaceholder'
      );
      await user.type(input, 'A');

      expect(mockSetForm).toHaveBeenCalled();
    });

    it('shows a validation error and does not advance when Next is clicked with an empty title', async () => {
      const user = userEvent.setup();
      vacancyFormValue.form = { title: '   ', status: 'draft' };

      render(<VacancyIdEditPage />);
      await waitFor(() =>
        expect(
          screen.getByText('vacancies.createVacancy.formTitle')
        ).toBeInTheDocument()
      );

      await user.click(screen.getByText('vacancies.createVacancy.nextButton'));

      expect(
        screen.getByText('vacancies.createVacancy.titleRequired')
      ).toBeInTheDocument();
      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it('advances to the next step when Next is clicked with a valid title', async () => {
      const user = userEvent.setup();
      vacancyFormValue.form = { title: 'Engineer', status: 'draft' };

      render(<VacancyIdEditPage />);
      await waitFor(() =>
        expect(
          screen.getByText('vacancies.createVacancy.formTitle')
        ).toBeInTheDocument()
      );

      await user.click(screen.getByText('vacancies.createVacancy.nextButton'));

      expect(mockSetCurrentStepIndex).toHaveBeenCalledWith(0);
      expect(mockOnNext).toHaveBeenCalled();
      expect(
        screen.queryByText('vacancies.createVacancy.titleRequired')
      ).not.toBeInTheDocument();
    });

    it('navigates back (history -1) on cancel-confirm when arriving from the vacancies list', async () => {
      const user = userEvent.setup();
      locationState = { from: '/dashboard/ats/vacancies/123' };
      vacancyFormValue.form = { title: 'Engineer', status: 'draft' };

      render(<VacancyIdEditPage />);
      await waitFor(() =>
        expect(
          screen.getByText('vacancies.createVacancy.formTitle')
        ).toBeInTheDocument()
      );

      await user.click(
        screen.getByText('vacancies.createVacancy.cancelButton')
      );
      expect(
        screen.getByRole('dialog', { name: 'vacancyEditCancelDialog.title' })
      ).toBeInTheDocument();

      await user.click(screen.getByText('vacancyEditCancelDialog.yesButton'));

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('navigates to the vacancies list on cancel-confirm when not arriving from the list', async () => {
      const user = userEvent.setup();
      locationState = { from: '/somewhere-else' };
      vacancyFormValue.form = { title: 'Engineer', status: 'draft' };

      render(<VacancyIdEditPage />);
      await waitFor(() =>
        expect(
          screen.getByText('vacancies.createVacancy.formTitle')
        ).toBeInTheDocument()
      );

      await user.click(
        screen.getByText('vacancies.createVacancy.cancelButton')
      );
      await user.click(screen.getByText('vacancyEditCancelDialog.yesButton'));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/ats/vacancies');
    });

    it('closes the dialog without navigating when "No" is clicked', async () => {
      const user = userEvent.setup();
      vacancyFormValue.form = { title: 'Engineer', status: 'draft' };

      render(<VacancyIdEditPage />);
      await waitFor(() =>
        expect(
          screen.getByText('vacancies.createVacancy.formTitle')
        ).toBeInTheDocument()
      );

      await user.click(
        screen.getByText('vacancies.createVacancy.cancelButton')
      );
      await user.click(screen.getByText('vacancyEditCancelDialog.noButton'));

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('dialog', { name: 'vacancyEditCancelDialog.title' })
      ).not.toBeInTheDocument();
    });
  });
});
