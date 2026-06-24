import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ReactNode, Ref } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TertiaryEducationStep from '@/views/vacancies/components/form-steps/tertiary-education-step';
import type { TertiaryEducation } from '@/views/vacancies/types';

// ── Mock AddAwardingBodyDialog ─────────────────────────────────────────────

const mockAddAwardingBodyDialogFn = vi.fn();
vi.mock(
  '@/views/vacancies/components/form-steps/add-awarding-body-dialog',
  () => ({
    AddAwardingBodyDialog: (props: {
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
      mockAddAwardingBodyDialogFn(props);
      if (!props.open) return null;
      return (
        <div data-testid="add-awarding-body-dialog">
          <button
            type="button"
            data-testid="dialog-ab-add-now"
            onClick={() =>
              props.onAdded({
                value: '__pending_awarding_body_123',
                label: 'New Institute',
                source: 'PENDING_TEMP',
                locationId: 'loc-1',
              })
            }
          >
            Add Now
          </button>
          <button
            type="button"
            data-testid="dialog-ab-cancel"
            onClick={() => props.onClose()}
          >
            Cancel
          </button>
        </div>
      );
    },
  })
);

// ── Mock react-i18next ─────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ── Mock vacancy form context ──────────────────────────────────────────────

type TertiaryEducationApiRef = {
  source: 'MASTER' | 'PENDING';
  id: string;
  name?: string;
  label?: string;
};

type TertiaryEducationApiEntry = {
  qualificationName: TertiaryEducationApiRef[];
  tertiaryAwardingBody: TertiaryEducationApiRef[];
  tertiaryAwardingBodyLocations: TertiaryEducationApiRef[];
  levelOfQualification: TertiaryEducationApiRef[];
  specialization: TertiaryEducationApiRef[];
  studyMode: TertiaryEducationApiRef[];
  studyPattern: TertiaryEducationApiRef[];
  deliverySchedule: TertiaryEducationApiRef[];
  batch: TertiaryEducationApiRef[];
  department: TertiaryEducationApiRef[];
  faculty: TertiaryEducationApiRef[];
  grade: string;
};

type TertiaryEducationApiShape = {
  isEnabled: boolean;
  dataTakenFromCandidate: boolean;
  tertiaryEducation: TertiaryEducationApiEntry[];
};

type MockVacancyForm = {
  tertiaryEducation: TertiaryEducation[] | TertiaryEducationApiShape;
  status: string | undefined;
};

const {
  stableForm,
  mockSetForm,
  mockSetStepGuard,
  mockStepPersistRef,
  mockStepDisableRef,
  mockOnCancel,
} = vi.hoisted(() => {
  const stableForm: MockVacancyForm = {
    tertiaryEducation: [
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

// ── Mock hooks barrel — keep real useTertiaryEducationForm ─────────────────

const {
  mockQualificationMutate,
  mockLevelMutate,
  mockSpecializationMutate,
  mockBatchMutate,
  mockDepartmentMutate,
  mockFacultyMutate,
} = vi.hoisted(() => ({
  mockQualificationMutate: vi.fn(),
  mockLevelMutate: vi.fn(),
  mockSpecializationMutate: vi.fn(),
  mockBatchMutate: vi.fn(),
  mockDepartmentMutate: vi.fn(),
  mockFacultyMutate: vi.fn(),
}));
const { mockAddAwardingBodyMutate } = vi.hoisted(() => ({
  mockAddAwardingBodyMutate: vi.fn(),
}));

vi.mock('@/views/vacancies/hooks', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/hooks')>();
  return {
    ...actual,
    // Query hooks
    useQualificationsQuery: () => ({ data: undefined }),
    useTertiaryAwardingBodiesQuery: () => ({ data: undefined }),
    useTertiaryAwardingBodyLocationsQuery: () => ({ data: undefined }),
    useLevelOfQualificationsQuery: () => ({ data: undefined }),
    useSpecializationsQuery: () => ({ data: undefined }),
    useStudyModesQuery: () => ({ data: undefined }),
    useStudyPatternsQuery: () => ({ data: undefined }),
    useDeliverySchedulesQuery: () => ({ data: undefined }),
    useBatchesQuery: () => ({ data: undefined }),
    useDepartmentsQuery: () => ({ data: undefined }),
    useFacultiesQuery: () => ({ data: undefined }),
    // Search hooks
    useQualificationsSearch: () => vi.fn(() => Promise.resolve([])),
    useTertiaryAwardingBodiesSearch: () => vi.fn(() => Promise.resolve([])),
    useTertiaryAwardingBodyLocationsSearch: () =>
      vi.fn(() => Promise.resolve([])),
    useLevelOfQualificationsSearch: () => vi.fn(() => Promise.resolve([])),
    useSpecializationsSearch: () => vi.fn(() => Promise.resolve([])),
    useStudyModesSearch: () => vi.fn(() => Promise.resolve([])),
    useStudyPatternsSearch: () => vi.fn(() => Promise.resolve([])),
    useDeliverySchedulesSearch: () => vi.fn(() => Promise.resolve([])),
    useBatchesSearch: () => vi.fn(() => Promise.resolve([])),
    useDepartmentsSearch: () => vi.fn(() => Promise.resolve([])),
    useFacultiesSearch: () => vi.fn(() => Promise.resolve([])),
    // Mutation hooks
    useAddQualificationMutation: () => ({
      mutateAsync: mockQualificationMutate,
    }),
    useAddLevelOfQualificationMutation: () => ({
      mutateAsync: mockLevelMutate,
    }),
    useAddSpecializationMutation: () => ({
      mutateAsync: mockSpecializationMutate,
    }),
    useAddBatchMutation: () => ({ mutateAsync: mockBatchMutate }),
    useAddDepartmentMutation: () => ({ mutateAsync: mockDepartmentMutate }),
    useAddFacultyMutation: () => ({ mutateAsync: mockFacultyMutate }),
    useAddTertiaryAwardingBodyMutation: () => ({
      mutateAsync: mockAddAwardingBodyMutate,
    }),
  };
});

// ── Mock message box ────────────────────────────────────────────────────────

vi.mock('@/app/components/message-box', () => ({
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
  default: forwardRef(
    (
      {
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
      },
      ref
    ) => {
      const inputRef = useRef(null);
      useImperativeHandle(ref, () => ({
        input: inputRef.current,
      }));
      return (
        <>
          <input placeholder={placeholder} readOnly ref={inputRef} />
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
          {loadingIndicator && (
            <div data-testid={`loading-${placeholder}`}>{loadingIndicator}</div>
          )}
          {emptyIndicator && (
            <div data-testid={`empty-${placeholder}`}>{emptyIndicator}</div>
          )}
        </>
      );
    }
  ),
}));

// ── Mock Radix-backed UI kit components ────────────────────────────────────

vi.mock('@radix-ui/react-switch', () => ({
  Root: forwardRef(
    (
      {
        checked,
        onCheckedChange,
        children,
        ...rest
      }: {
        checked?: boolean;
        onCheckedChange?: (v: boolean) => void;
        children?: ReactNode;
        [k: string]: unknown;
      },
      ref
    ) => (
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        type="button"
        ref={ref as Ref<HTMLButtonElement>}
        {...rest}
      >
        {children}
      </button>
    )
  ),
  Thumb: () => null,
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

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => null,
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function renderStep(mode: 'create' | 'edit' = 'create') {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();
  render(
    <TertiaryEducationStep
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
    screen.getByLabelText('tertiaryEducation.collectFromCandidates')
  );
  await user.click(screen.getByRole('switch')); // toggle off → dialog
  await screen.findByText('tertiaryEducation.confirmDisableDialog.title');
  return user;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('TertiaryEducationStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stableForm.status = undefined;
    mockQualificationMutate.mockResolvedValue({
      data: { pendingId: 'qual-id' },
    });
    mockLevelMutate.mockResolvedValue({ data: { pendingId: 'level-id' } });
    mockSpecializationMutate.mockResolvedValue({
      data: { pendingId: 'spec-id' },
    });
    mockBatchMutate.mockResolvedValue({ data: { pendingId: 'batch-id' } });
    mockDepartmentMutate.mockResolvedValue({ data: { pendingId: 'dept-id' } });
    mockFacultyMutate.mockResolvedValue({ data: { pendingId: 'faculty-id' } });
    mockAddAwardingBodyMutate.mockResolvedValue({
      data: { pendingId: 'ab-server-id' },
    });
  });

  describe('rendering', () => {
    it('renders the section heading', () => {
      renderStep();
      expect(screen.getByText('tertiaryEducation.title')).toBeInTheDocument();
    });

    it('renders vacancy status badge in edit mode when status exists', () => {
      stableForm.status = 'ON_HOLD';
      renderStep('edit');

      expect(screen.getByTestId('vacancy-status-badge')).toHaveTextContent(
        'ON_HOLD'
      );
    });

    it('does not render vacancy status badge in create mode', () => {
      stableForm.status = 'ON_HOLD';
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
        screen.getByLabelText('tertiaryEducation.collectFromCandidates')
      ).toBeInTheDocument();
    });

    it('renders the qualification name field placeholder', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'tertiaryEducation.placeholders.qualificationName'
        )
      ).toBeInTheDocument();
    });

    it('renders the grade field placeholder', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('tertiaryEducation.placeholders.grade')
      ).toBeInTheDocument();
    });

    it('renders the location field placeholder (row 2 left)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'tertiaryEducation.placeholders.awardingBodyLocation'
        )
      ).toBeInTheDocument();
    });

    it('renders the batch field placeholder (row 2 right)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('tertiaryEducation.placeholders.batch')
      ).toBeInTheDocument();
    });

    it('renders the awarding body field placeholder (row 3 left)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'tertiaryEducation.placeholders.awardingBody'
        )
      ).toBeInTheDocument();
    });

    it('renders the level of qualification field placeholder (row 3 right)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'tertiaryEducation.placeholders.levelOfQualification'
        )
      ).toBeInTheDocument();
    });

    it('renders the specialization field placeholder (row 4 left)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'tertiaryEducation.placeholders.specialization'
        )
      ).toBeInTheDocument();
    });

    it('renders the mode of study field placeholder (row 4 right)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('tertiaryEducation.placeholders.studyMode')
      ).toBeInTheDocument();
    });

    it('renders the study pattern field placeholder (row 5 left)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'tertiaryEducation.placeholders.studyPattern'
        )
      ).toBeInTheDocument();
    });

    it('renders the delivery schedule field placeholder (row 5 right)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText(
          'tertiaryEducation.placeholders.deliverySchedule'
        )
      ).toBeInTheDocument();
    });

    it('renders the department field placeholder (row 6 left)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('tertiaryEducation.placeholders.department')
      ).toBeInTheDocument();
    });

    it('renders the faculty field placeholder (row 6 right)', () => {
      renderStep();
      expect(
        screen.getByPlaceholderText('tertiaryEducation.placeholders.faculty')
      ).toBeInTheDocument();
    });

    it('passes loading indicator to all search selectors', () => {
      renderStep();
      expect(screen.getAllByText('common.loading')).toHaveLength(11);
    });

    it('passes empty indicator to all search selectors', () => {
      renderStep();
      expect(screen.getAllByText('common.noDataTitle')).toHaveLength(11);
    });

    it('uses common searching and no-data pattern for study mode, pattern, and delivery schedule', () => {
      renderStep();

      expect(
        screen.getByTestId('loading-tertiaryEducation.placeholders.studyMode')
      ).toHaveTextContent('common.loading');
      expect(
        screen.getByTestId(
          'loading-tertiaryEducation.placeholders.studyPattern'
        )
      ).toHaveTextContent('common.loading');
      expect(
        screen.getByTestId(
          'loading-tertiaryEducation.placeholders.deliverySchedule'
        )
      ).toHaveTextContent('common.loading');

      expect(
        screen.getByTestId('empty-tertiaryEducation.placeholders.studyMode')
      ).toHaveTextContent('common.noDataTitle');
      expect(
        screen.getByTestId('empty-tertiaryEducation.placeholders.studyPattern')
      ).toHaveTextContent('common.noDataTitle');
      expect(
        screen.getByTestId(
          'empty-tertiaryEducation.placeholders.deliverySchedule'
        )
      ).toHaveTextContent('common.noDataTitle');
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
        screen.queryByText('tertiaryEducation.confirmDisableDialog.title')
      ).not.toBeInTheDocument();
    });

    it('shows confirmation dialog when toggling off after "collect from candidates" is checked', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);
      await user.click(
        screen.getByLabelText('tertiaryEducation.collectFromCandidates')
      );
      await user.click(screen.getByRole('switch')); // toggle off

      await waitFor(() => {
        expect(
          screen.getByText('tertiaryEducation.confirmDisableDialog.title')
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
          screen.queryByText('tertiaryEducation.confirmDisableDialog.title')
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
        screen.getByText('tertiaryEducation.confirmDisableDialog.disable')
      );

      await waitFor(() => {
        expect(
          screen.queryByText('tertiaryEducation.confirmDisableDialog.title')
        ).not.toBeInTheDocument();
      });
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
    });

    it('clears entry fields (grade shows empty) after "Disable" is confirmed', async () => {
      const user = userEvent.setup();
      renderStep();
      await enableSection(user);

      const gradeInput = screen.getByPlaceholderText(
        'tertiaryEducation.placeholders.grade'
      );
      await user.type(gradeInput, 'GPA 3.8');
      expect(gradeInput).toHaveValue('GPA 3.8');

      await user.click(
        screen.getByLabelText('tertiaryEducation.collectFromCandidates')
      );
      await user.click(screen.getByRole('switch')); // toggle off → dialog
      await screen.findByText('tertiaryEducation.confirmDisableDialog.title');

      await user.click(
        screen.getByText('tertiaryEducation.confirmDisableDialog.disable')
      );

      await waitFor(() => {
        expect(gradeInput).toHaveValue('');
      });
    });
  });

  describe('"collect from candidates" checkbox', () => {
    it('checks when clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      const checkbox = screen.getByLabelText(
        'tertiaryEducation.collectFromCandidates'
      );
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('clears the grade field when checked', async () => {
      const user = userEvent.setup();
      renderStep();

      const gradeInput = screen.getByPlaceholderText(
        'tertiaryEducation.placeholders.grade'
      );
      await user.type(gradeInput, 'A+');
      expect(gradeInput).toHaveValue('A+');

      await user.click(
        screen.getByLabelText('tertiaryEducation.collectFromCandidates')
      );
      expect(gradeInput).toHaveValue('');
    });
  });

  describe('navigation', () => {
    it('persists form and calls onBack when the back arrow is clicked', async () => {
      const user = userEvent.setup();
      const { onBack } = renderStep();

      await user.click(
        screen.getByRole('button', { name: 'tertiaryEducation.back' })
      );

      expect(mockSetForm).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('max selection inline error', () => {
    it('shows error message when max selections is reached on the qualification name field', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'max-trigger-tertiaryEducation.placeholders.qualificationName'
        )
      );

      expect(
        screen.getByText('tertiaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });

    it('shows error message when max selections is reached on the level of qualification field', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'max-trigger-tertiaryEducation.placeholders.levelOfQualification'
        )
      );

      expect(
        screen.getByText('tertiaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });

    it('shows error message when max selections is reached on the batch field', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('max-trigger-tertiaryEducation.placeholders.batch')
      );

      expect(
        screen.getByText('tertiaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });

    it('shows error message when max selections is reached on the specialization field', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'max-trigger-tertiaryEducation.placeholders.specialization'
        )
      );

      expect(
        screen.getByText('tertiaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });

    it('shows error message when max selections is reached on the department field', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'max-trigger-tertiaryEducation.placeholders.department'
        )
      );

      expect(
        screen.getByText('tertiaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });

    it('shows error message when max selections is reached on the faculty field', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('max-trigger-tertiaryEducation.placeholders.faculty')
      );

      expect(
        screen.getByText('tertiaryEducation.errors.maxSelections')
      ).toBeInTheDocument();
    });
  });

  describe('creatable field items deferred to Next', () => {
    it('does not call addQualificationMutation when a new qualification item is added', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-tertiaryEducation.placeholders.qualificationName'
        )
      );

      expect(mockQualificationMutate).not.toHaveBeenCalled();
    });

    it('calls addQualificationMutation with the new label when Next is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-tertiaryEducation.placeholders.qualificationName'
        )
      );
      await user.click(screen.getByText('tertiaryEducation.next'));

      await waitFor(() => {
        expect(mockQualificationMutate).toHaveBeenCalledWith('new-val');
      });
    });

    it('does not call addBatchMutation when a new batch item is added', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('add-new-tertiaryEducation.placeholders.batch')
      );

      expect(mockBatchMutate).not.toHaveBeenCalled();
    });

    it('calls addBatchMutation with the new label when Next is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('add-new-tertiaryEducation.placeholders.batch')
      );
      await user.click(screen.getByText('tertiaryEducation.next'));

      await waitFor(() => {
        expect(mockBatchMutate).toHaveBeenCalledWith('new-val');
      });
    });

    it('does not call addLevelOfQualificationMutation when a new level item is added', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-tertiaryEducation.placeholders.levelOfQualification'
        )
      );

      expect(mockLevelMutate).not.toHaveBeenCalled();
    });

    it('calls addLevelOfQualificationMutation with the new label when Next is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-tertiaryEducation.placeholders.levelOfQualification'
        )
      );
      await user.click(screen.getByText('tertiaryEducation.next'));

      await waitFor(() => {
        expect(mockLevelMutate).toHaveBeenCalledWith('new-val');
      });
    });

    it('does not call addSpecializationMutation when a new specialization item is added', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-tertiaryEducation.placeholders.specialization'
        )
      );

      expect(mockSpecializationMutate).not.toHaveBeenCalled();
    });

    it('calls addSpecializationMutation with the new label when Next is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-tertiaryEducation.placeholders.specialization'
        )
      );
      await user.click(screen.getByText('tertiaryEducation.next'));

      await waitFor(() => {
        expect(mockSpecializationMutate).toHaveBeenCalledWith('new-val');
      });
    });

    it('does not call addDepartmentMutation when a new department item is added', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('add-new-tertiaryEducation.placeholders.department')
      );

      expect(mockDepartmentMutate).not.toHaveBeenCalled();
    });

    it('calls addDepartmentMutation with the new label when Next is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('add-new-tertiaryEducation.placeholders.department')
      );
      await user.click(screen.getByText('tertiaryEducation.next'));

      await waitFor(() => {
        expect(mockDepartmentMutate).toHaveBeenCalledWith('new-val');
      });
    });

    it('does not call addFacultyMutation when a new faculty item is added', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('add-new-tertiaryEducation.placeholders.faculty')
      );

      expect(mockFacultyMutate).not.toHaveBeenCalled();
    });

    it('calls addFacultyMutation with the new label when Next is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId('add-new-tertiaryEducation.placeholders.faculty')
      );
      await user.click(screen.getByText('tertiaryEducation.next'));

      await waitFor(() => {
        expect(mockFacultyMutate).toHaveBeenCalledWith('new-val');
      });
    });

    it('does not call addTertiaryAwardingBodyMutation immediately when awarding body dialog Add Now is clicked', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-tertiaryEducation.placeholders.awardingBody'
        )
      );
      await user.click(screen.getByTestId('dialog-ab-add-now'));

      expect(mockAddAwardingBodyMutate).not.toHaveBeenCalled();
    });

    it('calls addTertiaryAwardingBodyMutation with pending data when Next is clicked after dialog add', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-tertiaryEducation.placeholders.awardingBody'
        )
      );
      await user.click(screen.getByTestId('dialog-ab-add-now'));
      await user.click(screen.getByText('tertiaryEducation.next'));

      await waitFor(() => {
        expect(mockAddAwardingBodyMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            displayValue: 'New Institute',
            locationId: 'loc-1',
          })
        );
      });
    });

    it('does not add awarding body to form values when dialog is cancelled', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        screen.getByTestId(
          'add-new-tertiaryEducation.placeholders.awardingBody'
        )
      );
      expect(
        screen.getByTestId('add-awarding-body-dialog')
      ).toBeInTheDocument();

      await user.click(screen.getByTestId('dialog-ab-cancel'));

      expect(
        screen.queryByTestId('add-awarding-body-dialog')
      ).not.toBeInTheDocument();
      expect(mockAddAwardingBodyMutate).not.toHaveBeenCalled();
    });
  });

  describe('pre-population from edit mode (data from form context)', () => {
    it('initializes with empty form when tertiaryEducation is disabled and empty', () => {
      stableForm.tertiaryEducation = [
        { isEnabled: false, dataTakenFromCandidate: false, content: [] },
      ];
      renderStep();

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'false'
      );
      expect(
        screen.getByLabelText('tertiaryEducation.collectFromCandidates')
      ).not.toBeChecked();
    });

    it('restores isEnabled and dataTakenFromCandidate flags from context', () => {
      stableForm.tertiaryEducation = [
        { isEnabled: true, dataTakenFromCandidate: true, content: [] },
      ];
      renderStep();

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );
      expect(
        screen.getByLabelText('tertiaryEducation.collectFromCandidates')
      ).toBeChecked();
    });

    it('receives TertiaryEducation array with populated content from form context', () => {
      stableForm.tertiaryEducation = [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              qualificationName: [
                { id: 'q-id-1', source: 'MASTER', name: 'BSc IT' },
              ],
              tertiaryAwardingBody: [
                {
                  id: 'ab-id-1',
                  source: 'MASTER',
                  name: 'University of Colombo',
                },
              ],
              tertiaryAwardingBodyLocations: [
                { id: 'loc-id-1', source: 'MASTER', name: 'Colombo' },
              ],
              levelOfQualification: [
                { id: 'l-id-1', source: 'MASTER', name: "Master's" },
              ],
              specialization: [{ id: 's-id-1', source: 'MASTER', name: 'AI' }],
              studyMode: [
                { id: 'sm-id-1', source: 'MASTER', name: 'Full-time' },
              ],
              studyPattern: [
                { id: 'sp-id-1', source: 'MASTER', name: 'Full-Time' },
              ],
              deliverySchedule: [
                { id: 'ds-id-1', source: 'MASTER', name: 'Campus' },
              ],
              batch: [{ id: 'b-id-1', source: 'MASTER', name: 'Batch 2021' }],
              department: [{ id: 'd-id-1', source: 'MASTER', name: 'CS Dept' }],
              faculty: [{ id: 'f-id-1', source: 'MASTER', name: 'Science' }],
              grade: 'GPA 3.8',
            },
          ],
        },
      ];
      renderStep();

      // Verify section is enabled
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );

      // Verify grade field is pre-populated
      const gradeInput = screen.getByPlaceholderText(
        'tertiaryEducation.placeholders.grade'
      );
      expect(gradeInput).toHaveValue('GPA 3.8');
    });

    it('normalizes API object shape with tertiaryEducation key (from get-by-id)', () => {
      stableForm.tertiaryEducation = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        tertiaryEducation: [
          {
            qualificationName: [
              { id: 'q-id-2', source: 'MASTER', label: 'BSc CS' },
            ],
            tertiaryAwardingBody: [
              { id: 'ab-id-2', source: 'MASTER', label: 'University X' },
            ],
            tertiaryAwardingBodyLocations: [
              { id: 'loc-id-2', source: 'MASTER', label: 'Bangkok' },
            ],
            levelOfQualification: [
              { id: 'l-id-2', source: 'MASTER', label: "Bachelor's" },
            ],
            specialization: [],
            studyMode: [],
            studyPattern: [],
            deliverySchedule: [],
            batch: [],
            department: [],
            faculty: [],
            grade: 'A+',
          },
        ],
      };
      renderStep();

      // Verify section is enabled
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-checked',
        'true'
      );

      // Verify grade field shows the pre-populated value
      const gradeInput = screen.getByPlaceholderText(
        'tertiaryEducation.placeholders.grade'
      );
      expect(gradeInput).toHaveValue('A+');
    });

    it('accepts both array and object formats for pre-populated data', () => {
      stableForm.tertiaryEducation = [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              qualificationName: [
                { id: 'q-id-3', source: 'MASTER', name: 'BSc' },
              ],
              tertiaryAwardingBody: [],
              tertiaryAwardingBodyLocations: [],
              levelOfQualification: [],
              specialization: [],
              studyMode: [],
              studyPattern: [],
              deliverySchedule: [],
              batch: [],
              department: [],
              faculty: [],
              grade: 'High Distinction',
            },
          ],
        },
      ];
      renderStep();

      const gradeInput = screen.getByPlaceholderText(
        'tertiaryEducation.placeholders.grade'
      );
      expect(gradeInput).toHaveValue('High Distinction');
    });
  });
});
