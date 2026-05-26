import type { ReactNode } from 'react';

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
  useVacancyForm: mockUseVacancyForm,
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useSkillsQuery: mockUseSkillsQuery,
  useCareerPathsQuery: mockUseCareerPathsQuery,
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

vi.mock('@cgp/ui-kit/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open?: boolean; children?: ReactNode }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children?: ReactNode }) => (
    <dialog open>{children}</dialog>
  ),
  DialogTitle: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@cgp/ui-kit/components/ui/badge', () => ({
  Badge: ({ children }: { children?: ReactNode }) => (
    <div data-testid="chip">{children}</div>
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
  }> = {}
) {
  return {
    form: {
      preferredSkills: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        skills: [],
        ...overrides,
      },
    },
  };
}

function renderStep(formOverrides: Parameters<typeof makeForm>[0] = {}) {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();
  mockUseVacancyForm.mockReturnValue(makeForm(formOverrides));
  render(
    <PreferredSkillsStep onNext={onNext} onBack={onBack} onSubmit={onSubmit} />
  );
  return { onNext, onBack, onSubmit };
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
    it('opens confirmDisableDialog when toggle is clicked while enabled', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(
          screen.getByText('preferredSkills.confirmDisableDialog.title')
        ).toBeInTheDocument();
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
      const handlers = renderStep();
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

      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'preferredSkills.notifications.disable.title',
        description: 'preferredSkills.notifications.disable.message',
      });
    });
  });

  describe('emptyDisableDialog', () => {
    it('shows when Next is clicked with no items selected', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));

      expect(
        screen.getByText('preferredSkills.emptyDisableDialog.title')
      ).toBeInTheDocument();
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

    it('closes without changing state when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));
      await screen.findByText('preferredSkills.emptyDisableDialog.title');
      await user.click(
        screen.getByText('preferredSkills.emptyDisableDialog.cancel')
      );

      expect(
        screen.queryByText('preferredSkills.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('calls onNext with disabled payload when Disable is clicked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));
      await screen.findByText('preferredSkills.emptyDisableDialog.title');
      await user.click(
        screen.getByText('preferredSkills.emptyDisableDialog.disable')
      );

      expect(onNext).toHaveBeenCalledWith({
        preferredSkills: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          skills: [],
        },
      });
    });

    it('fires SuccessToast when Disable is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByText('common.next'));
      await screen.findByText('preferredSkills.emptyDisableDialog.title');
      await user.click(
        screen.getByText('preferredSkills.emptyDisableDialog.disable')
      );

      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'preferredSkills.notifications.disable.title',
        description: 'preferredSkills.notifications.disable.message',
      });
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
});
