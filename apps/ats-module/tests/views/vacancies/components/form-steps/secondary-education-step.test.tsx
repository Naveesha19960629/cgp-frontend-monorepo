import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SecondaryEducationStep from '@/views/vacancies/components/form-steps/secondary-education-step';

// ── Mock react-i18next ─────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ── Mock vacancy form context ──────────────────────────────────────────────

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useVacancyForm: () => ({
    form: {
      secondaryEducation: [
        { isEnabled: false, dataTakenFromCandidate: false, content: [] },
      ],
    },
  }),
}));

// ── Mock hooks barrel — keep real useSecondaryEducationForm ─────────────────

vi.mock('@/views/vacancies/hooks', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/hooks')>();
  return {
    ...actual,
    useSchoolsSearch: () => vi.fn(() => Promise.resolve([])),
    useSchoolLocationsSearch: () => vi.fn(() => Promise.resolve([])),
    useExaminationsSearch: () => vi.fn(() => Promise.resolve([])),
    useAwardingBodiesSearch: () => vi.fn(() => Promise.resolve([])),
    useFieldsOfStudySearch: () => vi.fn(() => Promise.resolve([])),
    useAddExaminationMutation: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ data: { pendingId: 'new-id' } }),
    }),
    useAddAwardingBodyMutation: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ data: { pendingId: 'new-id' } }),
    }),
    useAddFieldOfStudyMutation: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ data: { pendingId: 'new-id' } }),
    }),
  };
});

// ── Mock add school dialog ──────────────────────────────────────────────────

vi.mock('@/views/vacancies/components/form-steps/add-school-dialog', () => ({
  AddSchoolDialog: () => null,
}));

// ── Mock message box ────────────────────────────────────────────────────────

vi.mock('@/app/components/message-box', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

// ── Mock MultipleSelector ───────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/multiple-selector', () => ({
  default: ({
    placeholder,
    onMaxSelected,
    errorMessage,
  }: {
    placeholder: string;
    onMaxSelected?: () => void;
    errorMessage?: string;
  }) => (
    <>
      <input placeholder={placeholder} readOnly />
      {onMaxSelected && (
        <button
          type="button"
          data-testid={`max-trigger-${placeholder}`}
          onClick={() => onMaxSelected()}
        />
      )}
      {errorMessage && <p>{errorMessage}</p>}
    </>
  ),
}));

// ── Mock Radix-backed UI kit components ────────────────────────────────────

