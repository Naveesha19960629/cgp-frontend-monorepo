import type { ReactNode } from 'react';
import { forwardRef, useState } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredHobbiesStep from '@/views/vacancies/components/form-steps/preferred-hobbies-step';

// ── Hoisted mock refs ────────────────────────────────────────────────────────

const mockSuccessToast = vi.hoisted(() => vi.fn());
const mockUseVacancyForm = vi.hoisted(() => vi.fn());
const mockUseHobbiesQuery = vi.hoisted(() => vi.fn());

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: mockSuccessToast,
}));

vi.mock('@cgp/ui-kit/assets/images/delete-confirm-avator.svg', () => ({
  default: 'avatar.svg',
}));

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useVacancyForm: mockUseVacancyForm,
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useHobbiesQuery: mockUseHobbiesQuery,
  useDisableSuccessToast: () => mockSuccessToast,
  useCreateHobbyMutation: () => ({ mutateAsync: vi.fn() }),
  useStepGuard: vi.fn(),
}));

vi.mock('@/views/vacancies/services', () => ({
  hobbyService: { getAllHobbies: vi.fn() },
}));

vi.mock('@/views/vacancies/utils', () => ({
  resolveUserCreatedEntries: vi.fn((entries: unknown[]) => entries),
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => null,
}));

vi.mock('@cgp/ui-kit/components/multi-select', () => {
  type Option = { value: string; label: string; source?: string };

  const MockMultipleSelector = forwardRef(function MockMultipleSelector(
    {
      value = [],
      options = [],
      onChange,
      onSearchSync,
      placeholder,
      disabled,
      creatable,
      maxSelected,
      errorMessage,
      onErrorStateChange,
    }: {
      value?: Option[];
      options?: Option[];
      onChange?: (opts: Option[]) => void;
      onSearchSync?: (v: string) => Option[];
      placeholder?: string;
      disabled?: boolean;
      creatable?: boolean;
      maxSelected?: number;
      errorMessage?: string;
      onErrorStateChange?: (v: boolean) => void;
      [k: string]: unknown;
    },
    _ref: unknown
  ) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [maxError, setMaxError] = useState(false);

    const displayOptions = onSearchSync ? onSearchSync(search) : options;
    const filtered = displayOptions.filter(
      o =>
        o.label.toLowerCase().includes(search.toLowerCase()) &&
        !value.some(v => v.value === o.value)
    );
    const showAddNew =
      creatable &&
      search.trim() &&
      !displayOptions.some(o => o.label.toLowerCase() === search.toLowerCase());

    return (
      <div data-testid="multi-selector">
        {value.map(v => (
          <span key={v.value} data-testid="chip">
            {v.label}
            <button
              aria-label="preferredHobbies.chip.remove"
              onClick={() => onChange?.(value.filter(x => x.value !== v.value))}
            />
          </span>
        ))}
        <input
          placeholder={placeholder}
          disabled={disabled}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        {maxError && <span>{errorMessage}</span>}
        {open && (
          <ul data-testid="multi-selector-options">
            {filtered.map(o => (
              <li
                key={o.value}
                onClick={() => {
                  if (maxSelected && value.length >= maxSelected) {
                    setMaxError(true);
                    onErrorStateChange?.(true);
                    return;
                  }
                  onChange?.([...value, o]);
                  setSearch('');
                }}
              >
                {o.label}
              </li>
            ))}
            {showAddNew && (
              <li
                onClick={() => {
                  if (maxSelected && value.length >= maxSelected) {
                    setMaxError(true);
                    onErrorStateChange?.(true);
                    return;
                  }
                  onChange?.([...value, { value: search, label: search }]);
                  setSearch('');
                }}
              >
                preferredHobbies.input.addNew
              </li>
            )}
          </ul>
        )}
      </div>
    );
  });

  return { default: MockMultipleSelector };
});

