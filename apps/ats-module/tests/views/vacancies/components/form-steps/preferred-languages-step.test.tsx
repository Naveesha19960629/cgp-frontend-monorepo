import type { ReactNode } from 'react';

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
  useVacancyForm: mockUseVacancyForm,
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useLanguagesQuery: mockUseLanguagesQuery,
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
  }> = {}
) {
  return {
    form: {
      preferredLanguages: {
        isEnabled: true,
        dataTakenFromCandidate: false,
        languages: [],
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
    <PreferredLanguagesStep
      onNext={onNext}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
  return { onNext, onBack, onSubmit };
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
    it('opens confirmDisableDialog when toggle is clicked while enabled', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByRole('switch'));

      await waitFor(() => {
        expect(
          screen.getByText('preferredLanguages.confirmDisableDialog.title')
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

      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'preferredLanguages.notifications.disable.title',
        description: 'preferredLanguages.notifications.disable.message',
      });
    });
  });

  describe('emptyDisableDialog', () => {
    it('shows when Next is clicked with no items selected', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));

      expect(
        screen.getByText('preferredLanguages.emptyDisableDialog.title')
      ).toBeInTheDocument();
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

    it('closes without changing state when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));
      await screen.findByText('preferredLanguages.emptyDisableDialog.title');
      await user.click(
        screen.getByText('preferredLanguages.emptyDisableDialog.cancel')
      );

      expect(
        screen.queryByText('preferredLanguages.emptyDisableDialog.title')
      ).not.toBeInTheDocument();
      expect(onNext).not.toHaveBeenCalled();
    });

    it('calls onNext with disabled payload when Disable is clicked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      await user.click(screen.getByText('common.next'));
      await screen.findByText('preferredLanguages.emptyDisableDialog.title');
      await user.click(
        screen.getByText('preferredLanguages.emptyDisableDialog.disable')
      );

      expect(onNext).toHaveBeenCalledWith({
        preferredLanguages: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          languages: [],
        },
      });
    });

    it('fires SuccessToast when Disable is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(screen.getByText('common.next'));
      await screen.findByText('preferredLanguages.emptyDisableDialog.title');
      await user.click(
        screen.getByText('preferredLanguages.emptyDisableDialog.disable')
      );

      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'preferredLanguages.notifications.disable.title',
        description: 'preferredLanguages.notifications.disable.message',
      });
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
        screen.getByPlaceholderText('preferredLanguages.input.placeholder')
      );
      await user.click(screen.getByText('English'));
      await user.click(screen.getByText('common.next'));

      expect(onNext).toHaveBeenCalledWith({
        preferredLanguages: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          languages: [{ id: 'lang-1', label: 'English' }],
        },
      });
    });
  });
});
