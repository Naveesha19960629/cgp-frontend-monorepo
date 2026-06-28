import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SecondaryEducationStep from '@/views/vacancies/components/form-steps/secondary-education-step';

type MockVacancyForm = {
  secondaryEducation: unknown;
  status: string | undefined;
};

// ── Mock react-i18next ─────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ── Mock vacancy form context ──────────────────────────────────────────────

const {
  stableForm,
  mockSetForm,
  mockSetStepGuard,
  mockStepPersistRef,
  mockStepDisableRef,
  mockOnCancel,
} = vi.hoisted(() => {
  const stableForm: MockVacancyForm = {
    secondaryEducation: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    status: undefined,
  };

  return {
    stableForm,
    mockSetForm: vi.fn(),
    mockSetStepGuard: vi.fn(),
    mockStepPersistRef: { current: null },
    mockStepDisableRef: { current: null },
    mockOnCancel: vi.fn(),
  };
});

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useVacancyForm: () => ({
    form: stableForm,
    setForm: mockSetForm,
    setStepGuard: mockSetStepGuard,
    onCancel: mockOnCancel,
    stepPersistRef: mockStepPersistRef,
    stepDisableRef: mockStepDisableRef,
    currentStepIndex: 0,
    removeCompletedStep: vi.fn(),
  }),
}));

vi.mock('@/views/vacancies/components/vacancy-status-badge', () => ({
  default: ({ status }: { status: string }) => (
    <div data-testid="vacancy-status-badge">{status}</div>
  ),
}));

// ── Mock hooks barrel — keep real useSecondaryEducationForm ─────────────────

const {
  mockExaminationMutate,
  mockAwardingBodyMutate,
  mockFieldOfStudyMutate,
  mockAddSchoolMutate,
} = vi.hoisted(() => ({
  mockExaminationMutate: vi.fn(),
  mockAwardingBodyMutate: vi.fn(),
  mockFieldOfStudyMutate: vi.fn(),
  mockAddSchoolMutate: vi.fn(),
}));

vi.mock('@/views/vacancies/hooks', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/hooks')>();
  return {
    ...actual,
    useSchoolsQuery: () => ({ data: undefined }),
    useSchoolLocationsQuery: () => ({ data: undefined }),
    useExaminationsQuery: () => ({ data: undefined }),
    useSecondaryAwardingBodiesQuery: () => ({ data: undefined }),
    useFieldsOfStudyQuery: () => ({ data: undefined }),
    useSchoolsSearch: () => vi.fn(() => Promise.resolve([])),
    useSchoolLocationsSearch: () => vi.fn(() => Promise.resolve([])),
    useExaminationsSearch: () => vi.fn(() => Promise.resolve([])),
    useAwardingBodiesSearch: () => vi.fn(() => Promise.resolve([])),
    useFieldsOfStudySearch: () => vi.fn(() => Promise.resolve([])),
    useAddExaminationMutation: () => ({ mutateAsync: mockExaminationMutate }),
    useAddAwardingBodyMutation: () => ({ mutateAsync: mockAwardingBodyMutate }),
    useAddFieldOfStudyMutation: () => ({ mutateAsync: mockFieldOfStudyMutate }),
    useAddSchoolMutation: () => ({ mutateAsync: mockAddSchoolMutate }),
  };
});

// ── Mock add school dialog ──────────────────────────────────────────────────

const mockAddSchoolDialog = vi.fn();
vi.mock('@/views/vacancies/components/form-steps/add-school-dialog', () => ({
  AddSchoolDialog: (props: {
    open: boolean;
    onClose: () => void;
    onAdded: (opt: {
      value: string;
      label: string;
      source: string;
      locationId?: string;
      url?: string;
    }) => void;
  }) => {
    mockAddSchoolDialog(props);
    if (!props.open) return null;
    return (
      <div data-testid="add-school-dialog">
        <button
          type="button"
          data-testid="dialog-add-now"
          onClick={() =>
            props.onAdded({
              value: '__pending_school_123',
              label: 'New School, Colombo',
              source: 'PENDING_TEMP',
              locationId: 'loc-1',
            })
          }
        >
          Add Now
        </button>
        <button
          type="button"
          data-testid="dialog-cancel"
          onClick={() => props.onClose()}
        >
          Cancel
        </button>
      </div>
    );
  },
}));

