import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredClubSocietiesStep from '@/views/vacancies/components/form-steps/preferred-club-societies-step';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: string }) => {
      if (key === 'preferredClubSocieties.cardTitle') {
        return `Clubs and societies ${options?.number ?? '01'}`;
      }

      const dictionary: Record<string, string> = {
        'preferredClubSocieties.title': 'Preferred Clubs and Societies',
        'preferredClubSocieties.labels.clubSociety': 'Club / Society',
        'preferredClubSocieties.labels.startDate': 'Start Date',
        'preferredClubSocieties.labels.endDate': 'End Date',
        'preferredClubSocieties.labels.representedOrganization':
          'Represented Organization',
        'preferredClubSocieties.labels.organizationLocation':
          'Organization Location',
        'preferredClubSocieties.labels.position': 'Position / Role Held',
        'preferredClubSocieties.placeholders.clubSociety':
          'Select or add club or society',
        'preferredClubSocieties.placeholders.organizationLocation':
          'Select location',
        'preferredClubSocieties.dataTakenFromCandidate':
          'If selected, no manual input is required, and data will be taken from the candidate profile',
        'preferredClubSocieties.addEntry': 'Add entry',
        'preferredClubSocieties.cancel': 'Cancel',
        'preferredClubSocieties.next': 'Next',
      };

      return dictionary[key] ?? key;
    },
  }),
}));

// ── Mock wizard form context ──────────────────────────────────────────────────

const onCancel = vi.hoisted(() => vi.fn());
// Mutable predicate so individual tests can drive the template field-visibility
// gating (DQCGP-2198). Defaults to all-visible, matching the normal create flow.
const clubFieldVisible = vi.hoisted(() => ({
  current: (_fieldCode: string): boolean => true,
}));
vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useTemplateFieldVisible: () => (fieldCode: string) =>
    clubFieldVisible.current(fieldCode),
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
  useCreateSocietyMutation: () => ({
    mutateAsync: vi.fn((label: string) => ({
      pendingId: 'pending-soc-123',
      type: 'SOCIETY',
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
  }: {
    placeholder: string;
    options?: StubOption[];
    onChange?: (options: StubOption[]) => void;
    onSearchSync?: (value: string) => StubOption[];
    disabled?: boolean;
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

describe('PreferredClubSocietiesStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clubFieldVisible.current = () => true;
  });

  it.each([
    ['renders the step title', 'Preferred Clubs and Societies'],
    ['renders the informational banner', 'preferredPatents.bannerTitle'],
    [
      'renders the first club/society card by default',
      'Clubs and societies 01',
    ],
  ])('%s', (_description, expectedText) => {
    render(
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText(expectedText)).toBeInTheDocument();
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

  // ── Template field-visibility gating (DQCGP-2198) ─────────────────────────
  // When launched from a template, each Clubs & Societies field must render only
  // when the template enabled it. Field codes come from TEMPLATE_SECTIONS
  // ('clubsAndSocieties'): clubSociety, organization, organizationLocations,
  // positionRoleHeld, startDate, endDate.
  it('hides fields the template did not enable', () => {
    // Template enables only Club/Society and Organization Location.
    const enabled = new Set(['clubSociety', 'organizationLocations']);
    clubFieldVisible.current = fieldCode => enabled.has(fieldCode);

    render(
      <PreferredClubSocietiesStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    // Enabled fields render.
    expect(screen.getByText('Club / Society')).toBeInTheDocument();
    expect(screen.getByText('Organization Location')).toBeInTheDocument();

    // Disabled fields are gated out.
    expect(screen.queryByText('Start Date')).not.toBeInTheDocument();
    expect(screen.queryByText('End Date')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Represented Organization')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Position / Role Held')).not.toBeInTheDocument();
  });

  it('renders every field when the template enables them all', () => {
    clubFieldVisible.current = () => true;

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

  describe('enable/disable toggle (DQCGP-2866)', () => {
    it('marks every select-or-add field as disabled once the section is toggled off', async () => {
      const user = userEvent.setup();
      render(
        <PreferredClubSocietiesStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );

      await user.click(screen.getByRole('switch')); // toggle on

      expect(
        screen.getByPlaceholderText('Select or add club or society')
      ).toHaveAttribute('data-disabled', 'false');
      expect(screen.getByPlaceholderText('Select location')).toHaveAttribute(
        'data-disabled',
        'false'
      );

      await user.click(screen.getByRole('switch')); // toggle off

      expect(
        screen.getByPlaceholderText('Select or add club or society')
      ).toHaveAttribute('data-disabled', 'true');
      expect(screen.getByPlaceholderText('Select location')).toHaveAttribute(
        'data-disabled',
        'true'
      );
    });

    it('resets the character counter when disabled with uncommitted search text', async () => {
      const user = userEvent.setup();
      render(
        <PreferredClubSocietiesStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );

      await user.click(screen.getByRole('switch')); // toggle on
      await user.click(
        screen.getByRole('button', {
          name: 'search:Select or add club or society',
        })
      );

      // The club/society counter is the first of the card's two
      // CharacterCount instances (club/society, then position).
      expect(screen.getAllByTestId('character-count')[0]).toHaveTextContent(
        '7'
      );

      await user.click(screen.getByRole('switch')); // toggle off

      expect(screen.getAllByTestId('character-count')[0]).toHaveTextContent(
        '0'
      );
    });

    it('marks the Position / Role Held input as HTML-disabled once toggled off (DQCGP-3640)', async () => {
      const user = userEvent.setup();
      render(
        <PreferredClubSocietiesStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );

      await user.click(screen.getByRole('switch')); // toggle on

      const positionInput = screen.getByPlaceholderText(
        'preferredClubSocieties.placeholders.position'
      );
      expect(positionInput).not.toBeDisabled();

      await user.click(screen.getByRole('switch')); // toggle off

      expect(positionInput).toBeDisabled();
    });

    it('marks the dataTakenFromCandidate checkbox itself as disabled once toggled off', async () => {
      const user = userEvent.setup();
      render(
        <PreferredClubSocietiesStep
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
