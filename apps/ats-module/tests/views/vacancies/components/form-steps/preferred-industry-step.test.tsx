import type { ReactNode } from 'react';
import { forwardRef, useRef, useState } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredIndustryStep from '@/views/vacancies/components/form-steps/preferred-industry-step';

// ── Hoisted mock refs ────────────────────────────────────────────────────────

const mockSuccessToast = vi.hoisted(() => vi.fn());
const mockUseVacancyForm = vi.hoisted(() => vi.fn());
const mockUseIndustriesQuery = vi.hoisted(() => vi.fn());

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
  useIndustriesQuery: mockUseIndustriesQuery,
  useDisableSuccessToast: () => mockSuccessToast,
  useCreateIndustryMutation: () => ({ mutateAsync: vi.fn() }),
  useStepGuard: vi.fn(),
}));

vi.mock('@/views/vacancies/services', () => ({
  industryService: { getIndustries: vi.fn() },
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
      onMaxSelected,
      placeholder,
      disabled,
      creatable,
      maxSelected,
    }: {
      value?: Option[];
      options?: Option[];
      onChange?: (opts: Option[]) => void;
      onSearchSync?: (v: string) => Option[];
      onMaxSelected?: (max: number) => void;
      placeholder?: string;
      disabled?: boolean;
      creatable?: boolean;
      maxSelected?: number;
      [k: string]: unknown;
    },
    _ref: unknown
  ) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

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
    const showEmpty = open && displayOptions.length === 0;

    return (
      <div data-testid="multi-selector">
        {value.map(v => (
          <span key={v.value} data-testid="chip">
            {v.label}
            <button
              aria-label="preferredIndustries.chip.remove"
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
        {open && (
          <ul data-testid="multi-selector-options">
            {filtered.map(o => (
              <li
                key={o.value}
                onClick={() => {
                  if (maxSelected && value.length >= maxSelected) {
                    onMaxSelected?.(value.length);
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
                    onMaxSelected?.(value.length);
                    return;
                  }
                  onChange?.([...value, { value: search, label: search }]);
                  setSearch('');
                }}
              >
                preferredIndustries.input.addNew
              </li>
            )}
            {showEmpty && (
              <li data-testid="empty-indicator">common.noDataTitle</li>
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

const API_INDUSTRIES = [
  { id: 'ind-1', label: 'Healthcare', source: 'MASTER' },
  { id: 'ind-2', label: 'Finance', source: 'MASTER' },
  { id: 'ind-3', label: 'Technology', source: 'PENDING' },
];

function makeQueryData(content = API_INDUSTRIES) {
  return { data: { data: { items: { content } } } };
}

function makeForm(
  overrides: Partial<{
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    industries: { id: string; label: string; source?: string }[];
  }> = {}
) {
  return {
    form: {
      preferredIndustries: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        industries: [],
        ...overrides,
      },
    },
    setForm: vi.fn(),
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

  mockUseVacancyForm.mockImplementation(() => {
    const initial = makeForm(formOverrides).form;
    const [formState, setFormState] = useState(initial);
    const stepPersistRef = useRef<(() => void) | null>(null);
    const stepDisableRef = useRef<(() => void) | null>(null);

    return {
      form: formState,
      setForm: (
        updater:
          | typeof formState
          | ((prev: typeof formState) => typeof formState)
      ) => {
        setFormState(prev =>
          typeof updater === 'function' ? updater(prev) : updater
        );
      },
      stepPersistRef,
      stepDisableRef,
    };
  });

  render(
    <PreferredIndustryStep
      onNext={onNext}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
  return { onNext, onBack, onSubmit };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PreferredIndustryStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIndustriesQuery.mockReturnValue(makeQueryData());
  });

  describe('rendering', () => {
    it('renders the section heading', () => {
      renderStep();
      expect(screen.getByText('preferredIndustries.title')).toBeInTheDocument();
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
        screen.getByLabelText('preferredIndustries.dataTakenFromCandidate')
      ).toBeInTheDocument();
    });

    it('renders the section label', () => {
      renderStep();
      expect(
        screen.getByText('preferredIndustries.sectionLabel')
      ).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
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
      renderStep({ industries: [{ id: 'ind-1', label: 'Healthcare' }] });

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(
          screen.getByText('preferredIndustries.confirmDisableDialog.title')
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
        industries: [{ id: 'ind-1', label: 'Healthcare' }],
      });
      await user.click(screen.getByRole('switch'));
      await screen.findByText('preferredIndustries.confirmDisableDialog.title');
      return { user, ...handlers };
    }

    it('closes without disabling when Cancel is clicked', async () => {
      const { user } = await openConfirmDialog();

      await user.click(screen.getByText('common.disableDialog.cancelButton'));

      expect(
        screen.queryByText('preferredIndustries.confirmDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it('disables the step when Disable is clicked', async () => {
      const { user } = await openConfirmDialog();

      await user.click(
        screen.getByText('preferredIndustries.confirmDisableDialog.disable')
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
        screen.getByText('preferredIndustries.confirmDisableDialog.disable')
      );

      expect(mockSuccessToast).toHaveBeenCalledWith(
        'preferredIndustries.title'
      );
    });
  });

  describe('emptyDisableDialog', () => {
    it('shows when Next is clicked with no items selected', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));

      expect(
        screen.getByText('preferredIndustries.emptyDisableDialog.title')
      ).toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not show when dataTakenFromCandidate is checked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByLabelText('preferredIndustries.dataTakenFromCandidate')
      );
      await user.click(screen.getByText('common.next'));

      expect(
        screen.queryByText('preferredIndustries.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('closes without changing state when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));
      await screen.findByText('preferredIndustries.emptyDisableDialog.title');
      await user.click(screen.getByText('common.disableDialog.cancelButton'));

      expect(
        screen.queryByText('preferredIndustries.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('calls onNext with disabled payload when Disable is clicked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));
      await screen.findByText('preferredIndustries.emptyDisableDialog.title');
      await user.click(
        screen.getByText('preferredIndustries.emptyDisableDialog.disable')
      );

      expect(onNext).toHaveBeenCalledWith({
        preferredIndustries: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          industries: [],
        },
      });
    });

    it('fires SuccessToast when Disable is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByText('common.next'));
      await screen.findByText('preferredIndustries.emptyDisableDialog.title');
      await user.click(
        screen.getByText('preferredIndustries.emptyDisableDialog.disable')
      );

      expect(mockSuccessToast).toHaveBeenCalledWith(
        'preferredIndustries.title'
      );
    });
  });

  describe('search and selection', () => {
    it('shows API industries in the dropdown when the input is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
      );

      expect(screen.getByText('Healthcare')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });

    it('preserves MASTER source when selecting from the dropdown', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
      );
      await user.click(screen.getByText('Healthcare'));
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredIndustries: expect.objectContaining({
          industries: [
            expect.objectContaining({
              id: 'ind-1',
              label: 'Healthcare',
              source: 'MASTER',
            }),
          ],
        }),
      });
    });

    it('preserves PENDING source when selecting a PENDING item from the dropdown', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
      );
      await user.click(screen.getByText('Technology'));
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredIndustries: expect.objectContaining({
          industries: [
            expect.objectContaining({
              id: 'ind-3',
              label: 'Technology',
              source: 'PENDING',
            }),
          ],
        }),
      });
    });

    it('preserves PENDING source on existing selected industries loaded from form state', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep({
        industries: [{ id: 'ind-3', label: 'Technology', source: 'PENDING' }],
      });

      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredIndustries: expect.objectContaining({
          industries: [
            expect.objectContaining({
              id: 'ind-3',
              label: 'Technology',
              source: 'PENDING',
            }),
          ],
        }),
      });
    });

    it('shows "add new" option when typing an unrecognised value', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredIndustries.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'Hospitality');

      expect(
        screen.getByText('preferredIndustries.input.addNew')
      ).toBeInTheDocument();
    });

    it('does not show "add new" when typed text matches an existing item', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredIndustries.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'Healthcare');

      expect(
        screen.queryByText('preferredIndustries.input.addNew')
      ).not.toBeInTheDocument();
    });

    it('adds a custom industry chip when "Add new" is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredIndustries.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'Hospitality');
      await user.click(screen.getByText('preferredIndustries.input.addNew'));

      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);
    });

    it('prevents case-insensitive duplicate chips for custom values', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      const input = screen.getByPlaceholderText(
        'preferredIndustries.input.placeholder'
      );

      await user.click(input);
      await user.type(input, 'Marketing');
      await user.click(screen.getByText('preferredIndustries.input.addNew'));

      await user.click(input);
      await user.type(input, 'mArKeTiNg');
      await user.click(screen.getByText('preferredIndustries.input.addNew'));

      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredIndustries: expect.objectContaining({
          industries: [
            expect.objectContaining({
              label: 'Marketing',
            }),
          ],
        }),
      });
    });

    it('selects an API industry chip when clicked in the dropdown', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
      );
      await user.click(screen.getByText('Finance'));

      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);
    });

    it('removes an industry chip when the remove button is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
      );
      await user.click(screen.getByText('Finance'));
      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);

      await user.click(
        screen.getByRole('button', {
          name: 'preferredIndustries.chip.remove',
        })
      );

      expect(screen.queryAllByTestId('chip')).toHaveLength(0);
    });

    it('shows max-industries error when the user tries to add beyond the limit', async () => {
      const tenIndustries = Array.from({ length: 10 }, (_, i) => ({
        id: `selected-${i}`,
        label: `Industry ${i}`,
      }));
      renderStep({ industries: tenIndustries });

      const user = userEvent.setup();
      await user.click(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
      );
      await user.click(screen.getByText('Finance')); // 11th — triggers max error

      await waitFor(() => {
        expect(
          screen.getByText('preferredIndustries.validation.maxIndustries')
        ).toBeInTheDocument();
      });
    });

    it('shows empty indicator when search returns no results', async () => {
      mockUseIndustriesQuery.mockReturnValue(makeQueryData([]));
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
      );

      await waitFor(() => {
        expect(screen.getByTestId('empty-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('dataTakenFromCandidate', () => {
    it('disables the search input when checked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByLabelText('preferredIndustries.dataTakenFromCandidate')
      );

      expect(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
      ).toBeDisabled();
    });

    it('clears selected industries when checked', async () => {
      const user = userEvent.setup();
      renderStep({
        industries: [
          { id: 'ind-1', label: 'Healthcare' },
          { id: 'ind-2', label: 'Finance' },
        ],
      });

      expect(screen.getAllByTestId('chip')).toHaveLength(2);

      await user.click(
        screen.getByLabelText('preferredIndustries.dataTakenFromCandidate')
      );

      expect(screen.queryAllByTestId('chip')).toHaveLength(0);
    });

    it('calls onNext directly without emptyDisableDialog when checked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByLabelText('preferredIndustries.dataTakenFromCandidate')
      );
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredIndustries: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          industries: [],
        },
      });
    });

    it('does not clear selections when unchecked', async () => {
      const user = userEvent.setup();
      renderStep({
        dataTakenFromCandidate: true,
        industries: [{ id: 'ind-1', label: 'Healthcare' }],
      });

      await user.click(
        screen.getByLabelText('preferredIndustries.dataTakenFromCandidate')
      );

      expect(screen.getAllByTestId('chip')).toHaveLength(1);
    });
  });

  describe('footer navigation', () => {
    it('calls onBack when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const { onBack } = renderStep();

      await user.click(screen.getByText('common.cancel'));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onBack when the header back button is clicked', async () => {
      const user = userEvent.setup();
      const { onBack } = renderStep();

      await user.click(screen.getByRole('button', { name: 'common.back' }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onNext with form data when Next is clicked with selections', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredIndustries.input.placeholder')
      );
      await user.click(screen.getByText('Healthcare'));
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredIndustries: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          industries: [
            expect.objectContaining({ id: 'ind-1', label: 'Healthcare' }),
          ],
        },
      });
    });
  });
});
