import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ProfileRequirementsStep from '@/views/vacancies/components/form-steps/profile-requirements-step';

// ── Hoisted mock refs ─────────────────────────────────────────────────────────

const mockUseVacancyForm = vi.hoisted(() =>
  vi.fn(() => ({
    form: {
      status: 'draft',
      applicantCount: 0,
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
    stepPersistRef: { current: null as (() => void) | null },
    stepDisableRef: { current: null as (() => void) | null },
    currentStepIndex: 0,
    removeCompletedStep: vi.fn(),
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
  vi.fn(() => ({
    data: [] as {
      city: { id: string; label: string };
      state: { id?: string; label: string };
      country: { id?: string; label: string };
    }[],
    isFetching: false,
  }))
);
const mockUsePlacesStateQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: [] as {
      state: { id: string; label: string };
      country: { id?: string; label: string };
    }[],
    isFetching: false,
  }))
);
const mockUsePlacesCountryQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: [] as { country: { id: string; label: string } }[],
    isFetching: false,
  }))
);
const mockSuccessToast = vi.hoisted(() => vi.fn());
const mockErrorToast = vi.hoisted(() => vi.fn());
const mockGetByState = vi.hoisted(() => vi.fn());
const mockGetByCountry = vi.hoisted(() => vi.fn());

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: mockSuccessToast,
  ErrorToast: mockErrorToast,
}));

