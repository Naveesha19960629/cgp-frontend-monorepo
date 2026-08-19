import type { ReactNode } from 'react';
import { forwardRef, useEffect, useState } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredLanguagesStep from '@/views/vacancies/components/form-steps/preferred-languages-step';

// ── Hoisted mock refs ────────────────────────────────────────────────────────

const mockSuccessToast = vi.hoisted(() => vi.fn());
const mockUseVacancyForm = vi.hoisted(() => vi.fn());
const mockUseLanguagesQuery = vi.hoisted(() => vi.fn());

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
  useTemplateFieldVisible: () => () => true,
  useVacancyForm: mockUseVacancyForm,
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useLanguagesQuery: mockUseLanguagesQuery,
  useDisableSuccessToast: () => mockSuccessToast,
  useCreateLanguageMutation: () => ({ mutateAsync: vi.fn() }),
  useStepGuard: vi.fn(),
}));

vi.mock('@/views/vacancies/services', () => ({
  languageService: { getAllLanguages: vi.fn() },
}));

vi.mock('@/views/vacancies/utils', () => ({
  resolveUserCreatedEntries: vi.fn((entries: unknown[]) => entries),
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: ({ currentLength }: { currentLength: number }) => (
    <span data-testid="languages-character-count">{currentLength}</span>
  ),
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
    const [syncedOptions, setSyncedOptions] = useState<Option[]>(options);

    // Only re-run the (side-effecting) onSearchSync when `search` actually
    // changes, mirroring the real component's debounced-effect timing —
    // calling it unconditionally during render caused it to re-fire (with
    // stale search text) whenever an unrelated prop like `disabled` changed.
    useEffect(() => {
      if (onSearchSync) {
        setSyncedOptions(onSearchSync(search));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const displayOptions = onSearchSync ? syncedOptions : options;
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
              aria-label="preferredLanguages.chip.remove"
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
                preferredLanguages.input.addNew
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

vi.mock('@/views/vacancies/components/vacancy-status-badge', () => ({
  default: ({ status }: { status: string }) => (
    <div data-testid="vacancy-status-badge">{status}</div>
  ),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const API_LANGUAGES = [
  { id: 'lang-1', label: 'English' },
  { id: 'lang-2', label: 'French' },
];

function makeQueryData(content = API_LANGUAGES) {
  return { data: { data: { items: { content } } } };
}

function makeForm(
  overrides: Partial<{
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    languages: { id: string; label: string }[];
    status?: string;
  }> = {}
) {
  const { status, ...languagesOverrides } = overrides;
  return {
    form: {
      preferredLanguages: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        languages: [],
        ...languagesOverrides,
      },
      status,
    },
    setForm: vi.fn(),
    onCancel: vi.fn(),
    stepPersistRef: { current: null },
    stepDisableRef: { current: null },
    currentStepIndex: 0,
    removeCompletedStep: vi.fn(),
  };
}

function renderStep(
  formOverrides: Parameters<typeof makeForm>[0] = {},
  props: { mode?: 'create' | 'edit' } = {}
) {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();
  const vacancyFormState = makeForm(formOverrides);
  mockUseVacancyForm.mockReturnValue(vacancyFormState);
  render(
    <PreferredLanguagesStep
      onNext={onNext}
      onBack={onBack}
      onSubmit={onSubmit}
      mode={props.mode}
    />
  );
  return { onNext, onBack, onSubmit, onCancel: vacancyFormState.onCancel };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PreferredLanguagesStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLanguagesQuery.mockReturnValue(makeQueryData());
  });

  describe('rendering', () => {
    it('renders the section heading', () => {
      renderStep();
      expect(screen.getByText('preferredLanguages.title')).toBeInTheDocument();
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
        screen.getByLabelText('preferredLanguages.dataTakenFromCandidate')
      ).toBeInTheDocument();
    });

    it('renders the section label', () => {
      renderStep();
      expect(
        screen.getByText('preferredLanguages.sectionLabel')
      ).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('preferredLanguages.input.placeholder')
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
      renderStep({ languages: [{ id: 'lang-1', label: 'English' }] });

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(
          screen.getByText('preferredLanguages.confirmDisableDialog.title')
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

    it('resets the character counter when disabled with uncommitted search text (DQCGP-2866)', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.type(
        screen.getByPlaceholderText('preferredLanguages.input.placeholder'),
        'Swahili'
      );
      expect(screen.getByTestId('languages-character-count')).toHaveTextContent(
        '7'
      );

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(
          screen.getByTestId('languages-character-count')
        ).toHaveTextContent('0');
      });
    });
  });

  describe('confirmDisableDialog', () => {
    async function openConfirmDialog() {
      const user = userEvent.setup();
      const handlers = renderStep({
        languages: [{ id: 'lang-1', label: 'English' }],
      });
      await user.click(screen.getByRole('switch'));
      await screen.findByText('preferredLanguages.confirmDisableDialog.title');
      return { user, ...handlers };
    }

    it('closes without disabling when Cancel is clicked', async () => {
      const { user } = await openConfirmDialog();

      await user.click(
        screen.getByText('preferredLanguages.confirmDisableDialog.cancel')
      );

      expect(
        screen.queryByText('preferredLanguages.confirmDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it('disables the step when Disable is clicked', async () => {
      const { user } = await openConfirmDialog();

      await user.click(
        screen.getByText('preferredLanguages.confirmDisableDialog.disable')
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
        screen.getByText('preferredLanguages.confirmDisableDialog.disable')
      );

      expect(mockSuccessToast).toHaveBeenCalledWith('preferredLanguages.title');
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
        screen.queryByText('preferredLanguages.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not show when dataTakenFromCandidate is checked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByLabelText('preferredLanguages.dataTakenFromCandidate')
      );
      await user.click(screen.getByText('common.next'));

      expect(
        screen.queryByText('preferredLanguages.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('does not open emptyDisableDialog while Next is disabled', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));

      expect(
        screen.queryByText('preferredLanguages.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not call onNext with disabled payload while Next is disabled', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));
      expect(
        screen.queryByText('preferredLanguages.emptyDisableDialog.title')
      ).not.toBeInTheDocument();

      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not fire SuccessToast while Next is disabled', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByText('common.next'));
      expect(
        screen.queryByText('preferredLanguages.emptyDisableDialog.title')
      ).not.toBeInTheDocument();

      expect(mockSuccessToast).not.toHaveBeenCalled();
    });
  });

  describe('search and selection', () => {
    it('shows API languages in the dropdown when the input is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredLanguages.input.placeholder')
      );

      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('French')).toBeInTheDocument();
    });

    it('shows "add new" option when typing an unrecognised value', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredLanguages.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'Swahili');

      expect(
        screen.getByText('preferredLanguages.input.addNew')
      ).toBeInTheDocument();
    });

    it('does not show "add new" when typed text matches an existing item', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredLanguages.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'English');

      expect(
        screen.queryByText('preferredLanguages.input.addNew')
      ).not.toBeInTheDocument();
    });

    it('adds a custom language chip when "Add new" is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredLanguages.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'Swahili');
      await user.click(screen.getByText('preferredLanguages.input.addNew'));

      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);
    });

    it('selects an API language chip when clicked in the dropdown', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredLanguages.input.placeholder')
      );
      await user.click(screen.getByText('English'));

      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);
    });

    it('removes a language chip when the remove button is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredLanguages.input.placeholder')
      );
      await user.click(screen.getByText('English'));
      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);

      await user.click(
        screen.getByRole('button', {
          name: 'preferredLanguages.chip.remove',
        })
      );

      expect(screen.queryAllByTestId('chip')).toHaveLength(0);
    });

    it('shows max-languages error when the selection limit is reached', async () => {
      const tenLangs = Array.from({ length: 10 }, (_, i) => ({
        id: `selected-${i}`,
        label: `Language ${i}`,
      }));
      renderStep({ languages: tenLangs });

      const user = userEvent.setup();
      await user.click(
        screen.getByPlaceholderText('preferredLanguages.input.placeholder')
      );
      await user.click(screen.getByText('English')); // 11th — triggers max error

      await waitFor(() => {
        expect(
          screen.getByText('preferredLanguages.validation.maxLanguages')
        ).toBeInTheDocument();
      });
    });
  });

  describe('dataTakenFromCandidate', () => {
    it('disables the search input when checked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByLabelText('preferredLanguages.dataTakenFromCandidate')
      );

      expect(
        screen.getByPlaceholderText('preferredLanguages.input.placeholder')
      ).toBeDisabled();
    });

    it('calls onNext directly without emptyDisableDialog when dataTakenFromCandidate is checked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByLabelText('preferredLanguages.dataTakenFromCandidate')
      );
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredLanguages: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          languages: [],
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
        languages: [{ id: 'lang-1', label: 'English' }],
      });

      await user.click(screen.getByRole('button', { name: 'common.back' }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onNext with form data when Next is clicked with selections', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredLanguages.input.placeholder')
      );
      await user.click(screen.getByText('English'));
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredLanguages: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          languages: [
            expect.objectContaining({ id: 'lang-1', label: 'English' }),
          ],
        },
      });
    });
  });

  describe('edit mode', () => {
    it('renders with mode="create" by default and does not show VacancyStatusBadge', () => {
      renderStep({}, { mode: 'create' });

      expect(
        screen.queryByTestId('vacancy-status-badge')
      ).not.toBeInTheDocument();
    });

    it('renders VacancyStatusBadge when mode="edit" and vacancyStatus exists', () => {
      renderStep({ status: 'published' }, { mode: 'edit' });

      expect(screen.getByTestId('vacancy-status-badge')).toBeInTheDocument();
      expect(screen.getByTestId('vacancy-status-badge')).toHaveTextContent(
        'published'
      );
    });

    it('does not render VacancyStatusBadge when mode="edit" but vacancyStatus is undefined', () => {
      renderStep({}, { mode: 'edit' });

      expect(
        screen.queryByTestId('vacancy-status-badge')
      ).not.toBeInTheDocument();
    });

    it('does not render VacancyStatusBadge by default when no mode prop is provided', () => {
      renderStep({});

      expect(
        screen.queryByTestId('vacancy-status-badge')
      ).not.toBeInTheDocument();
    });

    it('preserves all functionality when mode="edit"', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep(
        {
          languages: [{ id: 'lang-1', label: 'English' }],
          status: 'published',
        },
        { mode: 'edit' }
      );

      expect(screen.getByTestId('vacancy-status-badge')).toBeInTheDocument();

      // Verify section heading and toggle are still present
      expect(screen.getByText('preferredLanguages.title')).toBeInTheDocument();

      // Verify selection works
      await user.click(
        screen.getByPlaceholderText('preferredLanguages.input.placeholder')
      );
      await user.click(screen.getByText('French'));

      // Verify navigation works
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalled();
    });
  });
});
