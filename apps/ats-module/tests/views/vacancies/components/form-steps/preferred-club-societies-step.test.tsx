import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredClubSocietiesStep from '@/views/vacancies/components/form-steps/preferred-club-societies-step';

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

const mockSocietiesData = [
  { id: 'soc-1', name: 'Rotaract Club', source: 'MASTER' },
  { id: 'soc-2', name: 'Swimming Team', source: 'MASTER' },
  // Master item exposing only `label` (no `name`) — reproduces the
  // "dropdown shows id instead of name" bug fixed by the `name || label` fallback.
  { id: 'soc-3', label: 'Debate Society', source: 'MASTER' },
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
  useSocietiesQuery: () => ({
    data: {
      data: { items: { content: mockSocietiesData } },
    },
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
  CharacterCount: () => <span>0/250</span>,
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
}));

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PreferredClubSocietiesStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the step title', () => {
    render(
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(
      screen.getByText('Preferred Clubs and Societies')
    ).toBeInTheDocument();
  });

  it('renders the informational banner', () => {
    render(
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(
      screen.getByText('preferredPatents.bannerTitle')
    ).toBeInTheDocument();
  });

  it('renders the first club/society card by default', () => {
    render(
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Clubs and societies 01')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Club / Society')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    expect(screen.getByText('Represented Organization')).toBeInTheDocument();
    expect(screen.getByText('Organization Location')).toBeInTheDocument();
    expect(screen.getByText('Position / Role Held')).toBeInTheDocument();
  });

  it('calls the context onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredClubSocietiesStep
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
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('resolves the society name from `label` when `name` is absent', () => {
    render(
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    // Without the `s.name || s.label` fallback this option would be blank.
    expect(screen.getByText('Debate Society')).toBeInTheDocument();
    expect(screen.getByText('Rotaract Club')).toBeInTheDocument();
  });

  it('renders the Organization Location as a multi-select fed by locations', () => {
    render(
      <PreferredClubSocietiesStep
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
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(mockOnNext).toHaveBeenCalledWith({
      preferredClubSocieties: expect.objectContaining({
        isEnabled: false,
        dataTakenFromCandidate: false,
        clubSocieties: expect.any(Array),
      }),
    });
  });

  it('persists the resolved society label and organization locations on Next', async () => {
    const user = userEvent.setup();
    render(
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'select:Select or add club or society',
      })
    );
    await user.click(
      screen.getByRole('button', { name: 'select:Select location' })
    );
    await user.click(screen.getByRole('button', { name: /next/i }));

    const payload = mockOnNext.mock.calls[0][0].preferredClubSocieties;
    expect(payload.clubSocieties[0].clubSociety).toContainEqual({
      value: 'soc-3',
      label: 'Debate Society',
      source: 'MASTER',
    });
    expect(payload.clubSocieties[0].organizationLocations).toEqual([
      { value: 'loc-1', label: 'Colombo, Sri Lanka' },
      { value: 'loc-2', label: 'London, UK' },
    ]);
  });

  it('renders the add entry button', () => {
    render(
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    const addButton = screen.getByRole('button', { name: /add entry/i });
    expect(addButton).toBeInTheDocument();
  });

  it('renders the data taken from candidate checkbox', () => {
    render(
      <PreferredClubSocietiesStep
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
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    // Initially only one card
    expect(screen.getByText('Clubs and societies 01')).toBeInTheDocument();
    expect(
      screen.queryByText('Clubs and societies 02')
    ).not.toBeInTheDocument();

    const addButton = screen.getByRole('button', { name: /add entry/i });
    expect(addButton).toBeDisabled();

    await user.click(addButton);

    // Disabled button must not append a second card.
    expect(
      screen.queryByText('Clubs and societies 02')
    ).not.toBeInTheDocument();
  });
});