vi.mock('@/views/vacancies/services', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/services')>();
  return {
    ...actual,
    placesService: {
      ...actual.placesService,
      getByState: mockGetByState,
      getByCountry: mockGetByCountry,
    },
  };
});

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
      useTemplateFieldVisible: () => () => true,
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
    value,
    selectedLabel,
    options = [],
    onValueChange,
    onSearchChange,
  }: {
    placeholder?: string;
    disabled?: boolean;
    value?: string;
    selectedLabel?: string;
    options?: { value: string; label: string }[];
    onValueChange?: (v: string) => void;
    onSearchChange?: (v: string) => void;
  }) => (
    <div data-testid={`combobox-${placeholder}`}>
      <span data-testid={`combobox-${placeholder}-current`}>
        {selectedLabel ?? value ?? ''}
      </span>
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        value={value ?? ''}
        onChange={e => onSearchChange?.(e.target.value)}
      />
      {options.map(o => (
        <button
          type="button"
          key={o.value}
          disabled={disabled}
          onClick={() => onValueChange?.(o.value)}
        >
          {`opt:${placeholder}:${o.label}`}
        </button>
      ))}
    </div>
  ),
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
      isOpen?: boolean;
    }[];
  }> = {}
) {
  return {
    form: {
      status: 'draft',
      applicantCount: 0,
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
          isOpen?: boolean;
        }[],
        ...overrides,
      },
    },
    onCancel: vi.fn(),
    setForm: vi.fn(),
    setStepGuard: vi.fn(),
    stepPersistRef: { current: null as (() => void) | null },
    stepDisableRef: { current: null as (() => void) | null },
    currentStepIndex: 0,
    removeCompletedStep: vi.fn(),
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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ProfileRequirementsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    </QueryClientProvider>
  );
  return {
    onNext,
    onBack,
    onSubmit,
    onCancel: formValue.onCancel,
    setForm: formValue.setForm,
    removeCompletedStep: formValue.removeCompletedStep,
    stepDisableRef: formValue.stepDisableRef,
    stepPersistRef: formValue.stepPersistRef,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProfileRequirementsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlacesCityQuery.mockReturnValue({ data: [], isFetching: false });
    mockUsePlacesStateQuery.mockReturnValue({ data: [], isFetching: false });
    mockUsePlacesCountryQuery.mockReturnValue({ data: [], isFetching: false });
    mockGetByState.mockResolvedValue([]);
    mockGetByCountry.mockResolvedValue([]);
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

    it.each([
      ['renders the gender field label', 'profileRequirements.gender'],
      [
        'renders the marital status field label',
        'profileRequirements.maritalStatus',
      ],
      [
        'renders the addresses section title',
        'profileRequirements.addressesTitle',
      ],
    ])('%s', (_description, expectedText) => {
      renderStep();
      expect(screen.getByText(expectedText)).toBeInTheDocument();
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

    it('persists profile requirements data before navigating back', async () => {
      const user = userEvent.setup();
      const { onBack, setForm } = renderStep({
        isEnabled: true,
        dataTakenFromCandidate: false,
        gender: { id: 'male', label: 'Male' },
        maritalStatus: { id: 'single', label: 'Single' },
        addresses: [
          {
            city: { id: 'city-1', label: 'Aachen' },
            stateProvince: { id: 'state-1', label: 'North Rhine-Westphalia' },
            country: { id: 'country-1', label: 'Germany' },
            postalCode: '52062',
          },
        ],
      });

      await user.click(
        screen.getByRole('button', { name: 'profileRequirements.back' })
      );

      expect(setForm).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledTimes(1);

      const updater = setForm.mock.calls[0]?.[0] as
        | ((prev: {
            profileRequirements?: {
              isEnabled: boolean;
              dataTakenFromCandidate: boolean;
              gender: { id: string; label: string };
              maritalStatus: { id: string; label: string };
              addresses: Array<{
                city: { id: string; label: string };
                stateProvince: { id: string; label: string };
                country: { id: string; label: string };
                postalCode: string;
              }>;
            };
          }) => unknown)
        | undefined;

      expect(typeof updater).toBe('function');

      const result = updater?.({
        profileRequirements: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          gender: { id: '', label: '' },
          maritalStatus: { id: '', label: '' },
          addresses: [],
        },
      });

      expect(result).toMatchObject({
        profileRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          gender: { id: 'male', label: 'Male' },
          maritalStatus: { id: 'single', label: 'Single' },
          addresses: [
            {
              city: { id: 'city-1', label: 'Aachen' },
              stateProvince: {
                id: 'state-1',
                label: 'North Rhine-Westphalia',
              },
              country: { id: 'country-1', label: 'Germany' },
              postalCode: '52062',
            },
          ],
        },
      });
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
    it('keeps Next disabled when step is enabled but no data', () => {
      renderStep({ isEnabled: true });

      expect(screen.getByText('profileRequirements.nextButton')).toBeDisabled();

      expect(
        screen.queryByText('profileRequirements.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
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

    it.each([
      ['renders city field label', 'profileRequirements.city'],
      [
        'renders state/province field label',
        'profileRequirements.stateProvince',
      ],
      ['renders country field label', 'profileRequirements.country'],
      ['renders postal code field label', 'profileRequirements.postalCode'],
    ])('%s', (_description, expectedText) => {
      renderStep();
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  describe('gender and marital status selection', () => {
    it('updates the gender value when an option is selected', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: true });

      const [genderSelect] = screen.getAllByRole('combobox');
      await user.selectOptions(genderSelect, 'male');

      expect(genderSelect).toHaveValue('male');
    });

    it('updates the marital status value when an option is selected', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: true });

      const [, maritalStatusSelect] = screen.getAllByRole('combobox');
      await user.selectOptions(maritalStatusSelect, 'single');

      expect(maritalStatusSelect).toHaveValue('single');
    });

    it('clears a previously selected gender via the first "clear" dropdown option', async () => {
      const user = userEvent.setup();
      renderStep({
        isEnabled: true,
        gender: { id: 'male', label: 'Male' },
      });

      const [genderSelect] = screen.getAllByRole('combobox');
      expect(genderSelect).toHaveValue('male');

      await user.selectOptions(genderSelect, '__unselected__');

      expect(genderSelect).toHaveValue('');
    });

    it('clears a previously selected marital status via the first "clear" dropdown option', async () => {
      const user = userEvent.setup();
      renderStep({
        isEnabled: true,
        maritalStatus: { id: 'single', label: 'Single' },
      });

      const [, maritalStatusSelect] = screen.getAllByRole('combobox');
      expect(maritalStatusSelect).toHaveValue('single');

      await user.selectOptions(maritalStatusSelect, '__unselected__');

      expect(maritalStatusSelect).toHaveValue('');
    });
  });

  describe('address place resolution', () => {
    const CITY_ID = '11111111-1111-1111-1111-111111111111';
    const RESOLVED_STATE_ID = '22222222-2222-2222-2222-222222222222';
    const RESOLVED_COUNTRY_ID = '33333333-3333-3333-3333-333333333333';

    it('resolves state and country ref ids when a city option is selected', async () => {
      const user = userEvent.setup();
      mockUsePlacesCityQuery.mockReturnValue({
        data: [
          {
            city: { id: CITY_ID, label: 'Aachen' },
            state: { label: 'North Rhine-Westphalia' },
            country: { label: 'Germany' },
          },
        ],
        isFetching: false,
      });
      mockGetByState.mockResolvedValue([
        {
          state: { id: RESOLVED_STATE_ID, label: 'North Rhine-Westphalia' },
          country: { id: RESOLVED_COUNTRY_ID, label: 'Germany' },
        },
      ]);
      mockGetByCountry.mockResolvedValue([
        { country: { id: RESOLVED_COUNTRY_ID, label: 'Germany' } },
      ]);

      renderStep({ isEnabled: true });

      await user.click(
        screen.getByText(
          'opt:profileRequirements.cityPlaceholder:Aachen, North Rhine-Westphalia, Germany'
        )
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'combobox-profileRequirements.stateProvincePlaceholder-current'
          )
        ).toHaveTextContent('North Rhine-Westphalia, Germany');
      });
      expect(
        screen.getByTestId(
          'combobox-profileRequirements.countryPlaceholder-current'
        )
      ).toHaveTextContent(RESOLVED_COUNTRY_ID);
    });

    it('resolves the country ref id when a state option is selected directly', async () => {
      const user = userEvent.setup();
      const STATE_ID = '44444444-4444-4444-4444-444444444444';
      mockUsePlacesStateQuery.mockReturnValue({
        data: [
          {
            state: { id: STATE_ID, label: 'Bavaria' },
            country: { label: 'Germany' },
          },
        ],
        isFetching: false,
      });
      mockGetByCountry.mockResolvedValue([
        { country: { id: RESOLVED_COUNTRY_ID, label: 'Germany' } },
      ]);

      renderStep({ isEnabled: true });

      await user.click(
        screen.getByText(
          'opt:profileRequirements.stateProvincePlaceholder:Bavaria, Germany'
        )
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'combobox-profileRequirements.countryPlaceholder-current'
          )
        ).toHaveTextContent(RESOLVED_COUNTRY_ID);
      });
    });

    it('sets the country value when a country option is selected directly', async () => {
      const user = userEvent.setup();
      const COUNTRY_ID = '55555555-5555-5555-5555-555555555555';
      mockUsePlacesCountryQuery.mockReturnValue({
        data: [{ country: { id: COUNTRY_ID, label: 'France' } }],
        isFetching: false,
      });

      renderStep({ isEnabled: true });

      await user.click(
        screen.getByText('opt:profileRequirements.countryPlaceholder:France')
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'combobox-profileRequirements.countryPlaceholder-current'
          )
        ).toHaveTextContent(COUNTRY_ID);
      });
    });

    it('clears the previously selected City when a new State/Province is selected', async () => {
      const user = userEvent.setup();
      const STATE_ID = '44444444-4444-4444-4444-444444444444';
      mockUsePlacesStateQuery.mockReturnValue({
        data: [
          {
            state: { id: STATE_ID, label: 'Bavaria' },
            country: { label: 'Germany' },
          },
        ],
        isFetching: false,
      });
      mockGetByCountry.mockResolvedValue([
        { country: { id: RESOLVED_COUNTRY_ID, label: 'Germany' } },
      ]);

      renderStep({
        isEnabled: true,
        addresses: [
          {
            city: { id: 'city-1', label: 'Aachen' },
            stateProvince: { id: 'state-1', label: 'North Rhine-Westphalia' },
            country: { id: 'country-1', label: 'Germany' },
            postalCode: '52062',
          },
        ],
      });

      expect(
        screen.getByTestId(
          'combobox-profileRequirements.cityPlaceholder-current'
        )
      ).toHaveTextContent('Aachen');

      await user.click(
        screen.getByText(
          'opt:profileRequirements.stateProvincePlaceholder:Bavaria, Germany'
        )
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'combobox-profileRequirements.cityPlaceholder-current'
          )
        ).toHaveTextContent('');
      });
    });

    it('clears the previously selected State/Province and City when a new Country is selected', async () => {
      const user = userEvent.setup();
      const COUNTRY_ID = '55555555-5555-5555-5555-555555555555';
      mockUsePlacesCountryQuery.mockReturnValue({
        data: [{ country: { id: COUNTRY_ID, label: 'France' } }],
        isFetching: false,
      });

      renderStep({
        isEnabled: true,
        addresses: [
          {
            city: { id: 'city-1', label: 'Aachen' },
            stateProvince: { id: 'state-1', label: 'North Rhine-Westphalia' },
            country: { id: 'country-1', label: 'Germany' },
            postalCode: '52062',
          },
        ],
      });

      await user.click(
        screen.getByText('opt:profileRequirements.countryPlaceholder:France')
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'combobox-profileRequirements.stateProvincePlaceholder-current'
          )
        ).toHaveTextContent('');
      });
      expect(
        screen.getByTestId(
          'combobox-profileRequirements.cityPlaceholder-current'
        )
      ).toHaveTextContent('');
    });
  });

  describe('duplicate address detection', () => {
    const duplicateAddress = {
      city: { id: 'city-dup', label: 'Aachen' },
      stateProvince: { id: 'state-dup', label: 'North Rhine-Westphalia' },
      country: { id: 'country-dup', label: 'Germany' },
      postalCode: '52062',
      isOpen: true,
    };

    it('clears the entry and shows an error toast when a duplicate address is blurred', async () => {
      renderStep({
        isEnabled: true,
        addresses: [{ ...duplicateAddress }, { ...duplicateAddress }],
      });

      const postalCodeInputs = screen.getAllByPlaceholderText(
        'profileRequirements.postalCodePlaceholder'
      );
      expect(postalCodeInputs).toHaveLength(2);

      fireEvent.blur(postalCodeInputs[0]);

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
          })
        );
      });
      await waitFor(() => {
        expect(postalCodeInputs[0]).toHaveValue('');
      });
    });

    it('blocks submission and shows an error toast when duplicate addresses are submitted', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep({
        isEnabled: true,
        addresses: [{ ...duplicateAddress }, { ...duplicateAddress }],
      });

      await user.click(screen.getByText('profileRequirements.nextButton'));

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalled();
      });
      expect(onNext).not.toHaveBeenCalled();
    });
  });

  describe('empty confirm dialog', () => {
    it('shows the empty-data dialog and disables the step on confirm', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep({ isEnabled: true });

      fireEvent.submit(screen.getByTestId('profileRequirements-section-form'));

      await waitFor(() => {
        expect(
          screen.getByText('profileRequirements.emptyDisableDialog.title')
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByText('profileRequirements.emptyDisableDialog.disable')
      );

      expect(onNext).toHaveBeenCalledWith(
        expect.objectContaining({
          profileRequirements: expect.objectContaining({
            isEnabled: false,
            gender: { id: '', label: '' },
            maritalStatus: { id: '', label: '' },
            addresses: [],
          }),
        })
      );
      expect(
        screen.queryByText('profileRequirements.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
    });
  });

  describe('disable confirmation dialog', () => {
    it('resets the step and notifies on confirm when data is present', async () => {
      const user = userEvent.setup();
      const { removeCompletedStep } = renderStep({
        isEnabled: true,
        gender: { id: 'male', label: 'Male' },
      });

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(screen.getByTestId('step-disable-dialog')).toBeInTheDocument();
      });

      await user.click(
        screen.getByText('profileRequirements.disableDialog.confirmButton')
      );

      expect(removeCompletedStep).toHaveBeenCalledWith(0);
      expect(mockSuccessToast).toHaveBeenCalled();
      await waitFor(() => {
        expect(
          screen.queryByTestId('step-disable-dialog')
        ).not.toBeInTheDocument();
      });
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });
  });

  describe('stepDisableRef', () => {
    it('resets profile requirements when invoked externally', () => {
      const { stepDisableRef, setForm } = renderStep({ isEnabled: true });

      stepDisableRef.current?.();

      expect(setForm).toHaveBeenCalledTimes(1);
      const updater = setForm.mock.calls[0]?.[0] as (prev: unknown) => {
        profileRequirements: {
          isEnabled: boolean;
          dataTakenFromCandidate: boolean;
          gender: { id: string; label: string };
          maritalStatus: { id: string; label: string };
          addresses: unknown[];
        };
      };

      const result = updater({});
      expect(result.profileRequirements).toMatchObject({
        isEnabled: false,
        dataTakenFromCandidate: false,
        gender: { id: '', label: '' },
        maritalStatus: { id: '', label: '' },
        addresses: [],
      });
    });
  });

  describe('add/remove address cards', () => {
    it('appends a new address card when Add is clicked', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: true });

      expect(
        screen.getAllByText(/profileRequirements.addressTitle/)
      ).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: '' }));

      await waitFor(() => {
        expect(
          screen.getAllByText(/profileRequirements.addressTitle/)
        ).toHaveLength(2);
      });
    });

    it('shows an error toast instead of appending beyond the max entries', async () => {
      const user = userEvent.setup();
      const address = {
        city: { id: '', label: '' },
        stateProvince: { id: '', label: '' },
        country: { id: '', label: '' },
        postalCode: '',
        isOpen: true,
      };
      renderStep({
        isEnabled: true,
        addresses: [address, address, address, address, address],
      });

      expect(
        screen.getAllByText(/profileRequirements.addressTitle/)
      ).toHaveLength(5);

      await user.click(screen.getByRole('button', { name: '' }));

      await waitFor(() => {
        expect(mockErrorToast).toHaveBeenCalled();
      });
      expect(
        screen.getAllByText(/profileRequirements.addressTitle/)
      ).toHaveLength(5);
    });

    it('removes an address card when its remove button is clicked', async () => {
      const user = userEvent.setup();
      const address = {
        city: { id: '', label: '' },
        stateProvince: { id: '', label: '' },
        country: { id: '', label: '' },
        postalCode: '',
        isOpen: true,
      };
      renderStep({
        isEnabled: true,
        addresses: [address, { ...address }],
      });

      expect(
        screen.getAllByText(/profileRequirements.addressTitle/)
      ).toHaveLength(2);

      const removeButtons = screen.getAllByRole('button', {
        name: 'profileRequirements.removeAddress',
      });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(
          screen.getAllByText(/profileRequirements.addressTitle/)
        ).toHaveLength(1);
      });
    });
  });

  describe('postal code sanitization', () => {
    it('strips disallowed characters as the user types', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: true });

      const postalCodeInput = screen.getByPlaceholderText(
        'profileRequirements.postalCodePlaceholder'
      );
      await user.type(postalCodeInput, 'AB#12');

      expect(postalCodeInput).not.toHaveValue('AB#12');
      expect((postalCodeInput as HTMLInputElement).value).not.toContain('#');
    });
  });
});
