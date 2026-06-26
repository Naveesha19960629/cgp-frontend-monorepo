import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredSportsStep from '@/views/vacancies/components/form-steps/preferred-sports-step';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: string }) => {
      if (key === 'preferredSports.cardTitle') {
        return `Sports ${options?.number ?? '01'}`;
      }

      const dictionary: Record<string, string> = {
        'preferredSports.title': 'Preferred Sports',
        'preferredSports.labels.sport': 'Name of the Sport',
        'preferredSports.labels.organizationLocation': 'Organization Location',
        'preferredSports.labels.levelRepresented': 'Level Represented',
        'preferredSports.labels.representedOrganization':
          'Represented Organization',
        'preferredSports.labels.position': 'Position / Role Held',
        'preferredSports.labels.startDate': 'Start Date',
        'preferredSports.labels.endDate': 'End Date',
        'preferredSports.placeholders.sport': 'Select or add sport name',
        'preferredSports.placeholders.organizationLocation': 'Select location',
        'preferredSports.dataTakenFromCandidate':
          'If selected, no manual input is required, and data will be taken from the candidate profile',
        'preferredSports.addEntry': 'Add entry',
        'preferredSports.cancel': 'Cancel',
        'preferredSports.next': 'Next',
      };

      return dictionary[key] ?? key;
    },
  }),
}));

// ── Mock wizard form context ──────────────────────────────────────────────────

const onCancel = vi.hoisted(() => vi.fn());
vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
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

const mockSportsData = [
  { id: 'spo-1', name: 'Cricket', source: 'MASTER' },
  { id: 'spo-2', name: 'Rugby', source: 'MASTER' },
  // Master item exposing only `label` (no `name`) — reproduces the
  // "dropdown shows id instead of name" bug fixed by the `name || label` fallback.
  { id: 'spo-3', label: 'Tennis', source: 'MASTER' },
];

const mockOrganizationsData = [
  { id: 'org-1', name: 'University A', source: 'MASTER' },
  { id: 'org-2', name: 'University B', source: 'MASTER' },
];

const mockLocationsData = [
  { id: 'loc-1', label: 'Colombo, Sri Lanka' },
  { id: 'loc-2', label: 'London, UK' },
];

vi.mock('@/views/vacancies/hooks', () => ({
  useSportsQuery: () => ({
    data: mockSportsData,
    isLoading: false,
  }),
  useSportLevelsQuery: () => ({
    data: [
      { id: 'lvl-1', label: 'International Level', source: 'MASTER' },
      { id: 'lvl-2', label: 'National Level', source: 'MASTER' },
    ],
    isLoading: false,
  }),
  useOrganizationsQuery: () => ({
    data: mockOrganizationsData,
    isLoading: false,
  }),
  useLocationsQuery: () => ({
    data: mockLocationsData,
    isLoading: false,
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

vi.mock('@/components/message-box', () => ({
  default: () => <div>message-box</div>,
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
  }: {
    placeholder: string;
    options?: StubOption[];
    onChange?: (options: StubOption[]) => void;
  }) => (
    <div>
      <input placeholder={placeholder} readOnly />
      {options.map(o => (
        <span key={o.value}>{o.label}</span>
      ))}
      <button type="button" onClick={() => onChange?.(options)}>
        {`select:${placeholder}`}
      </button>
    </div>
  ),
}));

vi.mock('@cgp/ui-kit/components/combobox', () => ({
  Combobox: ({ placeholder }: { placeholder: string }) => (
    <input placeholder={placeholder} readOnly />
  ),
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => <span>0/100</span>,
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

describe('PreferredSportsStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the step title', () => {
    render(
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Preferred Sports')).toBeInTheDocument();
  });

  it('renders the informational banner', () => {
    render(
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('message-box')).toBeInTheDocument();
  });

  it('renders the first sport card by default', () => {
    render(
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Sports 01')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Name of the Sport')).toBeInTheDocument();
    expect(screen.getByText('Organization Location')).toBeInTheDocument();
    expect(screen.getByText('Level Represented')).toBeInTheDocument();
    expect(screen.getByText('Represented Organization')).toBeInTheDocument();
    expect(screen.getByText('Position / Role Held')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('calls the context onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredSportsStep
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
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('resolves the sport name from `label` when `name` is absent', () => {
    render(
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    // Without the `s.name || s.label` fallback this option would be blank.
    expect(screen.getByText('Tennis')).toBeInTheDocument();
    expect(screen.getByText('Cricket')).toBeInTheDocument();
  });

  it('renders the Organization Location as a multi-select fed by locations', () => {
    render(
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Colombo, Sri Lanka')).toBeInTheDocument();
    expect(screen.getByText('London, UK')).toBeInTheDocument();
  });

  it('saves the section to the wizard context on Next', async () => {
    const user = userEvent.setup();
    render(
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(mockOnNext).toHaveBeenCalledWith({
      preferredSports: expect.objectContaining({
        isEnabled: false,
        dataTakenFromCandidate: false,
        sports: expect.any(Array),
      }),
    });
  });

  it('persists the resolved sport label and organization locations on Next', async () => {
    const user = userEvent.setup();
    render(
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'select:Select or add sport name' })
    );
    await user.click(
      screen.getByRole('button', { name: 'select:Select location' })
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    const payload = mockOnNext.mock.calls[0][0].preferredSports;
    expect(payload.sports[0].sport).toContainEqual({
      value: 'spo-3',
      label: 'Tennis',
      source: 'MASTER',
    });
    expect(payload.sports[0].organizationLocations).toEqual([
      { value: 'loc-1', label: 'Colombo, Sri Lanka' },
      { value: 'loc-2', label: 'London, UK' },
    ]);
  });

  it('renders the add entry button', () => {
    render(
      <PreferredSportsStep
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
      <PreferredSportsStep
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
      <PreferredSportsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Sports 01')).toBeInTheDocument();
    expect(screen.queryByText('Sports 02')).not.toBeInTheDocument();

    const addButton = screen.getByRole('button', { name: /add entry/i });
    expect(addButton).toBeDisabled();

    await user.click(addButton);

    // Disabled button must not append a second card.
    expect(screen.queryByText('Sports 02')).not.toBeInTheDocument();
  });
});