vi.mock('@cgp/ui-kit/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    type,
    ...rest
  }: {
    children?: ReactNode;
    onClick?: () => void;
    type?: string;
    [k: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      type={(type ?? 'button') as 'button' | 'submit'}
      {...rest}
    >
      {children}
    </button>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/checkbox', () => ({
  Checkbox: ({
    id,
    checked,
    onCheckedChange,
  }: {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (v: boolean) => void;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked ?? false}
      onChange={e => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open?: boolean; children?: ReactNode }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children?: ReactNode }) => (
    <dialog open>{children}</dialog>
  ),
  DialogTitle: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children?: ReactNode }) => (
    <p>{children}</p>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/badge', () => ({
  Badge: ({ children }: { children?: ReactNode }) => (
    <div data-testid="chip">{children}</div>
  ),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const API_HOBBIES = [
  { id: 'hobby-1', label: 'Reading' },
  { id: 'hobby-2', label: 'Hiking' },
];

function makeQueryData(content = API_HOBBIES) {
  return { data: { data: { items: { content } } } };
}

function makeForm(
  overrides: Partial<{
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    hobbies: { id: string; label: string }[];
  }> = {}
) {
  return {
    form: {
      preferredHobbies: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        hobbies: [],
        ...overrides,
      },
    },
    setForm: vi.fn(),
    onCancel: vi.fn(),
    stepPersistRef: { current: null },
    stepDisableRef: { current: null },
    currentStepIndex: 0,
    removeCompletedStep: vi.fn(),
  };
}

