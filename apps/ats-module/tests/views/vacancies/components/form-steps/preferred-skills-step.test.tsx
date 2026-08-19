import type { ReactNode } from 'react';
import { useState } from 'react';

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredSkillsStep from '@/views/vacancies/components/form-steps/preferred-skills-step';

// ── Hoisted mock refs ────────────────────────────────────────────────────────

const mockSuccessToast = vi.hoisted(() => vi.fn());
const mockErrorToast = vi.hoisted(() => vi.fn());
const mockUseVacancyForm = vi.hoisted(() => vi.fn());
const mockUseSkillsQuery = vi.hoisted(() => vi.fn());
const mockUseCareerPathsQuery = vi.hoisted(() => vi.fn());
const mockUseJobLevelsQuery = vi.hoisted(() => vi.fn());
const mockCreateCareerPath = vi.hoisted(() => vi.fn());
const mockCreateSkillCareerPath = vi.hoisted(() => vi.fn());

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: mockSuccessToast,
  ErrorToast: mockErrorToast,
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
  useJobLevelsQuery: mockUseJobLevelsQuery,
  useDisableSuccessToast: () => mockSuccessToast,
  useCreateCareerPathMutation: () => ({ mutateAsync: mockCreateCareerPath }),
  useCreateSkillCareerPathMutation: () => ({
    mutateAsync: mockCreateSkillCareerPath,
  }),
  useStepGuard: vi.fn(),
}));

vi.mock('@/views/vacancies/services', () => ({
  careerPathService: { getAllCareerPaths: vi.fn() },
  skillService: { getAllSkills: vi.fn() },
}));

// Combobox mock — exposes each option as a clickable button and an "add new"
// button that forwards the current typed search value.
vi.mock('@cgp/ui-kit/components/combobox', () => ({
  Combobox: ({
    placeholder,
    disabled,
    value,
    options = [],
    onValueChange,
    onAddNew,
    onSearchChange,
    onInputValueChange,
  }: {
    placeholder?: string;
    disabled?: boolean;
    value?: string;
    options?: { value: string; label: string }[];
    onValueChange?: (v: string) => void;
    onAddNew?: (v: string) => void;
    onSearchChange?: (v: string) => void;
    onInputValueChange?: (v: string) => void;
  }) => {
    const [search, setSearch] = useState('');
    return (
      <div>
        <input
          aria-label={placeholder}
          placeholder={placeholder}
          disabled={disabled}
          value={value || search}
          onChange={e => {
            setSearch(e.target.value);
            onSearchChange?.(e.target.value);
            onInputValueChange?.(e.target.value);
          }}
        />
        {options.map(o => (
          <button
            type="button"
            key={o.value}
            onClick={() => onValueChange?.(o.value)}
          >
            {`opt:${placeholder}:${o.label}`}
          </button>
        ))}
        <button type="button" onClick={() => onAddNew?.(search)}>
          {`addnew:${placeholder}`}
        </button>
      </div>
    );
  },
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: ({
    currentLength,
    maxLength,
  }: {
    currentLength: number;
    maxLength: number;
  }) => <span data-testid="char-count">{`${currentLength}/${maxLength}`}</span>,
}));

// Level Select mock — rendered as a native <select>.
vi.mock('@cgp/ui-kit/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value?: string;
    onValueChange?: (v: string) => void;
    disabled?: boolean;
    children?: ReactNode;
  }) => (
    <select
      data-testid="level-select"
      value={value ?? ''}
      disabled={disabled}
      onChange={e => onValueChange?.(e.target.value)}
    >
      <option value="" />
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SelectItem: ({
    value,
    children,
    disabled,
  }: {
    value: string;
    children?: ReactNode;
    disabled?: boolean;
  }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

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

vi.mock('@cgp/ui-kit/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked?: boolean;
    onCheckedChange?: (v: boolean) => void;
  }) => (
    <button
      role="switch"
      aria-checked={checked ?? false}
      onClick={() => onCheckedChange?.(!checked)}
    />
  ),
}));