vi.mock('radix-ui', () => ({
  Switch: {
    Root: ({
      checked,
      onCheckedChange,
      children,
      ...rest
    }: {
      checked: boolean;
      onCheckedChange?: (v: boolean) => void;
      children?: ReactNode;
      [k: string]: unknown;
    }) => (
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        type="button"
        {...rest}
      >
        {children}
      </button>
    ),
    Thumb: () => null,
  },
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

vi.mock('@cgp/ui-kit/components/ui/label', () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children?: ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock('@cgp/ui-kit/components/ui/popover', () => ({
  Popover: ({ children }: { children?: ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('@cgp/ui-kit/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open?: boolean; children?: ReactNode }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children?: ReactNode }) => (
    <dialog>{children}</dialog>
  ),
  DialogTitle: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@cgp/ui-kit/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="calendar" />,
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => null,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function renderStep() {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();
  render(
    <SecondaryEducationStep
      onNext={onNext}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
  return { onNext, onBack, onSubmit };
}

async function enableSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('switch'));
}

/** Enable toggle, check dataTakenFromCandidate so checkHasFilledData()=true, then toggle off */
async function openConfirmDialog() {
  const user = userEvent.setup();
  renderStep();
  await enableSection(user);
  await user.click(
    screen.getByLabelText('secondaryEducation.collectFromCandidates')
  );
  await user.click(screen.getByRole('switch')); // toggle off → dialog
  await screen.findByText('secondaryEducation.confirmDisableDialog.title');
  return user;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SecondaryEducationStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the section heading', () => {
      renderStep();
      expect(screen.getByText('secondaryEducation.title')).toBeInTheDocument();
    });

    it('renders the enable/disable toggle (initially off)', () => {
      renderStep();
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });

    it('renders the "collect from candidates" checkbox', () => {
      renderStep();
      expect(
        screen.getByLabelText('secondaryEducation.collectFromCandidates')
      ).toBeInTheDocument();
    });

    it('renders start date trigger with placeholder text when no date selected', () => {
      renderStep();
      expect(
        screen.getByText('secondaryEducation.placeholders.startDate')
      ).toBeInTheDocument();
    });

    it('renders end date trigger with placeholder text when no date selected', () => {
      renderStep();
      expect(
        screen.getByText('secondaryEducation.placeholders.endDate')
      ).toBeInTheDocument();
    });

    it('renders the school location field placeholder', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'secondaryEducation.placeholders.schoolLocation'
        )
      ).toBeInTheDocument();
    });

    it('renders the grade input placeholder', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('secondaryEducation.placeholders.grade')
      ).toBeInTheDocument();
    });

    it('renders the awarding body field placeholder', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'secondaryEducation.placeholders.awardingBody'
        )
      ).toBeInTheDocument();
    });

    it('renders the field of study placeholder', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'secondaryEducation.placeholders.fieldOfStudy'
        )
      ).toBeInTheDocument();
    });

    it('renders the results textarea placeholder', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('secondaryEducation.placeholders.results')
      ).toBeInTheDocument();
    });

    it('renders the accepts home schooling checkbox', () => {
      renderStep();
      expect(
        screen.getByLabelText('secondaryEducation.acceptsHomeSchooling')
      ).toBeInTheDocument();
    });
  });

  describe('enable/disable toggle', () => {
    it('enables the section when clicked while off', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it('disables the section directly (no dialog) when no data has been entered', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);
      await user.click(screen.getByRole('switch')); // toggle off

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
      expect(
        screen.queryByText('secondaryEducation.confirmDisableDialog.title')
      ).not.toBeInTheDocument();
    });

    it('shows confirmation dialog when toggling off after "collect from candidates" is checked', async () => {
      const user = userEvent.setup();
      renderStep();

      await enableSection(user);
      await user.click(
        screen.getByLabelText('secondaryEducation.collectFromCandidates')
      );
      await user.click(screen.getByRole('switch')); // toggle off

      await waitFor(() => {
        expect(
          screen.getByText('secondaryEducation.confirmDisableDialog.title')
        ).toBeInTheDocument();
      });
    });
  });

  describe('disable confirmation dialog', () => {
    it('closes the dialog without disabling when "Cancel" is clicked', async () => {
      const user = await openConfirmDialog();

      await user.click(
        screen.getByText('secondaryEducation.confirmDisableDialog.cancel')
      );

      await waitFor(() => {
        expect(
          screen.queryByText('secondaryEducation.confirmDisableDialog.title')
        ).not.toBeInTheDocument();
      });
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it('closes the dialog and disables the section when "Disable" is clicked', async () => {
      const user = await openConfirmDialog();

      await user.click(
        screen.getByText('secondaryEducation.confirmDisableDialog.disable')
      );

      await waitFor(() => {
        expect(
          screen.queryByText('secondaryEducation.confirmDisableDialog.title')
        ).not.toBeInTheDocument();
      });
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });

    it('clears date fields (shows placeholder text) after "Disable" is confirmed', async () => {
      const user = await openConfirmDialog();

      await user.click(
        screen.getByText('secondaryEducation.confirmDisableDialog.disable')
      );

      await waitFor(() => {
        expect(
          screen.getByText('secondaryEducation.placeholders.startDate')
        ).toBeInTheDocument();
        expect(
          screen.getByText('secondaryEducation.placeholders.endDate')
        ).toBeInTheDocument();
      });
    });
  });

  describe('"collect from candidates" checkbox', () => {
    it('checks when clicked', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);

      const checkbox = screen.getByLabelText(
        'secondaryEducation.collectFromCandidates'
      );
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('clears the grade field when checked', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);

      const gradeInput = screen.getByPlaceholderText(
        'secondaryEducation.placeholders.grade'
      );
      await user.type(gradeInput, 'A');
      expect(gradeInput).toHaveValue('A');

      await user.click(
        screen.getByLabelText('secondaryEducation.collectFromCandidates')
      );
      expect(gradeInput).toHaveValue('');
    });
  });

  describe('navigation', () => {
    it('calls onBack when the back arrow is clicked', async () => {
      const user = userEvent.setup();
      const { onBack } = renderStep();

      await user.click(
        screen.getByRole('button', { name: 'secondaryEducation.back' })
      );

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('max selection inline error', () => {
    it('shows error message when max selections is reached on the school name field', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);

      await user.click(
        screen.getByTestId('max-trigger-secondaryEducation.placeholders.school')
      );

      expect(
        screen.getByText('secondaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });

    it('shows error message when max selections is reached on the examination field', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);

      await user.click(
        screen.getByTestId(
          'max-trigger-secondaryEducation.placeholders.examination'
        )
      );

      expect(
        screen.getByText('secondaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });

    it('shows error message when max selections is reached on the school location field', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);

      await user.click(
        screen.getByTestId(
          'max-trigger-secondaryEducation.placeholders.schoolLocation'
        )
      );

      expect(
        screen.getByText('secondaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });

    it('shows error message when max selections is reached on the awarding body field', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);

      await user.click(
        screen.getByTestId(
          'max-trigger-secondaryEducation.placeholders.awardingBody'
        )
      );

      expect(
        screen.getByText('secondaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });

    it('shows error message when max selections is reached on the field of study', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);

      await user.click(
        screen.getByTestId(
          'max-trigger-secondaryEducation.placeholders.fieldOfStudy'
        )
      );

      expect(
        screen.getByText('secondaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });
  });

  describe('accepts home schooling checkbox', () => {
    it('is unchecked by default', () => {
      renderStep();
      expect(
        screen.getByLabelText('secondaryEducation.acceptsHomeSchooling')
      ).not.toBeChecked();
    });

    it('checks when clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      const checkbox = screen.getByLabelText(
        'secondaryEducation.acceptsHomeSchooling'
      );
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });
  });
});