function renderStep(formOverrides: Parameters<typeof makeForm>[0] = {}) {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();
  const vacancyFormState = makeForm(formOverrides);
  mockUseVacancyForm.mockReturnValue(vacancyFormState);
  render(
    <PreferredHobbiesStep onNext={onNext} onBack={onBack} onSubmit={onSubmit} />
  );
  return { onNext, onBack, onSubmit, onCancel: vacancyFormState.onCancel };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PreferredHobbiesStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHobbiesQuery.mockReturnValue(makeQueryData());
  });

  describe('rendering', () => {
    it('renders the section heading', () => {
      renderStep();
      expect(screen.getByText('preferredHobbies.title')).toBeInTheDocument();
    });

    it('renders the toggle switch as enabled by default', () => {
      renderStep();
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it('renders the toggle switch as disabled when form state is disabled', () => {
      renderStep({ isEnabled: false });
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });

    it('renders the dataTakenFromCandidate checkbox', () => {
      renderStep();
      expect(
        screen.getByLabelText('preferredHobbies.dataTakenFromCandidate')
      ).toBeInTheDocument();
    });

    it('renders the section label', () => {
      renderStep();
      expect(
        screen.getByText('preferredHobbies.sectionLabel')
      ).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('preferredHobbies.input.placeholder')
      ).toBeInTheDocument();
    });

    it('renders Cancel and Next buttons', () => {
      renderStep();
      expect(screen.getByText('common.cancel')).toBeInTheDocument();
      expect(screen.getByText('common.next')).toBeInTheDocument();
    });
  });

  describe('toggle', () => {
    it('opens confirmDisableDialog when toggle is clicked while enabled and has data', async () => {
      const user = userEvent.setup();
      renderStep({ hobbies: [{ id: 'hobby-1', label: 'Reading' }] });

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(
          screen.getByText('preferredHobbies.confirmDisableDialog.title')
        ).toBeInTheDocument();
      });
    });

    it('disables directly when toggle is clicked with no data', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(screen.getByRole('switch')).toHaveAttribute(
          'aria-checked',
          'false'
        );
      });
    });

    it('enables the step when toggle is clicked while disabled', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: false });

      await user.click(screen.getByRole('switch'));

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });
  });

  describe('confirmDisableDialog', () => {
    async function openConfirmDialog() {
      const user = userEvent.setup();
      const handlers = renderStep({
        hobbies: [{ id: 'hobby-1', label: 'Reading' }],
      });
      await user.click(screen.getByRole('switch'));
      await screen.findByText('preferredHobbies.confirmDisableDialog.title');
      return { user, ...handlers };
    }

    it('closes without disabling when Cancel is clicked', async () => {
      const { user } = await openConfirmDialog();

      await user.click(
        screen.getByText('preferredHobbies.confirmDisableDialog.cancel')
      );

      expect(
        screen.queryByText('preferredHobbies.confirmDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it('disables the step when Disable is clicked', async () => {
      const { user } = await openConfirmDialog();

      await user.click(
        screen.getByText('preferredHobbies.confirmDisableDialog.disable')
      );

      await waitFor(() => {
        expect(screen.getByRole('switch')).toHaveAttribute(
          'aria-checked',
          'false'
        );
      });
    });

    it('fires SuccessToast when Disable is clicked', async () => {
      const { user } = await openConfirmDialog();

      await user.click(
        screen.getByText('preferredHobbies.confirmDisableDialog.disable')
      );

      expect(mockSuccessToast).toHaveBeenCalledWith('preferredHobbies.title');
    });
  });

  describe('emptyDisableDialog', () => {
    it('keeps Next disabled when enabled with no items selected', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();
      const nextButton = screen.getByText('common.next');

      expect(nextButton).toBeDisabled();

      await user.click(nextButton);

      expect(
        screen.queryByText('preferredHobbies.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not show when dataTakenFromCandidate is checked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByLabelText('preferredHobbies.dataTakenFromCandidate')
      );
      await user.click(screen.getByText('common.next'));

      expect(
        screen.queryByText('preferredHobbies.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('does not open emptyDisableDialog while Next is disabled', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));

      expect(
        screen.queryByText('preferredHobbies.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not call onNext with disabled payload while Next is disabled', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));
      expect(
        screen.queryByText('preferredHobbies.emptyDisableDialog.title')
      ).not.toBeInTheDocument();

      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not fire SuccessToast while Next is disabled', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByText('common.next'));
      expect(
        screen.queryByText('preferredHobbies.emptyDisableDialog.title')
      ).not.toBeInTheDocument();

      expect(mockSuccessToast).not.toHaveBeenCalled();
    });
  });

  describe('search and selection', () => {
    it('shows API hobbies in the dropdown when the input is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredHobbies.input.placeholder')
      );

      expect(screen.getByText('Reading')).toBeInTheDocument();
      expect(screen.getByText('Hiking')).toBeInTheDocument();
    });

    it('shows "add new" option when typing an unrecognised value', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredHobbies.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'Painting');

      expect(
        screen.getByText('preferredHobbies.input.addNew')
      ).toBeInTheDocument();
    });

    it('does not show "add new" when typed text matches an existing item', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredHobbies.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'Reading');

      expect(
        screen.queryByText('preferredHobbies.input.addNew')
      ).not.toBeInTheDocument();
    });

    it('adds a custom hobby chip when "Add new" is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredHobbies.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'Painting');
      await user.click(screen.getByText('preferredHobbies.input.addNew'));

      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);
    });

    it('selects an API hobby chip when clicked in the dropdown', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredHobbies.input.placeholder')
      );
      await user.click(screen.getByText('Hiking'));

      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);
    });

    it('removes a hobby chip when the remove button is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredHobbies.input.placeholder')
      );
      await user.click(screen.getByText('Hiking'));
      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);

      await user.click(
        screen.getByRole('button', { name: 'preferredHobbies.chip.remove' })
      );

      expect(screen.queryAllByTestId('chip')).toHaveLength(0);
    });

    it('shows max-hobbies error when the selection limit is reached', async () => {
      const tenHobbies = Array.from({ length: 10 }, (_, i) => ({
        id: `selected-${i}`,
        label: `Hobby ${i}`,
      }));
      renderStep({ hobbies: tenHobbies });

      const user = userEvent.setup();
      await user.click(
        screen.getByPlaceholderText('preferredHobbies.input.placeholder')
      );
      await user.click(screen.getByText('Hiking')); // 11th — triggers max error

      await waitFor(() => {
        expect(
          screen.getByText('preferredHobbies.validation.maxHobbies')
        ).toBeInTheDocument();
      });
    });
  });

  describe('dataTakenFromCandidate', () => {
    it('disables the search input when checked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByLabelText('preferredHobbies.dataTakenFromCandidate')
      );

      expect(
        screen.getByPlaceholderText('preferredHobbies.input.placeholder')
      ).toBeDisabled();
    });

    it('calls onNext directly without emptyDisableDialog when checked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByLabelText('preferredHobbies.dataTakenFromCandidate')
      );
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredHobbies: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          hobbies: [],
        },
      });
    });
  });

  describe('footer navigation', () => {
    it('calls onCancel from vacancy form context when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const { onCancel } = renderStep();

      await user.click(screen.getByText('common.cancel'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onBack when the header back button is clicked', async () => {
      const user = userEvent.setup();
      const { onBack } = renderStep({
        hobbies: [{ id: 'hobby-1', label: 'Reading' }],
      });

      await user.click(screen.getByRole('button', { name: 'common.back' }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onNext with form data when Next is clicked with selections', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredHobbies.input.placeholder')
      );
      await user.click(screen.getByText('Reading'));
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredHobbies: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          hobbies: [
            expect.objectContaining({ id: 'hobby-1', label: 'Reading' }),
          ],
        },
      });
    });
  });
});
