import type { ReactNode } from 'react';
import { forwardRef, useState } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredSkillsStep from '@/views/vacancies/components/form-steps/preferred-skills-step';

// ── Hoisted mock refs ────────────────────────────────────────────────────────

const mockSuccessToast = vi.hoisted(() => vi.fn());
const mockUseVacancyForm = vi.hoisted(() => vi.fn());
const mockUseSkillsQuery = vi.hoisted(() => vi.fn());
const mockUseCareerPathsQuery = vi.hoisted(() => vi.fn());

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
  useSkillsQuery: mockUseSkillsQuery,
  useCareerPathsQuery: mockUseCareerPathsQuery,
  useDisableSuccessToast: () => mockSuccessToast,
  useCreateCareerPathMutation: () => ({ mutateAsync: vi.fn() }),
  useCreateSkillCareerPathMutation: () => ({ mutateAsync: vi.fn() }),
  useStepGuard: vi.fn(),
}));

vi.mock('@/views/vacancies/services', () => ({
  careerPathService: { getAllCareerPaths: vi.fn() },
  skillService: { getAllSkills: vi.fn() },
}));

vi.mock('@cgp/ui-kit/components/combobox', () => ({
  Combobox: ({
    placeholder,
    disabled,
    value,
    onValueChange,
  }: {
    placeholder?: string;
    disabled?: boolean;
    value?: string;
    onValueChange?: (v: string) => void;
  }) => (
    <input
      placeholder={placeholder}
      disabled={disabled}
      value={value ?? ''}
      onChange={e => onValueChange?.(e.target.value)}
    />
  ),
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
              aria-label="preferredSkills.chip.remove"
              onClick={() => onChange?.(value.filter(x => x.value !== v.value))}
            />
          </span>
        ))}
        <input
          placeholder={placeholder}
          disabled={disabled}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
          }}
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
                preferredSkills.input.addNew
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

const API_SKILLS = [
  { id: 'skill-1', label: 'JavaScript' },
  { id: 'skill-2', label: 'TypeScript' },
];

const API_CAREER_PATHS = [{ id: 'cp-1', label: 'Frontend Development' }];

function makeSkillsData(content = API_SKILLS) {
  return { data: { data: { items: { content } } } };
}

function makeCareerPathsData(content = API_CAREER_PATHS) {
  return { data: { data: { items: { content } } }, isLoading: false };
}

