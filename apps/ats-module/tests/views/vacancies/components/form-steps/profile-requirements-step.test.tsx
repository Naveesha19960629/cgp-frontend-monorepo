import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ProfileRequirementsStep from '@/views/vacancies/components/form-steps/profile-requirements-step';

// ── Hoisted mock refs ─────────────────────────────────────────────────────────

const mockUseVacancyForm = vi.hoisted(() =>
  vi.fn(() => ({
    form: {
      profileRequirements: {
        isEnabled: false,
        dataTakenFromCandidate: false,
        gender: { id: '', label: '' },
        maritalStatus: { id: '', label: '' },
        addresses: [] as {
          city: { id: string; label: string };
          stateProvince: { id: string; label: string };
          country: { id: string; label: string };
          postalCode: string;
        }[],
      },
    },
    onCancel: vi.fn(),
    setStepGuard: vi.fn(),
    stepPersistRef: { current: null },
  }))
);

const mockUseGendersQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      data: {
        items: {
          content: [
            { id: 'male', label: 'Male' },
            { id: 'female', label: 'Female' },
          ],
        },
      },
    },
  }))
);

const mockUseMaritalStatusesQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      data: {
        items: {
          content: [
            { id: 'single', label: 'Single' },
            { id: 'married', label: 'Married' },
          ],
        },
      },
    },
  }))
);

const mockUsePlacesCityQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: [], isFetching: false }))
);
const mockUsePlacesStateQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: [], isFetching: false }))
);
const mockUsePlacesCountryQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: [], isFetching: false }))
);
const mockSuccessToast = vi.hoisted(() => vi.fn());

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: mockSuccessToast,
  ErrorToast: vi.fn(),
}));

vi.mock('@/components/message-box', () => ({
  default: () => <div data-testid="message-box" />,
}));

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    StepDisableDialog: ({
      open,
      onOpenChange,
      onConfirm,
      title,
      confirmLabel,
    }: {
      open?: boolean;
      onOpenChange?: (v: boolean) => void;
      onConfirm?: () => void;
      title?: string;
      confirmLabel?: string;
    }) =>
      open ? (
        <dialog open data-testid="step-disable-dialog">
          <h2>{title}</h2>
          <button onClick={() => onOpenChange?.(false)}>
            preferredPatents.disableDialog.cancelButton
          </button>
          <button onClick={onConfirm}>{confirmLabel}</button>
        </dialog>
      ) : null,
  };
});

vi.mock(
  '@/views/vacancies/context/vacancy-form-context',
  async importOriginal => {
    const actual =
      await importOriginal<
        typeof import('@/views/vacancies/context/vacancy-form-context')
      >();
    return {
      ...actual,
      useVacancyForm: mockUseVacancyForm,
    };
  }
);

vi.mock('@/views/vacancies/hooks', async () => {
  const actual = await vi.importActual<
    typeof import('@/views/vacancies/hooks')
  >('@/views/vacancies/hooks');
  return {
    ...actual,
    useGendersQuery: mockUseGendersQuery,
    useMaritalStatusesQuery: mockUseMaritalStatusesQuery,
    usePlacesCityQuery: mockUsePlacesCityQuery,
    usePlacesStateQuery: mockUsePlacesStateQuery,
    usePlacesCountryQuery: mockUsePlacesCountryQuery,
    useStepGuard: vi.fn(),
  };
});

vi.mock('@cgp/ui-kit/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    type,
    disabled,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    type?: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      type={(type ?? 'button') as 'button' | 'submit'}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked?: boolean;
    onCheckedChange?: (v: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked ?? false}
      onClick={() => onCheckedChange?.(!checked)}
    />
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/checkbox', () => ({
  Checkbox: ({
    id,
    checked,
    disabled,
    onCheckedChange,
  }: {
    id?: string;
    checked?: boolean;
    disabled?: boolean;
    onCheckedChange?: (v: boolean) => void;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked ?? false}
      disabled={disabled}
      onChange={e => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children?: ReactNode;
    value?: string;
    onValueChange?: (v: string) => void;
    disabled?: boolean;
  }) => (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={e => onValueChange?.(e.target.value)}
    >
      <option value="">--</option>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SelectContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SelectItem: ({
    children,
    value,
  }: {
    children?: ReactNode;
    value?: string;
  }) => <option value={value}>{children}</option>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/input', () => ({
  Input: (
    props: React.InputHTMLAttributes<HTMLInputElement> & {
      onChange?: React.ChangeEventHandler<HTMLInputElement>;
    }
  ) => <input {...props} />,
}));