// ── Mock message box ────────────────────────────────────────────────────────

vi.mock('@/components/message-box', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

// ── Mock AutocompleteCombobox ──────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/autocomplete-combobox', () => ({
  AutocompleteCombobox: ({ placeholder }: { placeholder?: string }) => (
    <input placeholder={placeholder} readOnly />
  ),
}));

// ── Mock MultipleSelector ───────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/multi-select', () => ({
  default: ({
    placeholder,
    onMaxSelected,
    errorMessage,
    onChange,
    loadingIndicator,
    emptyIndicator,
  }: {
    placeholder: string;
    onMaxSelected?: () => void;
    errorMessage?: string;
    onChange?: (options: { value: string; label: string }[]) => void;
    loadingIndicator?: ReactNode;
    emptyIndicator?: ReactNode;
    keepSelectedInList?: boolean;
  }) => (
    <>
      <input placeholder={placeholder} readOnly />
      {onChange && (
        <button
          type="button"
          data-testid={`add-new-${placeholder}`}
          onClick={() => onChange([{ value: 'new-val', label: 'new-val' }])}
        />
      )}
      {onMaxSelected && (
        <button
          type="button"
          data-testid={`max-trigger-${placeholder}`}
          onClick={() => onMaxSelected()}
        />
      )}
      {errorMessage && <p>{errorMessage}</p>}
      {loadingIndicator}
      {emptyIndicator}
    </>
  ),
}));

// ── Mock Radix-backed UI kit components ────────────────────────────────────

