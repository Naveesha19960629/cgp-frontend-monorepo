import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import PreferredPublicationsStep from '@/views/vacancies/components/form-steps/preferred-publications-step';

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: string }) => {
      if (key === 'preferredPublications.cardTitle') {
        return `Publication ${options?.number ?? '01'}`;
      }

      const dictionary: Record<string, string> = {
        'preferredPublications.title': 'Preferred Publications',
        'preferredPublications.labels.acceptedPublisher': 'Accepted Publisher',
        'preferredPublications.labels.publishedDateFrom': 'Published Date From',
        'preferredPublications.labels.publishedDateTo': 'Published Date To',
        'preferredPublications.placeholders.acceptedPublisher':
          'Enter accepted publisher',
        'preferredPublications.placeholders.publishedDateFrom':
          'Select published date from',
        'preferredPublications.placeholders.publishedDateTo':
          'Select published date to',
        'preferredPublications.dataTakenFromCandidate':
          'If selected, no manual input is required, and data will be taken from the candidate profile',
        'preferredPublications.addEntry': 'Add entry',
        'preferredPublications.cancel': 'Cancel',
        'preferredPublications.next': 'Next',
        'preferredPublications.back': 'Back',
      };

      return dictionary[key] ?? key;
    },
  }),
}));

const onCancel = vi.hoisted(() => vi.fn());
vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useTemplateFieldVisible: () => () => true,
  useVacancyForm: () => ({
    form: {},
    onCancel,
    setForm: vi.fn(),
    stepPersistRef: { current: null },
    stepDisableRef: { current: null },
    currentStepIndex: 0,
    removeCompletedStep: vi.fn(),
  }),
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: vi.fn(),
}));

vi.mock('@/views/vacancies/components/form-steps/disable-dialog', () => ({
  default: ({
    open,
    title,
    message,
    onDisable,
  }: {
    open?: boolean;
    title?: string;
    message?: string;
    onDisable?: () => void;
  }) =>
    open ? (
      <div data-testid="disable-dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onDisable} data-testid="disable-button">
          Disable
        </button>
      </div>
    ) : null,
}));

vi.mock('@cgp/ui-kit/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    className,
    disabled,
    ...rest
  }: {
    children?: ReactNode;
    onClick?: () => void;
    variant?: string;
    className?: string;
    disabled?: boolean;
    [k: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      className={className}
      disabled={disabled}
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
    className,
  }: {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (v: boolean) => void;
    className?: string;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked ?? false}
      onChange={e => onCheckedChange?.(e.target.checked)}
      className={className}
    />
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/input', () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    maxLength,
    className,
    ...rest
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    maxLength?: number;
    className?: string;
    [k: string]: unknown;
  }) => (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={className}
      {...rest}
    />
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/label', () => ({
  Label: ({
    children,
    htmlFor,
    className,
  }: {
    children?: ReactNode;
    htmlFor?: string;
    className?: string;
  }) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/popover', () => ({
  Popover: ({ children }: { children?: ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect?: (date: Date | undefined) => void }) => (
    <div data-testid="calendar">
      <button
        onClick={() => onSelect?.(new Date('2023-05-15'))}
        data-testid="calendar-select-date"
      >
        Select Date
      </button>
    </div>
  ),
}));

vi.mock('@radix-ui/react-switch', () => ({
  Root: ({
    checked,
    onCheckedChange,
    children,
    className,
  }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    children?: ReactNode;
    className?: string;
  }) => (
    <button
      role="switch"
      aria-checked={checked ? 'true' : 'false'}
      onClick={() => onCheckedChange?.(!checked)}
      className={className}
    >
      {children}
    </button>
  ),
  Thumb: ({ className }: { className?: string }) => (
    <span className={className} data-testid="switch-thumb" />
  ),
}));

vi.mock('@/components/message-box', () => ({
  default: ({ fields = [] }: { fields?: string[] }) => (
    <div data-testid="message-box">
      {fields.map(f => (
        <span key={f}>{f}</span>
      ))}
    </div>
  ),
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: ({
    currentLength,
    maxLength,
  }: {
    currentLength: number;
    maxLength: number;
  }) => (
    <span data-testid="character-count">
      {currentLength}/{maxLength}
    </span>
  ),
}));

