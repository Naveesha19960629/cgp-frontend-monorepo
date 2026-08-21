import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredVolunteeringStep from '@/views/vacancies/components/form-steps/preferred-volunteering-step';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: string }) => {
      if (key === 'preferredVolunteering.cardTitle') {
        return `Volunteering ${options?.number ?? '01'}`;
      }

      const dictionary: Record<string, string> = {
        'preferredVolunteering.title': 'Preferred Volunteering',
        'preferredVolunteering.labels.organizationName': 'Organisation Name',
        'preferredVolunteering.labels.organizationLocation':
          'Organization Location',
        'preferredVolunteering.labels.cause': 'Cause',
        'preferredVolunteering.labels.position': 'Position / Role',
        'preferredVolunteering.labels.startDate': 'Start Date',
        'preferredVolunteering.labels.endDate': 'End Date',
        'preferredVolunteering.placeholders.organizationLocation':
          'Select location',
        'preferredVolunteering.dataTakenFromCandidate':
          'If selected, no manual input is required, and data will be taken from the candidate profile',
        'preferredVolunteering.addEntry': 'Add entry',
        'preferredVolunteering.cancel': 'Cancel',
        'preferredVolunteering.next': 'Next',
      };

      return dictionary[key] ?? key;
    },
  }),
}));

// ── Mock wizard form context ──────────────────────────────────────────────────

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

// ── Mock hooks ──────────────────────────────────────────────────────────────

const mockOrganizationsData = [
  { id: 'org-1', name: 'Kingswood College', source: 'MASTER' },
  { id: 'org-2', name: 'Red Cross', source: 'MASTER' },
];

const mockCausesData = [
  { id: 'cau-1', label: 'Health', source: 'MASTER' },
  { id: 'cau-2', label: 'Education', source: 'MASTER' },
];

const mockLocationsData = [
  { id: 'loc-1', label: 'Colombo, Sri Lanka' },
  { id: 'loc-2', label: 'Kandy, Sri Lanka' },
];

vi.mock('@/views/vacancies/hooks', () => ({
  useOrganizationsQuery: () => ({
    data: mockOrganizationsData,
    isLoading: false,
  }),
  useCausesQuery: () => ({
    data: {
      data: { items: { content: mockCausesData } },
    },
    isLoading: false,
  }),
  useLocationsQuery: () => ({
    data: mockLocationsData,
    isLoading: false,
  }),
  useCreateCauseMutation: () => ({
    mutateAsync: vi.fn((label: string) => ({
      pendingId: 'pending-cause-123',
      type: 'CAUSE',
      value: label,
      status: 'PENDING',
    })),
  }),
  useCreateOrganizationMutation: () => ({
    mutateAsync: vi.fn((label: string) => ({
      pendingId: 'pending-org-123',
      type: 'ORGANIZATION',
      value: label,
      status: 'PENDING',
    })),
  }),
  useStepGuard: vi.fn(),
  useOrganizationForm: () => ({
    form: {
      control: {},
      setValue: vi.fn(),
      reset: vi.fn(),
    },
    onSubmit: vi.fn(),
  }),
}));

// ── Mock message box ────────────────────────────────────────────────────────