vi.mock('@cgp/ui-kit/components/combobox', () => ({
  Combobox: ({
    placeholder,
    disabled,
  }: {
    placeholder?: string;
    disabled?: boolean;
  }) => <input placeholder={placeholder} disabled={disabled} />,
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => null,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeForm(
  overrides: Partial<{
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    gender: { id: string; label: string };
    maritalStatus: { id: string; label: string };
    addresses: {
      city: { id: string; label: string };
      stateProvince: { id: string; label: string };
      country: { id: string; label: string };
      postalCode: string;
    }[];
  }> = {}
) {
  return {
    form: {
      profileRequirements: {
        isEnabled: false,
        dataTakenFromCandidate: false,
        gender: { id: '', label: '' },
        maritalStatus: { id: '', label: '' },
        addresses: [] as {
          city: { id: string; label: string };
          stateProvince: { id: string; label: string };
          country: { id: string; label: string };
          postalCode: string;
        }[],
        ...overrides,
      },
    },
    onCancel: vi.fn(),
    setForm: vi.fn(),
    setStepGuard: vi.fn(),
    stepPersistRef: { current: null },
  };
}

function renderStep(
  formOverrides: Parameters<typeof makeForm>[0] = {},
  onNextOverride?: ReturnType<typeof vi.fn>
) {
  const onNext = onNextOverride ?? vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();
  const formValue = makeForm(formOverrides);
  mockUseVacancyForm.mockReturnValue(formValue);
  render(
    <ProfileRequirementsStep
      onNext={onNext}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
  return { onNext, onBack, onSubmit, onCancel: formValue.onCancel };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProfileRequirementsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the section heading', () => {
      renderStep();
      expect(
        screen.getByRole('heading', { name: 'profileRequirements.title' })
      ).toBeInTheDocument();
    });

    it('renders the toggle switch as disabled by default', () => {
      renderStep();
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });

    it('renders the toggle switch as enabled when form state is enabled', () => {
      renderStep({ isEnabled: true });
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it('renders the dataTakenFromCandidate checkbox', () => {
      renderStep();
      expect(
        screen.getByLabelText('profileRequirements.dataTakenFromCandidate')
      ).toBeInTheDocument();
    });

    it('renders the MessageBox', () => {
      renderStep();
      expect(screen.getByTestId('message-box')).toBeInTheDocument();
    });

    it('renders the gender field label', () => {
      renderStep();
      expect(
        screen.getByText('profileRequirements.gender')
      ).toBeInTheDocument();
    });

    it('renders the marital status field label', () => {
      renderStep();
      expect(
        screen.getByText('profileRequirements.maritalStatus')
      ).toBeInTheDocument();
    });

    it('renders the addresses section title', () => {
      renderStep();
      expect(
        screen.getByText('profileRequirements.addressesTitle')
      ).toBeInTheDocument();
    });

    it('renders Cancel and Next buttons', () => {
      renderStep();
      expect(
        screen.getByText('profileRequirements.cancelButton')
      ).toBeInTheDocument();
      expect(
        screen.getByText('profileRequirements.nextButton')
      ).toBeInTheDocument();
    });

    it('renders the back button', () => {
      renderStep();
      expect(
        screen.getByRole('button', {
          name: 'profileRequirements.back',
        })
      ).toBeInTheDocument();
    });
  });

  describe('toggle', () => {
    it('enables the step when toggle is clicked while disabled', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: false });

      await user.click(screen.getByRole('switch'));

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it('disables directly when toggle is clicked with no data', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: true });

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(screen.getByRole('switch')).toHaveAttribute(
          'aria-checked',
          'false'
        );
      });
    });
  });

  describe('dataTakenFromCandidate', () => {
    it('can be checked when enabled', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: true });

      const checkbox = screen.getByLabelText(
        'profileRequirements.dataTakenFromCandidate'
      );
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });
  });

  describe('footer navigation', () => {
    it('calls onBack when the back button is clicked', async () => {
      const user = userEvent.setup();
      const { onBack } = renderStep();

      await user.click(
        screen.getByRole('button', { name: 'profileRequirements.back' })
      );

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel from context when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const { onCancel } = renderStep();

      await user.click(screen.getByText('profileRequirements.cancelButton'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onNext when Next is clicked with disabled step', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep({ isEnabled: false });

      await user.click(screen.getByText('profileRequirements.nextButton'));

      await waitFor(() => {
        expect(onNext).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onNext with correct payload when step is disabled', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep({ isEnabled: false });

      await user.click(screen.getByText('profileRequirements.nextButton'));

      await waitFor(() => {
        expect(onNext).toHaveBeenCalledWith(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            profileRequirements: expect.objectContaining({
              isEnabled: false,
              dataTakenFromCandidate: false,
            }),
          })
        );
      });
    });
  });

  describe('emptyDisableDialog', () => {
    it('shows when Next is clicked with enabled step but no data', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: true });

      await user.click(screen.getByText('profileRequirements.nextButton'));

      await waitFor(() => {
        expect(
          screen.getByText('profileRequirements.emptyDisableDialog.title')
        ).toBeInTheDocument();
      });
    });

    it('does not show when dataTakenFromCandidate is checked', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: true });

      const checkbox = screen.getByLabelText(
        'profileRequirements.dataTakenFromCandidate'
      );
      await user.click(checkbox);
      await user.click(screen.getByText('profileRequirements.nextButton'));

      await waitFor(() => {
        expect(
          screen.queryByText('profileRequirements.emptyDisableDialog.title')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('address cards', () => {
    it('renders one address card by default', () => {
      renderStep();
      expect(
        screen.getByText(/profileRequirements.addressTitle/)
      ).toBeInTheDocument();
    });

    it('renders city field label', () => {
      renderStep();
      expect(screen.getByText('profileRequirements.city')).toBeInTheDocument();
    });

    it('renders state/province field label', () => {
      renderStep();
      expect(
        screen.getByText('profileRequirements.stateProvince')
      ).toBeInTheDocument();
    });

    it('renders country field label', () => {
      renderStep();
      expect(
        screen.getByText('profileRequirements.country')
      ).toBeInTheDocument();
    });

    it('renders postal code field label', () => {
      renderStep();
      expect(
        screen.getByText('profileRequirements.postalCode')
      ).toBeInTheDocument();
    });
  });
});