vi.mock('lucide-react', async importOriginal => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    ChevronLeftIcon: () => <span data-testid="chevron-left-icon" />,
    ChevronUpIcon: () => <span data-testid="chevron-up-icon" />,
    PlusIcon: () => <span data-testid="plus-icon" />,
  };
});

vi.mock('iconsax-reactjs', () => ({
  Calendar: () => <span data-testid="calendar-icon" />,
  ArrowLeft2: () => <span data-testid="arrow-left-icon" />,
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useStepGuard: vi.fn(),
}));

vi.mock('@/views/vacancies/utils', () => ({
  formatDate: (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
  sanitizePlainText: (value: string) => value,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderStep() {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();
  render(
    <PreferredPublicationsStep
      onNext={onNext}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
  return { onNext, onBack, onSubmit };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PreferredPublicationsStep', () => {
  describe('rendering', () => {
    it('renders the message box', () => {
      renderStep();
      expect(screen.getByTestId('message-box')).toBeInTheDocument();
    });

    it('renders the section heading', () => {
      renderStep();
      expect(screen.getByText('Preferred Publications')).toBeInTheDocument();
    });

    it('renders the toggle switch as disabled by default', () => {
      renderStep();
      const toggle = screen.getByRole('switch');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('renders the dataTakenFromCandidate checkbox', () => {
      renderStep();
      const checkbox = screen.getByLabelText(
        /If selected, no manual input is required/i
      );
      expect(checkbox).toBeInTheDocument();
    });

    it('renders Publication 01 card', () => {
      renderStep();
      expect(screen.getByText('Publication 01')).toBeInTheDocument();
    });

    it('renders Accepted Publisher input with character count', () => {
      renderStep();
      expect(screen.getByText('Accepted Publisher')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter accepted publisher')
      ).toBeInTheDocument();
      expect(screen.getByText('0/250')).toBeInTheDocument();
    });

    it('renders Published Date From field', () => {
      renderStep();
      expect(screen.getByText('Published Date From')).toBeInTheDocument();
      expect(
        screen.getByText('Select published date from')
      ).toBeInTheDocument();
    });

    it('renders Published Date To field', () => {
      renderStep();
      expect(screen.getByText('Published Date To')).toBeInTheDocument();
      expect(screen.getByText('Select published date to')).toBeInTheDocument();
    });

    it('renders add entry button', () => {
      renderStep();
      const addButton = screen.getByLabelText('Add entry');
      expect(addButton).toBeInTheDocument();
    });

    it('renders Cancel and Next buttons', () => {
      renderStep();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('renders back button', () => {
      renderStep();
      const backButton = screen.getByLabelText('Back');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('toggle switch', () => {
    it('enables the form when toggle is switched on', async () => {
      const user = userEvent.setup();
      renderStep();

      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('disables form fields when toggle is off', () => {
      renderStep();

      const publisherInput = screen.getByPlaceholderText(
        'Enter accepted publisher'
      );

      // Find the card body wrapper which has the disabled styling
      const cardBody = publisherInput.closest('.border-t');

      // Check if card body wrapper has opacity class (disabled styling)
      expect(cardBody?.className).toContain('opacity-60');
    });
  });

  describe('dataTakenFromCandidate checkbox', () => {
    it('checks and unchecks the checkbox', async () => {
      const user = userEvent.setup();
      renderStep();

      // Enable the toggle first
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const checkbox = screen.getByLabelText(
        /If selected, no manual input is required/i
      );

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('disables form fields when dataTakenFromCandidate is checked', async () => {
      const user = userEvent.setup();
      renderStep();

      // Enable the toggle
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // Check dataTakenFromCandidate
      const checkbox = screen.getByLabelText(
        /If selected, no manual input is required/i
      );
      await user.click(checkbox);

      const publisherInput = screen.getByPlaceholderText(
        'Enter accepted publisher'
      );

      // Find the card body wrapper which has the disabled styling
      const cardBody = publisherInput.closest('.border-t');

      // Fields should be disabled
      expect(cardBody?.className).toContain('opacity-60');
    });
  });

  describe('accepted publisher input', () => {
    it('allows text input', async () => {
      const user = userEvent.setup();
      renderStep();

      // Enable the toggle
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const input = screen.getByPlaceholderText('Enter accepted publisher');
      await user.type(input, 'IEEE Transactions');

      expect(input).toHaveValue('IEEE Transactions');
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      renderStep();

      // Enable the toggle
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const input = screen.getByPlaceholderText('Enter accepted publisher');
      await user.type(input, 'IEEE');

      expect(screen.getByText('4/250')).toBeInTheDocument();
    });

    it('respects maxLength of 250 characters', () => {
      renderStep();

      const input = screen.getByPlaceholderText('Enter accepted publisher');
      expect(input).toHaveAttribute('maxLength', '250');
    });
  });

  describe('navigation', () => {
    it('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const { onBack } = renderStep();

      const backButton = screen.getByLabelText('Back');
      await user.click(backButton);

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls the context onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onNext when Next button is clicked', async () => {
      const user = userEvent.setup();
      const { onNext } = renderStep();

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('date pickers', () => {
    it('displays formatted date when publishedDateFrom is selected', async () => {
      const user = userEvent.setup();
      renderStep();

      // Enable the toggle
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // The Calendar component is mocked to select 2023-05-15 when clicked
      const selectDateButtons = screen.getAllByTestId('calendar-select-date');

      // Click the first calendar's select button (Published Date From)
      await user.click(selectDateButtons[0]);

      // The date should be formatted and displayed
      expect(screen.getByText(/May 15, 2023/)).toBeInTheDocument();
    });

    it('displays formatted date when publishedDateTo is selected', async () => {
      const user = userEvent.setup();
      renderStep();

      // Enable the toggle
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      const selectDateButtons = screen.getAllByTestId('calendar-select-date');

      // Click the second calendar's select button (Published Date To)
      await user.click(selectDateButtons[1]);

      // The date should be formatted and displayed
      expect(screen.getByText(/May 15, 2023/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper labels for all form fields', () => {
      renderStep();

      expect(screen.getByText('Accepted Publisher')).toBeInTheDocument();
      expect(screen.getByText('Published Date From')).toBeInTheDocument();
      expect(screen.getByText('Published Date To')).toBeInTheDocument();
    });

    it('has proper aria-label for back button', () => {
      renderStep();

      const backButton = screen.getByLabelText('Back');
      expect(backButton).toBeInTheDocument();
    });

    it('has proper aria-label for add entry button', () => {
      renderStep();

      const addButton = screen.getByLabelText('Add entry');
      expect(addButton).toBeInTheDocument();
    });

    it('links checkbox to its label', () => {
      renderStep();

      const label = screen.getByText(
        /If selected, no manual input is required/i
      );
      expect(label).toBeInTheDocument();

      const checkbox = screen.getByLabelText(
        /If selected, no manual input is required/i
      );
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('disable dialog', () => {
    it('does not show disable dialog initially', () => {
      renderStep();

      const dialog = screen.queryByTestId('disable-dialog');
      expect(dialog).not.toBeInTheDocument();
    });

    it('does not show disable dialog when toggle is turned off with no data', async () => {
      const user = userEvent.setup();
      renderStep();

      // Enable the toggle first
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'true');

      // Click toggle again to disable — nothing was filled in, so it should
      // disable immediately without asking for confirmation.
      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(screen.queryByTestId('disable-dialog')).not.toBeInTheDocument();
    });

    it('shows disable dialog when toggle is turned off with data present', async () => {
      const user = userEvent.setup();
      renderStep();

      // Enable the toggle first
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // Fill in some data
      const publisherInput = screen.getByPlaceholderText(
        'Enter accepted publisher'
      );
      await user.type(publisherInput, 'IEEE');

      // Click toggle again to disable
      await user.click(toggle);

      // Dialog should appear
      const dialog = screen.getByTestId('disable-dialog');
      expect(dialog).toBeInTheDocument();
      expect(
        screen.getByText('preferredPublications.confirmDisableDialog.title')
      ).toBeInTheDocument();
    });

    it('clears form data when disable is confirmed', async () => {
      const user = userEvent.setup();
      renderStep();

      // Enable the toggle
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // Fill in some data
      const publisherInput = screen.getByPlaceholderText(
        'Enter accepted publisher'
      );
      await user.type(publisherInput, 'IEEE');
      expect(publisherInput).toHaveValue('IEEE');

      // Try to disable
      await user.click(toggle);

      // Confirm disable
      const disableButton = screen.getByTestId('disable-button');
      await user.click(disableButton);

      // Toggle should be off
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      // Data should be cleared
      expect(publisherInput).toHaveValue('');
    });
  });
});