vi.mock('@/app/components/message-box', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

// ── Mock DisableDialog ──────────────────────────────────────────────────────

vi.mock('@/views/vacancies/components/form-steps/disable-dialog', () => ({
  default: () => null,
}));

// ── Mock UI components ──────────────────────────────────────────────────────

interface StubOption {
  value: string;
  label: string;
  source?: string;
}
vi.mock('@cgp/ui-kit/components/multi-select', () => ({
  default: ({
    placeholder,
    options = [],
    onChange,
    onSearchSync,
    disabled,
    emptyIndicator,
  }: {
    placeholder: string;
    options?: StubOption[];
    onChange?: (options: StubOption[]) => void;
    onSearchSync?: (value: string) => StubOption[];
    disabled?: boolean;
    emptyIndicator?: React.ReactNode;
  }) => (
    <div>
      <input
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        data-disabled={String(Boolean(disabled))}
      />
      {options.map(o => (
        <span key={o.value}>{o.label}</span>
      ))}
      <button type="button" onClick={() => onChange?.(options)}>
        {`select:${placeholder}`}
      </button>
      {onSearchSync && (
        <button type="button" onClick={() => onSearchSync('xaxaxax')}>
          {`search:${placeholder}`}
        </button>
      )}
      {emptyIndicator && (
        <div data-testid={`empty-${placeholder}`}>{emptyIndicator}</div>
      )}
    </div>
  ),
}));

vi.mock('@cgp/ui-kit/components/combobox', () => ({
  Combobox: ({ placeholder }: { placeholder: string }) => (
    <input placeholder={placeholder} readOnly />
  ),
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: ({ currentLength }: { currentLength: number }) => (
    <span data-testid="character-count">{currentLength}</span>
  ),
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: vi.fn(),
}));

vi.mock('@cgp/ui-kit/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/calendar', () => ({
  Calendar: () => <div>Calendar</div>,
}));

// ── Mock formatDate utility ─────────────────────────────────────────────────

vi.mock('@/views/vacancies/utils', () => ({
  formatDate: (date: string) => date,
  sanitizePlainText: (value: string) => value,
}));

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PreferredVolunteeringStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['renders the step title', 'Preferred Volunteering'],
    ['renders the informational banner', 'preferredPatents.bannerTitle'],
    ['renders the first volunteering card by default', 'Volunteering 01'],
  ])('%s', (_description, expectedText) => {
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Organisation Name')).toBeInTheDocument();
    expect(screen.getByText('Organization Location')).toBeInTheDocument();
    expect(screen.getByText('Cause')).toBeInTheDocument();
    expect(screen.getByText('Position / Role')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('calls the context onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when Next button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('renders the Organization Location as a multi-select fed by locations', () => {
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Colombo, Sri Lanka')).toBeInTheDocument();
    expect(screen.getByText('Kandy, Sri Lanka')).toBeInTheDocument();
  });

  it('saves the section to the wizard context on Next', async () => {
    const user = userEvent.setup();
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(mockOnNext).toHaveBeenCalledWith({
      preferredVolunteering: expect.objectContaining({
        isEnabled: false,
        dataTakenFromCandidate: false,
        volunteering: expect.any(Array),
      }),
    });
  });

  it('persists the selected organization locations on Next', async () => {
    const user = userEvent.setup();
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'select:Select location' })
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    const payload = mockOnNext.mock.calls[0][0].preferredVolunteering;
    expect(payload.volunteering[0].organizationLocations).toEqual([
      { value: 'loc-1', label: 'Colombo, Sri Lanka' },
      { value: 'loc-2', label: 'Kandy, Sri Lanka' },
    ]);
  });

  it('renders the add entry button', () => {
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(
      screen.getByRole('button', { name: /add entry/i })
    ).toBeInTheDocument();
  });

  it('renders the data taken from candidate checkbox', () => {
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(
      screen.getByLabelText(
        /If selected, no manual input is required, and data will be taken from the candidate profile/i
      )
    ).toBeInTheDocument();
  });

  it('keeps the add entry button disabled (multiple entries not yet released)', async () => {
    const user = userEvent.setup();
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Volunteering 01')).toBeInTheDocument();
    expect(screen.queryByText('Volunteering 02')).not.toBeInTheDocument();

    const addButton = screen.getByRole('button', { name: /add entry/i });
    expect(addButton).toBeDisabled();

    await user.click(addButton);

    expect(screen.queryByText('Volunteering 02')).not.toBeInTheDocument();
  });

  // ── Multi-select empty state (DQCGP-3671) ─────────────────────────────────
  // Every searchable multi-select must show the shared icon + title +
  // description "no data" state instead of the old plain-text message, so
  // an incorrectly formatted result doesn't look like a broken modal.
  it('passes the shared no-data empty indicator to every multi-select field', () => {
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    const placeholders = [
      'preferredVolunteering.placeholders.organizationName',
      'Select location',
      'preferredVolunteering.placeholders.cause',
    ];

    placeholders.forEach(placeholder => {
      const emptyState = screen.getByTestId(`empty-${placeholder}`);
      expect(
        within(emptyState).getByAltText('common.noData')
      ).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('common.noDataTitle');
      expect(emptyState).toHaveTextContent('common.noDataDescription');
    });
  });

  describe('enable/disable toggle (DQCGP-2866)', () => {
    it('marks every select-or-add field as disabled once the section is toggled off', async () => {
      const user = userEvent.setup();
      render(
        <PreferredVolunteeringStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );

      await user.click(screen.getByRole('switch')); // toggle on

      expect(
        screen.getByPlaceholderText('preferredVolunteering.placeholders.cause')
      ).toHaveAttribute('data-disabled', 'false');
      expect(screen.getByPlaceholderText('Select location')).toHaveAttribute(
        'data-disabled',
        'false'
      );

      await user.click(screen.getByRole('switch')); // toggle off

      expect(
        screen.getByPlaceholderText('preferredVolunteering.placeholders.cause')
      ).toHaveAttribute('data-disabled', 'true');
      expect(screen.getByPlaceholderText('Select location')).toHaveAttribute(
        'data-disabled',
        'true'
      );
    });

    it('resets the character counter when disabled with uncommitted search text', async () => {
      const user = userEvent.setup();
      render(
        <PreferredVolunteeringStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );

      await user.click(screen.getByRole('switch')); // toggle on
      await user.click(
        screen.getByRole('button', {
          name: 'search:preferredVolunteering.placeholders.cause',
        })
      );

      // The cause counter is the first of the card's two CharacterCount
      // instances (cause, then position).
      expect(screen.getAllByTestId('character-count')[0]).toHaveTextContent(
        '7'
      );

      await user.click(screen.getByRole('switch')); // toggle off

      expect(screen.getAllByTestId('character-count')[0]).toHaveTextContent(
        '0'
      );
    });

    it('marks the Position / Role input as HTML-disabled once toggled off (DQCGP-3640)', async () => {
      const user = userEvent.setup();
      render(
        <PreferredVolunteeringStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );

      await user.click(screen.getByRole('switch')); // toggle on

      const positionInput = screen.getByPlaceholderText(
        'preferredVolunteering.placeholders.position'
      );
      expect(positionInput).not.toBeDisabled();

      await user.click(screen.getByRole('switch')); // toggle off

      expect(positionInput).toBeDisabled();
    });

    it('marks the dataTakenFromCandidate checkbox itself as disabled once toggled off', async () => {
      const user = userEvent.setup();
      render(
        <PreferredVolunteeringStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );

      const checkbox = screen.getByLabelText(
        /If selected, no manual input is required, and data will be taken from the candidate profile/i
      );
      expect(checkbox).toBeDisabled(); // section starts disabled by default

      await user.click(screen.getByRole('switch')); // toggle on

      expect(checkbox).not.toBeDisabled();
    });
  });
});