function makeForm(
  overrides: Partial<{
    isEnabled: boolean;
    dataTakenFromCandidate: boolean;
    skills: unknown[];
    status?: string;
  }> = {}
) {
  const { status, ...skillsOverrides } = overrides;
  return {
    form: {
      preferredSkills: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        skills: [],
        ...skillsOverrides,
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
    <PreferredSkillsStep
      onNext={onNext}
      onBack={onBack}
      onSubmit={onSubmit}
      mode={props.mode}
    />
  );
  return { onNext, onBack, onSubmit, onCancel: vacancyFormState.onCancel };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PreferredSkillsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSkillsQuery.mockReturnValue(makeSkillsData());
    mockUseCareerPathsQuery.mockReturnValue(makeCareerPathsData());
  });

  describe('rendering', () => {
    it('renders the section heading', () => {
      renderStep();
      expect(screen.getByText('preferredSkills.title')).toBeInTheDocument();
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
        screen.getByLabelText('preferredSkills.dataTakenFromCandidate')
      ).toBeInTheDocument();
    });

    it('renders the section label', () => {
      renderStep();
      expect(
        screen.getByText('preferredSkills.sectionLabel')
      ).toBeInTheDocument();
    });

    it('renders the skill search input', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('preferredSkills.input.placeholder')
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
      renderStep({
        skills: [
          {
            skillId: 'skill-1',
            skillName: 'JavaScript',
            careerPathName: 'Frontend',
            displayValue: 'JavaScript - Frontend',
          },
        ],
      });

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(
          screen.getByText('preferredSkills.confirmDisableDialog.title')
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
        skills: [
          {
            skillId: 'skill-1',
            skillName: 'JavaScript',
            careerPathName: 'Frontend',
            displayValue: 'JavaScript - Frontend',
          },
        ],
      });
      await user.click(screen.getByRole('switch'));
      await screen.findByText('preferredSkills.confirmDisableDialog.title');
      return { user, ...handlers };
    }

    it('closes without disabling when Cancel is clicked', async () => {
      const { user } = await openConfirmDialog();

      await user.click(
        screen.getByText('preferredSkills.confirmDisableDialog.cancel')
      );

      expect(
        screen.queryByText('preferredSkills.confirmDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it('disables the step when Disable is clicked', async () => {
      const { user } = await openConfirmDialog();

      await user.click(
        screen.getByText('preferredSkills.confirmDisableDialog.disable')
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
        screen.getByText('preferredSkills.confirmDisableDialog.disable')
      );

      expect(mockSuccessToast).toHaveBeenCalledWith('preferredSkills.title');
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
        screen.queryByText('preferredSkills.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not show when dataTakenFromCandidate is checked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByLabelText('preferredSkills.dataTakenFromCandidate')
      );
      await user.click(screen.getByText('common.next'));

      expect(
        screen.queryByText('preferredSkills.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('does not open emptyDisableDialog while Next is disabled', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));

      expect(
        screen.queryByText('preferredSkills.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not call onNext with disabled payload while Next is disabled', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));
      expect(
        screen.queryByText('preferredSkills.emptyDisableDialog.title')
      ).not.toBeInTheDocument();

      expect(onNext).not.toHaveBeenCalled();
    });

    it('does not fire SuccessToast while Next is disabled', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByText('common.next'));
      expect(
        screen.queryByText('preferredSkills.emptyDisableDialog.title')
      ).not.toBeInTheDocument();

      expect(mockSuccessToast).not.toHaveBeenCalled();
    });
  });

  describe('skill search and dropdown', () => {
    it('shows API skills in the dropdown when the input is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredSkills.input.placeholder')
      );

      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('shows "add new" option when typing an unrecognised skill name', async () => {
      const user = userEvent.setup();
      renderStep();

      const input = screen.getByPlaceholderText(
        'preferredSkills.input.placeholder'
      );
      await user.click(input);
      await user.type(input, 'Rust');

      expect(
        screen.getByText('preferredSkills.input.addNew')
      ).toBeInTheDocument();
    });

    it('selects an API skill directly and adds a chip without opening the career path panel', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredSkills.input.placeholder')
      );
      await user.click(screen.getByText('JavaScript'));

      expect(
        screen.queryByText('preferredSkills.careerPath.title')
      ).not.toBeInTheDocument();
      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);
    });

    it('removes a skill chip when the remove button is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredSkills.input.placeholder')
      );
      await user.click(screen.getByText('JavaScript'));
      expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);

      await user.click(
        screen.getByRole('button', { name: 'preferredSkills.chip.remove' })
      );

      expect(screen.queryAllByTestId('chip')).toHaveLength(0);
    });

    it('shows max-skills error when the selection limit is reached', async () => {
      const tenSkills = Array.from({ length: 10 }, (_, i) => ({
        skillId: `selected-${i}`,
        skillName: `Skill ${i}`,
        careerPathId: undefined,
        careerPathName: '',
        displayValue: `Skill ${i}`,
      }));
      renderStep({ skills: tenSkills });

      const user = userEvent.setup();
      await user.click(
        screen.getByPlaceholderText('preferredSkills.input.placeholder')
      );
      await user.click(screen.getByText('JavaScript')); // 11th — triggers max error

      await waitFor(() => {
        expect(
          screen.getByText('preferredSkills.validation.maxSkills')
        ).toBeInTheDocument();
      });
    });
  });

  describe('career path panel', () => {
    async function openCareerPathPanel() {
      const user = userEvent.setup();
      const handlers = renderStep();

      const skillInput = screen.getByPlaceholderText(
        'preferredSkills.input.placeholder'
      );
      await user.click(skillInput);
      await user.type(skillInput, 'MyCustomSkill');
      await user.click(screen.getByText('preferredSkills.input.addNew'));
      await screen.findByText('preferredSkills.careerPath.title');

      return { user, ...handlers };
    }

    it('opens the career path panel when "Add new" is clicked for a custom skill', async () => {
      await openCareerPathPanel();

      expect(
        screen.getByText('preferredSkills.careerPath.title')
      ).toBeInTheDocument();
    });

    it('shows validation error when Add is clicked with an empty career path input', async () => {
      const { user } = await openCareerPathPanel();

      await user.click(
        screen.getByText('preferredSkills.careerPath.addButton')
      );

      expect(
        screen.getByText('preferredSkills.careerPath.validation.required')
      ).toBeInTheDocument();
    });

    it('adds a skill chip after entering a career path name', async () => {
      const { user } = await openCareerPathPanel();

      const cpInput = screen.getByPlaceholderText(
        'preferredSkills.careerPath.input.placeholder'
      );
      await user.type(cpInput, 'Frontend');
      await user.click(
        screen.getByText('preferredSkills.careerPath.addButton')
      );

      await waitFor(() => {
        // Career path panel should be gone
        expect(
          screen.queryByText('preferredSkills.careerPath.title')
        ).not.toBeInTheDocument();
        // Chip should appear
        expect(screen.getAllByTestId('chip').length).toBeGreaterThan(0);
      });
    });

    it('renders the career path input placeholder', async () => {
      await openCareerPathPanel();

      expect(
        screen.getByPlaceholderText(
          'preferredSkills.careerPath.input.placeholder'
        )
      ).toBeInTheDocument();
    });
  });

  describe('dataTakenFromCandidate', () => {
    it('disables the skill search input when checked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByLabelText('preferredSkills.dataTakenFromCandidate')
      );

      expect(
        screen.getByPlaceholderText('preferredSkills.input.placeholder')
      ).toBeDisabled();
    });

    it('calls onNext directly without emptyDisableDialog when checked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByLabelText('preferredSkills.dataTakenFromCandidate')
      );
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: true,
          skills: [],
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
        skills: [
          {
            skillId: 'skill-1',
            skillName: 'JavaScript',
            careerPathId: 'cp-1',
            careerPathName: 'Frontend',
            displayValue: 'JavaScript - Frontend',
          },
        ],
      });

      await user.click(screen.getByRole('button', { name: 'common.back' }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onNext with selected skills when Next is clicked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(
        screen.getByPlaceholderText('preferredSkills.input.placeholder')
      );
      await user.click(screen.getByText('JavaScript'));
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            expect.objectContaining({
              skillId: 'skill-1',
              skillName: 'JavaScript',
            }),
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
          skills: [{ skillId: 'skill-1', skillName: 'JavaScript' }],
          status: 'published',
        },
        { mode: 'edit' }
      );

      expect(screen.getByTestId('vacancy-status-badge')).toBeInTheDocument();

      // Verify section heading and toggle are still present
      expect(screen.getByText('preferredSkills.title')).toBeInTheDocument();

      // Verify selection works
      await user.click(
        screen.getByPlaceholderText('preferredSkills.input.placeholder')
      );
      await user.click(screen.getByText('TypeScript'));

      // Verify navigation works
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalled();
    });
  });
});