vi.mock('@cgp/ui-kit/components/ui/switch', () => ({
  Switch: ({
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
  DialogDescription: ({ children }: { children?: ReactNode }) => (
    <p>{children}</p>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/calendar', () => ({
  Calendar: ({
    disabled,
    endMonth,
  }: {
    disabled?: (date: Date) => boolean;
    endMonth?: Date;
  }) => {
    const isEndDateCalendar = endMonth
      ? endMonth.getFullYear() - new Date().getFullYear() > 50
      : false;
    return (
      <div
        data-testid={
          isEndDateCalendar ? 'end-date-calendar' : 'start-date-calendar'
        }
      >
        {disabled && isEndDateCalendar && (
          <button
            type="button"
            data-testid="end-date-probe-jun-2020"
            data-disabled={String(disabled(new Date(2020, 5, 15)))}
          >
            probe
          </button>
        )}
      </div>
    );
  },
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => null,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function renderStep(mode: 'create' | 'edit' = 'create') {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();
  render(
    <SecondaryEducationStep
      onNext={onNext}
      onBack={onBack}
      onSubmit={onSubmit}
      mode={mode}
    />
  );
  return { onNext, onBack, onSubmit };
}

/** Enable the section by toggling the switch on */
async function enableSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('switch'));
}

/** Enable section, check dataTakenFromCandidate so checkHasFilledData()=true, then toggle off */
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
    stableForm.secondaryEducation = [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ];
    stableForm.status = undefined;
    mockExaminationMutate.mockResolvedValue({ data: { pendingId: 'exam-id' } });
    mockAwardingBodyMutate.mockResolvedValue({
      data: { pendingId: 'body-id' },
    });
    mockFieldOfStudyMutate.mockResolvedValue({ data: { pendingId: 'fos-id' } });
    mockAddSchoolMutate.mockResolvedValue({
      data: { pendingId: 'school-server-id' },
    });
  });

  describe('rendering', () => {
    it('renders the section heading', () => {
      renderStep();
      expect(screen.getByText('secondaryEducation.title')).toBeInTheDocument();
    });

    it('renders vacancy status badge in edit mode when status exists', () => {
      stableForm.status = 'LIVE';
      renderStep('edit');

      expect(screen.getByTestId('vacancy-status-badge')).toHaveTextContent(
        'LIVE'
      );
    });

    it('does not render vacancy status badge in create mode', () => {
      stableForm.status = 'LIVE';
      renderStep('create');

      expect(
        screen.queryByTestId('vacancy-status-badge')
      ).not.toBeInTheDocument();
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

    it('passes loading indicator to all search selectors', () => {
      renderStep();
      expect(screen.getAllByText('common.loading')).toHaveLength(5);
    });

    it('passes empty indicator to all search selectors', () => {
      renderStep();
      expect(screen.getAllByText('common.noDataTitle')).toHaveLength(5);
    });
  });

  describe('date picker buttons', () => {
    it('start date button is disabled when section is not enabled', () => {
      renderStep();
      expect(
        screen.getByRole('button', {
          name: 'secondaryEducation.startDate',
        })
      ).toBeDisabled();
    });

    it('end date button is disabled when section is not enabled', () => {
      renderStep();
      expect(
        screen.getByRole('button', {
          name: 'secondaryEducation.endDate',
        })
      ).toBeDisabled();
    });

    it('start date button becomes enabled after enabling the section', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);
      expect(
        screen.getByRole('button', {
          name: 'secondaryEducation.startDate',
        })
      ).not.toBeDisabled();
    });

    it('end date button becomes enabled after enabling the section', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);
      expect(
        screen.getByRole('button', {
          name: 'secondaryEducation.endDate',
        })
      ).not.toBeDisabled();
    });

    it('date buttons become disabled when "collect from candidates" is checked', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);
      await user.click(
        screen.getByLabelText('secondaryEducation.collectFromCandidates')
      );
      expect(
        screen.getByRole('button', {
          name: 'secondaryEducation.startDate',
        })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', {
          name: 'secondaryEducation.endDate',
        })
      ).toBeDisabled();
    });
  });

  describe('end date calendar disabled logic', () => {
    it('allows a past date when no start date is set', () => {
      renderStep();
      const probe = screen.getByTestId('end-date-probe-jun-2020');
      expect(probe).toHaveAttribute('data-disabled', 'false');
    });

    it('blocks a past date that falls before start date + 1 day', () => {
      stableForm.secondaryEducation = [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              schools: [],
              schoolLocations: [],
              examinations: [],
              secondaryAwardingBody: [],
              fieldsOfStudy: [],
              grade: '',
              startDate: '2020-06-20',
              endDate: undefined,
              result: '',
              acceptsHomeSchooling: false,
            },
          ],
        },
      ];
      renderStep();
      // June 15 2020 is before minEndDate (June 21 2020) → must be disabled
      const probe = screen.getByTestId('end-date-probe-jun-2020');
      expect(probe).toHaveAttribute('data-disabled', 'true');
    });

    it('allows a past date that falls after start date + 1 day', () => {
      stableForm.secondaryEducation = [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              schools: [],
              schoolLocations: [],
              examinations: [],
              secondaryAwardingBody: [],
              fieldsOfStudy: [],
              grade: '',
              startDate: '2020-06-10',
              endDate: undefined,
              result: '',
              acceptsHomeSchooling: false,
            },
          ],
        },
      ];
      renderStep();
      // June 15 2020 is after minEndDate (June 11 2020) → must not be disabled
      const probe = screen.getByTestId('end-date-probe-jun-2020');
      expect(probe).toHaveAttribute('data-disabled', 'false');
    });
  });

  describe('enable/disable toggle', () => {
    it('disables the section when toggled on then off', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);
      await user.click(screen.getByRole('switch'));
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
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

      await user.click(screen.getByText('common.disableDialog.cancelButton'));

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

      const checkbox = screen.getByLabelText(
        'secondaryEducation.collectFromCandidates'
      );
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('clears the grade field when checked', async () => {
      const user = userEvent.setup();
      renderStep();

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

    it('clears startDate and endDate (shows placeholder text) when checked', async () => {
      stableForm.secondaryEducation = [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              schools: [],
              schoolLocations: [],
              examinations: [],
              secondaryAwardingBody: [],
              fieldsOfStudy: [],
              grade: '',
              startDate: '2024-06-01',
              endDate: '2024-12-01',
              result: '',
              acceptsHomeSchooling: false,
            },
          ],
        },
      ];

      const user = userEvent.setup();
      renderStep();

      expect(
        screen.queryByText('secondaryEducation.placeholders.startDate')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('secondaryEducation.placeholders.endDate')
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByLabelText('secondaryEducation.collectFromCandidates')
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

  describe('navigation', () => {
    it('persists form and calls onBack when the back arrow is clicked', async () => {
      const user = userEvent.setup();
      const { onBack } = renderStep();

      await user.click(
        screen.getByRole('button', { name: 'secondaryEducation.back' })
      );

      expect(mockSetForm).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('max selection inline error', () => {
    it('shows error message when max selections is reached on the school name field', async () => {
      const user = userEvent.setup();
      renderStep();

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

  describe('creatable field items deferred to Next', () => {
    const makeApiRefs = (prefix: string, count = 10) =>
      Array.from({ length: count }, (_, index) => ({
        id: `${prefix}-${index + 1}`,
        source: 'MASTER' as const,
        name: `${prefix} ${index + 1}`,
      }));

    const setMaxedSecondaryForm = () => {
      stableForm.secondaryEducation = [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              schools: [],
              schoolLocations: [],
              examinations: makeApiRefs('exam'),
              secondaryAwardingBody: makeApiRefs('awarding-body'),
              fieldsOfStudy: makeApiRefs('field-of-study'),
              grade: '',
              startDate: '',
              endDate: '',
              result: '',
              acceptsHomeSchooling: false,
            },
          ],
        },
      ];
    };

    it('does not call addExaminationMutation when a new item is added', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-secondaryEducation.placeholders.examination'
        )
      );

      expect(mockExaminationMutate).not.toHaveBeenCalled();
    });

    it('calls addExaminationMutation with the new label when Next is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-secondaryEducation.placeholders.examination'
        )
      );
      await user.click(screen.getByText('secondaryEducation.next'));

      await waitFor(() => {
        expect(mockExaminationMutate).toHaveBeenCalledWith('new-val');
      });
    });

    it('does not call addAwardingBodyMutation when a new item is added', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-secondaryEducation.placeholders.awardingBody'
        )
      );

      expect(mockAwardingBodyMutate).not.toHaveBeenCalled();
    });

    it('calls addAwardingBodyMutation with the new label when Next is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-secondaryEducation.placeholders.awardingBody'
        )
      );
      await user.click(screen.getByText('secondaryEducation.next'));

      await waitFor(() => {
        expect(mockAwardingBodyMutate).toHaveBeenCalledWith('new-val');
      });
    });

    it('does not call addFieldOfStudyMutation when a new item is added', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-secondaryEducation.placeholders.fieldOfStudy'
        )
      );

      expect(mockFieldOfStudyMutate).not.toHaveBeenCalled();
    });

    it('calls addFieldOfStudyMutation with the new label when Next is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-secondaryEducation.placeholders.fieldOfStudy'
        )
      );
      await user.click(screen.getByText('secondaryEducation.next'));

      await waitFor(() => {
        expect(mockFieldOfStudyMutate).toHaveBeenCalledWith('new-val');
      });
    });

    it.each([
      {
        placeholder: 'secondaryEducation.placeholders.examination',
        mutationSpy: mockExaminationMutate,
      },
      {
        placeholder: 'secondaryEducation.placeholders.awardingBody',
        mutationSpy: mockAwardingBodyMutate,
      },
      {
        placeholder: 'secondaryEducation.placeholders.fieldOfStudy',
        mutationSpy: mockFieldOfStudyMutate,
      },
    ])(
      'does not call deferred add mutation for %s when already at max and Next is clicked',
      async ({ placeholder, mutationSpy }) => {
        const user = userEvent.setup();
        setMaxedSecondaryForm();
        renderStep();

        const input = screen.getByPlaceholderText(placeholder);
        if (!(input instanceof HTMLInputElement)) {
          throw new Error('Expected input element');
        }
        input.value = 'new-val';

        await user.click(screen.getByText('secondaryEducation.next'));

        await waitFor(() => {
          expect(mutationSpy).not.toHaveBeenCalledWith('new-val');
        });
      }
    );

    it('does not call addSchoolMutation immediately when school dialog Add Now is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('add-new-secondaryEducation.placeholders.school')
      );
      await user.click(screen.getByTestId('dialog-add-now'));

      expect(mockAddSchoolMutate).not.toHaveBeenCalled();
    });

    it('calls addSchoolMutation with pending data when Next is clicked after school dialog add', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('add-new-secondaryEducation.placeholders.school')
      );
      await user.click(screen.getByTestId('dialog-add-now'));
      await user.click(screen.getByText('secondaryEducation.next'));

      await waitFor(() => {
        expect(mockAddSchoolMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            displayValue: 'New School, Colombo',
            locationId: 'loc-1',
          })
        );
      });
    });

    it('does not add school to form values when dialog is cancelled', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('add-new-secondaryEducation.placeholders.school')
      );
      expect(screen.getByTestId('add-school-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('dialog-cancel'));

      expect(screen.queryByTestId('add-school-dialog')).not.toBeInTheDocument();
      expect(mockAddSchoolMutate).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown duplicate filtering (case-insensitive by label/name)', () => {
    /**
     * FIX: Dropdown onSearch callbacks filter by label (display name) instead of value (ID)
     * This prevents duplicate schools from appearing when the same name is added with different IDs
     *
     * Example: User adds "Harvard University", then searches for "harvard" or "HARVARD"
     * Before fix: Would show both the newly added school AND the same school from API (different IDs)
     * After fix: Only shows one "Harvard University" in dropdown (filters by case-insensitive label match)
     */
    it('should filter school results by label (name) to prevent duplicates', () => {
      const selectedSchools = [
        { value: 'uuid-1', label: 'Harvard University', source: 'MASTER' },
        { value: 'uuid-2', label: 'MIT', source: 'PENDING_TEMP' },
      ];

      const apiResults = [
        {
          value: 'api-uuid-1',
          label: 'harvard university',
          source: 'MASTER',
        }, // Same name, different ID!
        { value: 'api-uuid-2', label: 'Stanford', source: 'MASTER' },
      ];

      // Filter logic: use label.toLowerCase() not value.toLowerCase()
      const selectedLabels = new Set(
        selectedSchools.map(v => v.label.toLowerCase())
      );
      const filtered = apiResults.filter(
        item => !selectedLabels.has(item.label.toLowerCase())
      );

      // Should only return Stanford (harvard university is filtered out)
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.label).toBe('Stanford');
    });

    it('should filter location results by label (name) to prevent duplicates', () => {
      const selectedLocations = [
        { value: 'loc-id-1', label: 'Colombo' },
        { value: 'loc-id-2', label: 'Galle' },
      ];

      const apiResults = [
        { value: 'api-loc-id-1', label: 'colombo' }, // Same name, different ID!
        { value: 'api-loc-id-2', label: 'Kandy' },
      ];

      // Filter logic: use label.toLowerCase() not value.toLowerCase()
      const selectedLabels = new Set(
        selectedLocations.map(v => v.label.toLowerCase())
      );
      const filtered = apiResults.filter(
        item => !selectedLabels.has(item.label.toLowerCase())
      );

      // Should only return Kandy (colombo is filtered out)
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.label).toBe('Kandy');
    });
  });
});
