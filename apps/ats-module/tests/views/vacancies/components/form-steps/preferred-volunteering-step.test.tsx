import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredVolunteeringStep from '@/views/vacancies/components/form-steps/preferred-volunteering-step';

// ── Mock wizard form context ──────────────────────────────────────────────────

const onCancel = vi.hoisted(() => vi.fn());
vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useVacancyForm: () => ({ form: {}, onCancel }),
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
}));

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PreferredVolunteeringStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the step title', () => {
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Preferred Volunteering')).toBeInTheDocument();
  });

  it('renders the informational banner', () => {
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(
      screen.getByText('preferredPatents.bannerTitle')
    ).toBeInTheDocument();
  });

  it('renders the first volunteering card by default', () => {
    render(
      <PreferredVolunteeringStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('Volunteering 01')).toBeInTheDocument();
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
});