vi.mock('@cgp/ui-kit/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/views/vacancies', () => ({
  StepDisableDialog: ({
    open,
    title,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onOpenChange,
  }: {
    open?: boolean;
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onOpenChange?: (v: boolean) => void;
  }) =>
    open ? (
      <div>
        <h2>{title}</h2>
        <button onClick={onConfirm}>{confirmLabel}</button>
        <button onClick={() => onOpenChange?.(false)}>{cancelLabel}</button>
      </div>
    ) : null,
}));

vi.mock('@/views/vacancies/components/vacancy-status-badge', () => ({
  default: ({ status }: { status: string }) => (
    <div data-testid="vacancy-status-badge">{status}</div>
  ),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const API_SKILLS = [
  { id: 'skill-1', label: 'JavaScript - Frontend', source: 'MASTER' },
  { id: 'skill-2', label: 'TypeScript - Frontend', source: 'MASTER' },
];

const API_CAREER_PATHS = [{ id: 'cp-1', label: 'Frontend Development' }];

const LEVELS = [
  { id: 'level-1', name: 'Entry Level' },
  { id: 'level-2', name: 'Senior Level' },
];

const SKILL_PLACEHOLDER = 'preferredSkills.input.placeholder';
const CAREER_PATH_PLACEHOLDER = 'preferredSkills.careerPath.input.placeholder';

function makeSkillsData(content = API_SKILLS) {
  return { data: { data: { items: { content } } }, isLoading: false };
}

function makeCareerPathsData(content = API_CAREER_PATHS) {
  return { data: { data: { items: { content } } }, isLoading: false };
}

function makeLevelsData(content = LEVELS) {
  return { data: { data: content }, isLoading: false };
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

const getRows = () => screen.queryAllByTestId('preferred-skill-row');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PreferredSkillsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSkillsQuery.mockReturnValue(makeSkillsData());
    mockUseCareerPathsQuery.mockReturnValue(makeCareerPathsData());
    mockUseJobLevelsQuery.mockReturnValue(makeLevelsData());
  });

  describe('rendering', () => {
    it('renders the section heading', () => {
      renderStep();
      expect(screen.getByText('preferredSkills.title')).toBeInTheDocument();
    });

    it('renders a single non-removable row by default', () => {
      renderStep();
      const rows = getRows();
      expect(rows).toHaveLength(1);
      // First row has no delete button.
      expect(
        within(rows[0]).queryByRole('button', { name: 'common.delete' })
      ).not.toBeInTheDocument();
    });

    it('renders the skill, career path and level fields per row', () => {
      renderStep();
      const row = getRows()[0];
      expect(
        within(row).getByPlaceholderText(SKILL_PLACEHOLDER)
      ).toBeInTheDocument();
      expect(
        within(row).getByPlaceholderText(CAREER_PATH_PLACEHOLDER)
      ).toBeInTheDocument();
      expect(within(row).getByTestId('level-select')).toBeInTheDocument();
    });

    it('does not list a skill option twice when a user-created combination also exists in master data', () => {
      // Row is user-created "JavaScript - Frontend"; the API also returns the
      // same "JavaScript - Frontend" (skill-1) — it must appear only once.
      renderStep({
        skills: [
          {
            skillId: '',
            skillName: 'JavaScript',
            careerPathName: 'Frontend',
            displayValue: 'JavaScript - Frontend',
            source: 'USER_CREATED',
          },
        ],
      });

      const row = getRows()[0];
      expect(
        within(row).getAllByText(
          `opt:${SKILL_PLACEHOLDER}:JavaScript - Frontend`
        )
      ).toHaveLength(1);
    });

    it('renders Cancel and Next buttons', () => {
      renderStep();
      expect(screen.getByText('common.cancel')).toBeInTheDocument();
      expect(screen.getByText('common.next')).toBeInTheDocument();
    });
  });

  describe('live character counter', () => {
    // Regression: DQCGP-3452 — the counter used to read the committed entry
    // value, so it stayed at 0 while typing (it only moved on select).
    it('updates the skill counter on every keystroke', async () => {
      const user = userEvent.setup();
      renderStep();
      const row = getRows()[0];
      const [skillCounter] = within(row).getAllByTestId('char-count');
      expect(skillCounter).toHaveTextContent('0/100');

      await user.type(
        within(row).getByPlaceholderText(SKILL_PLACEHOLDER),
        'Rust'
      );

      expect(within(row).getAllByTestId('char-count')[0]).toHaveTextContent(
        '4/100'
      );
    });

    it('updates the career-path counter on every keystroke', async () => {
      const user = userEvent.setup();
      renderStep();
      const row = getRows()[0];
      expect(within(row).getAllByTestId('char-count')[1]).toHaveTextContent(
        '0/100'
      );

      await user.type(
        within(row).getByPlaceholderText(CAREER_PATH_PLACEHOLDER),
        'Backend'
      );

      expect(within(row).getAllByTestId('char-count')[1]).toHaveTextContent(
        '7/100'
      );
    });
  });

  describe('add / remove rows', () => {
    it('adds a new row when the add button is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByRole('button', { name: 'preferredSkills.addRow' })
      );

      expect(getRows()).toHaveLength(2);
    });

    it('shows a delete button on additional rows and removes them', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByRole('button', { name: 'preferredSkills.addRow' })
      );
      const secondRow = getRows()[1];
      const deleteBtn = within(secondRow).getByRole('button', {
        name: 'common.delete',
      });
      await user.click(deleteBtn);

      expect(getRows()).toHaveLength(1);
    });
  });

  describe('toggle', () => {
    it('opens confirmDisableDialog when disabled while it has data', async () => {
      const user = userEvent.setup();
      renderStep({
        skills: [
          {
            skillId: 'skill-1',
            skillName: 'JavaScript',
            careerPathName: 'Frontend',
            displayValue: 'JavaScript - Frontend',
            source: 'MASTER',
            levelId: 'level-1',
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

    it('disables directly when toggled off with no data', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByRole('switch'));

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });

    it('enables the step when toggled on while disabled', async () => {
      const user = userEvent.setup();
      renderStep({ isEnabled: false });

      await user.click(screen.getByRole('switch'));

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });
  });

  describe('DQCGP-2866 — disable clears uncommitted row state', () => {
    it('marks the skill and career path combobox as disabled once toggled off', async () => {
      const user = userEvent.setup();
      renderStep();
      const row = getRows()[0];

      expect(
        within(row).getByPlaceholderText(SKILL_PLACEHOLDER)
      ).not.toBeDisabled();
      expect(
        within(row).getByPlaceholderText(CAREER_PATH_PLACEHOLDER)
      ).not.toBeDisabled();

      await user.click(screen.getByRole('switch')); // toggle off, no data yet

      expect(
        within(row).getByPlaceholderText(SKILL_PLACEHOLDER)
      ).toBeDisabled();
      expect(
        within(row).getByPlaceholderText(CAREER_PATH_PLACEHOLDER)
      ).toBeDisabled();
    });

    it('resets both character counters when disabled with uncommitted search text', async () => {
      const user = userEvent.setup();
      renderStep();
      const row = getRows()[0];

      await user.type(
        within(row).getByPlaceholderText(SKILL_PLACEHOLDER),
        'Rust'
      );
      await user.type(
        within(row).getByPlaceholderText(CAREER_PATH_PLACEHOLDER),
        'Backend'
      );
      expect(within(row).getAllByTestId('char-count')[0]).toHaveTextContent(
        '4/100'
      );
      expect(within(row).getAllByTestId('char-count')[1]).toHaveTextContent(
        '7/100'
      );

      await user.click(screen.getByRole('switch')); // toggle off, no data yet

      expect(within(row).getAllByTestId('char-count')[0]).toHaveTextContent(
        '0/100'
      );
      expect(within(row).getAllByTestId('char-count')[1]).toHaveTextContent(
        '0/100'
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
            source: 'MASTER',
            levelId: 'level-1',
          },
        ],
      });
      await user.click(screen.getByRole('switch'));
      await screen.findByText('preferredSkills.confirmDisableDialog.title');
      return { user, ...handlers };
    }

    it('disables the step and fires the toast when confirmed', async () => {
      const { user } = await openConfirmDialog();

      await user.click(
        screen.getByText('preferredSkills.confirmDisableDialog.disable')
      );

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
      expect(mockSuccessToast).toHaveBeenCalledWith('preferredSkills.title');
    });

    it('keeps the section enabled when cancelled', async () => {
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
  });

  describe('validation', () => {
    it('keeps Next disabled while enabled with no populated rows', () => {
      renderStep();
      expect(screen.getByText('common.next')).toBeDisabled();
    });

    it('shows level-required error when a skill has no level', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      // Select an existing skill (auto-fills career path, leaves level empty).
      await user.click(
        screen.getByText(`opt:${SKILL_PLACEHOLDER}:JavaScript - Frontend`)
      );
      await user.click(screen.getByText('common.next'));

      expect(
        screen.getByText('preferredSkills.validation.levelRequired')
      ).toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('shows career-path-required error when a new skill has no career path', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      const skillInput = screen.getByPlaceholderText(SKILL_PLACEHOLDER);
      await user.type(skillInput, 'Rust');
      await user.click(screen.getByText(`addnew:${SKILL_PLACEHOLDER}`));
      // Pick a level but leave career path empty.
      await user.selectOptions(screen.getByTestId('level-select'), 'level-1');
      await user.click(screen.getByText('common.next'));

      expect(
        screen.getByText('preferredSkills.validation.careerPathRequired')
      ).toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('freezes a level already used by another row with the same skill + career path', async () => {
      const user = userEvent.setup();
      renderStep();

      // Row 1: existing skill + level-1
      let row = getRows()[0];
      await user.click(
        within(row).getByText(`opt:${SKILL_PLACEHOLDER}:JavaScript - Frontend`)
      );
      await user.selectOptions(
        within(row).getByTestId('level-select'),
        'level-1'
      );

      // Add row 2 with the same skill + career path.
      await user.click(
        screen.getByRole('button', { name: 'preferredSkills.addRow' })
      );
      row = getRows()[1];
      await user.click(
        within(row).getByText(`opt:${SKILL_PLACEHOLDER}:JavaScript - Frontend`)
      );

      // level-1 (Entry Level) is frozen in row 2; level-2 (Senior Level) is free.
      expect(
        within(row).getByRole('option', { name: 'Entry Level' })
      ).toBeDisabled();
      expect(
        within(row).getByRole('option', { name: 'Senior Level' })
      ).toBeEnabled();
    });

    it('resets the level when a change would create a duplicate combination', async () => {
      const user = userEvent.setup();
      renderStep();

      // Row 1: JavaScript - Frontend + level-2
      let row = getRows()[0];
      await user.click(
        within(row).getByText(`opt:${SKILL_PLACEHOLDER}:JavaScript - Frontend`)
      );
      await user.selectOptions(
        within(row).getByTestId('level-select'),
        'level-2'
      );

      // Row 2: TypeScript - Frontend + level-2 (no collision yet)
      await user.click(
        screen.getByRole('button', { name: 'preferredSkills.addRow' })
      );
      row = getRows()[1];
      await user.click(
        within(row).getByText(`opt:${SKILL_PLACEHOLDER}:TypeScript - Frontend`)
      );
      await user.selectOptions(
        within(row).getByTestId('level-select'),
        'level-2'
      );
      expect(within(row).getByTestId('level-select')).toHaveValue('level-2');

      // Change row 2's skill to JavaScript → now duplicates row 1 → level resets.
      await user.click(
        within(row).getByText(`opt:${SKILL_PLACEHOLDER}:JavaScript - Frontend`)
      );
      expect(within(getRows()[1]).getByTestId('level-select')).toHaveValue('');
    });
  });

  describe('add button (max limit)', () => {
    it('shows an error toast instead of adding when the max is exceeded', async () => {
      const user = userEvent.setup();
      const tenSkills = Array.from({ length: 10 }, (_, i) => ({
        skillId: `skill-${i}`,
        skillName: `Skill ${i}`,
        careerPathName: 'Frontend',
        displayValue: `Skill ${i} - Frontend`,
        source: 'MASTER',
        levelId: 'level-1',
      }));
      renderStep({ skills: tenSkills });

      expect(getRows()).toHaveLength(10);
      const addButton = screen.getByRole('button', {
        name: 'preferredSkills.addRow',
      });
      expect(addButton).toBeEnabled();

      await user.click(addButton);

      expect(mockErrorToast).toHaveBeenCalledTimes(1);
      expect(getRows()).toHaveLength(10);
    });
  });

  describe('submit', () => {
    it('calls onNext with a skill carrying levelId', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      const row = getRows()[0];
      await user.click(
        within(row).getByText(`opt:${SKILL_PLACEHOLDER}:JavaScript - Frontend`)
      );
      await user.selectOptions(
        within(row).getByTestId('level-select'),
        'level-2'
      );
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            expect.objectContaining({
              skillId: 'skill-1',
              skillName: 'JavaScript',
              careerPathName: 'Frontend',
              levelId: 'level-2',
              levelName: 'Senior Level',
              source: 'MASTER',
            }),
          ],
        },
      });
    });

    it('resolves a user-created skill via createSkillCareerPath before submit', async () => {
      mockCreateCareerPath.mockResolvedValue({ pendingId: 'cp-pending' });
      mockCreateSkillCareerPath.mockResolvedValue({
        pendingId: 'pending-1',
        value: 'Rust - Systems',
      });
      const user = userEvent.setup();
      const { onNext } = renderStep();

      const row = getRows()[0];
      await user.type(
        within(row).getByPlaceholderText(SKILL_PLACEHOLDER),
        'Rust'
      );
      await user.click(within(row).getByText(`addnew:${SKILL_PLACEHOLDER}`));
      await user.type(
        within(row).getByPlaceholderText(CAREER_PATH_PLACEHOLDER),
        'Systems'
      );
      await user.click(
        within(row).getByText(`addnew:${CAREER_PATH_PLACEHOLDER}`)
      );
      await user.selectOptions(
        within(row).getByTestId('level-select'),
        'level-1'
      );
      await user.click(screen.getByText('common.next'));

      await waitFor(() => {
        expect(mockCreateSkillCareerPath).toHaveBeenCalledWith({
          skillName: 'Rust',
          careerPathName: 'Systems',
        });
      });
      const arg = onNext.mock.calls[0]?.[0] as {
        preferredSkills: { skills: Array<Record<string, unknown>> };
      };
      expect(arg.preferredSkills.skills[0]).toMatchObject({
        skillId: 'pending-1',
        source: 'PENDING',
        levelId: 'level-1',
      });
    });

    it('POSTs a shared skill + career path only once and reuses the id across rows', async () => {
      mockCreateCareerPath.mockResolvedValue({ pendingId: 'cp-pending' });
      mockCreateSkillCareerPath.mockResolvedValue({
        pendingId: 'pending-1',
        value: 'Rust - Systems',
      });
      const user = userEvent.setup();
      const { onNext } = renderStep();

      const fillRow = async (rowEl: HTMLElement, level: string) => {
        await user.type(
          within(rowEl).getByPlaceholderText(SKILL_PLACEHOLDER),
          'Rust'
        );
        await user.click(
          within(rowEl).getByText(`addnew:${SKILL_PLACEHOLDER}`)
        );
        await user.type(
          within(rowEl).getByPlaceholderText(CAREER_PATH_PLACEHOLDER),
          'Systems'
        );
        await user.click(
          within(rowEl).getByText(`addnew:${CAREER_PATH_PLACEHOLDER}`)
        );
        await user.selectOptions(
          within(rowEl).getByTestId('level-select'),
          level
        );
      };

      // Two rows with the SAME skill + career path but different levels.
      await fillRow(getRows()[0], 'level-1');
      await user.click(
        screen.getByRole('button', { name: 'preferredSkills.addRow' })
      );
      await fillRow(getRows()[1], 'level-2');

      await user.click(screen.getByText('common.next'));

      await waitFor(() => expect(onNext).toHaveBeenCalled());
      // Only one POST for the shared combination.
      expect(mockCreateSkillCareerPath).toHaveBeenCalledTimes(1);

      const arg = onNext.mock.calls[0]?.[0] as {
        preferredSkills: { skills: Array<Record<string, unknown>> };
      };
      expect(arg.preferredSkills.skills).toHaveLength(2);
      // Same resolved pending id applied to both rows, each keeping its level.
      expect(arg.preferredSkills.skills[0]).toMatchObject({
        skillId: 'pending-1',
        source: 'PENDING',
        levelId: 'level-1',
      });
      expect(arg.preferredSkills.skills[1]).toMatchObject({
        skillId: 'pending-1',
        source: 'PENDING',
        levelId: 'level-2',
      });
    });

    it('reuses an existing skill + career path instead of POSTing a duplicate', async () => {
      const user = userEvent.setup();
      // Row is user-created "JavaScript - Frontend", which already exists in the
      // master data (API_SKILLS → skill-1). It should be adopted as the existing
      // record and NOT re-POSTed.
      const { onNext } = renderStep({
        skills: [
          {
            skillId: '',
            skillName: 'JavaScript',
            careerPathName: 'Frontend',
            displayValue: 'JavaScript - Frontend',
            source: 'USER_CREATED',
          },
        ],
      });

      await user.selectOptions(
        within(getRows()[0]).getByTestId('level-select'),
        'level-1'
      );
      await user.click(screen.getByText('common.next'));

      await waitFor(() => expect(onNext).toHaveBeenCalled());
      expect(mockCreateSkillCareerPath).not.toHaveBeenCalled();

      const arg = onNext.mock.calls[0]?.[0] as {
        preferredSkills: { skills: Array<Record<string, unknown>> };
      };
      expect(arg.preferredSkills.skills[0]).toMatchObject({
        skillId: 'skill-1',
        source: 'MASTER',
        levelId: 'level-1',
      });
    });
  });

  describe('dataTakenFromCandidate', () => {
    it('disables the row fields when checked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByLabelText('preferredSkills.dataTakenFromCandidate')
      );

      expect(screen.getByPlaceholderText(SKILL_PLACEHOLDER)).toBeDisabled();
    });

    it('calls onNext with empty skills when checked', async () => {
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
    it('calls onCancel when Cancel is clicked', async () => {
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
            careerPathName: 'Frontend',
            displayValue: 'JavaScript - Frontend',
            source: 'MASTER',
            levelId: 'level-1',
          },
        ],
      });

      await user.click(screen.getByRole('button', { name: 'common.back' }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('edit mode', () => {
    it('does not show VacancyStatusBadge in create mode', () => {
      renderStep({}, { mode: 'create' });
      expect(
        screen.queryByTestId('vacancy-status-badge')
      ).not.toBeInTheDocument();
    });

    it('shows VacancyStatusBadge when mode="edit" and status exists', () => {
      renderStep({ status: 'published' }, { mode: 'edit' });
      expect(screen.getByTestId('vacancy-status-badge')).toHaveTextContent(
        'published'
      );
    });

    it('hydrates an existing skill row with its stored level', () => {
      renderStep(
        {
          skills: [
            {
              skillId: 'skill-1',
              skillName: 'JavaScript',
              careerPathName: 'Frontend',
              displayValue: 'JavaScript - Frontend',
              source: 'MASTER',
              levelId: 'level-2',
              levelName: 'Senior Level',
            },
          ],
          status: 'published',
        },
        { mode: 'edit' }
      );

      const row = getRows()[0];
      expect(within(row).getByTestId('level-select')).toHaveValue('level-2');
    });

    it('leaves the level empty for a legacy skill without a level', () => {
      renderStep(
        {
          skills: [
            {
              skillId: 'skill-1',
              skillName: 'JavaScript',
              careerPathName: 'Frontend',
              displayValue: 'JavaScript - Frontend',
              source: 'MASTER',
            },
          ],
          status: 'published',
        },
        { mode: 'edit' }
      );

      const row = getRows()[0];
      expect(within(row).getByTestId('level-select')).toHaveValue('');
    });
  });
});
