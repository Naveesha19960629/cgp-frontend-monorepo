import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectsRequirementsStep from '@/views/vacancies/components/form-steps/projects-requirements-step';

import { Calendar } from '@cgp/ui-kit/components/ui/calendar';

// ── Mock react-i18next ──────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en' },
    }),
  };
});

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

const mockIndustriesData = [
  { id: 'ind-1', label: 'Technology', source: 'MASTER' },
  { id: 'ind-2', label: 'Healthcare', source: 'MASTER' },
];

const mockOrganizationsData = [
  { id: 'org-1', name: 'Tech Corp', source: 'MASTER' },
  { id: 'org-2', name: 'Health Inc', source: 'MASTER' },
];

const mockLocationsData = [
  { id: 'loc-1', label: 'New York, USA' },
  { id: 'loc-2', label: 'San Francisco, USA' },
];

vi.mock('@/views/vacancies/hooks', () => ({
  useIndustriesQuery: () => ({
    data: {
      data: { items: { content: mockIndustriesData } },
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
  useCreateIndustryMutation: () => ({
    mutateAsync: vi.fn((label: string) => ({
      pendingId: 'pending-ind-123',
      type: 'INDUSTRY',
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

vi.mock('@/components/message-box', () => ({
  default: ({ fields }: { fields: string[] }) => (
    <div data-testid="message-box">
      {fields.map(field => (
        <span key={field}>{field}</span>
      ))}
    </div>
  ),
}));

// ── Mock DisableDialog ──────────────────────────────────────────────────────

vi.mock('@/views/vacancies/components/form-steps/disable-dialog', () => ({
  default: () => null,
}));

// ── Mock StepDisableDialog ──────────────────────────────────────────────────

vi.mock('@/views/vacancies/components/step-disable-dialog', () => ({
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
        data-testid={`multi-select-${placeholder}`}
      />
      {options.map(o => (
        <span key={o.value}>{o.label}</span>
      ))}
      <button
        type="button"
        onClick={() => onChange?.(options)}
        disabled={disabled}
      >
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

type CalendarProps = {
  disabled?: (date: Date) => boolean;
  onSelect?: (date: Date | undefined) => void;
};

vi.mock('@cgp/ui-kit/components/ui/calendar', () => ({
  Calendar: vi.fn((_props: CalendarProps) => <div>Calendar</div>),
}));

vi.mock('@cgp/ui-kit/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    disabled,
    onCheckedChange,
    id,
  }: {
    checked?: boolean;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    id?: string;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      disabled={disabled}
      onChange={e => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/label', () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock('@cgp/ui-kit/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onCheckedChange?.(e.target.checked)}
      data-testid="toggle-switch"
    />
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'reset' | 'submit';
  }) => (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// ── Mock formatDate utility ─────────────────────────────────────────────────

vi.mock('@/views/vacancies/utils', () => ({
  formatDate: (date: string) => date,
}));

vi.mock('@/views/vacancies/utils/date-timezone-safe', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@/views/vacancies/utils/date-timezone-safe')
    >();
  return {
    ...actual,
    formatLocalDate: (date: Date) => date.toISOString().split('T')[0],
    parseLocalDate: (dateString?: string) =>
      dateString ? new Date(dateString) : null,
  };
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ProjectsRequirementsStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the step title', () => {
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText('projectsRequirements.title')).toBeInTheDocument();
  });

  it('renders the informational MessageBox with correct field labels', () => {
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    // MessageBox is rendered with field labels as translation keys
    expect(
      screen.getByText('projectsRequirements.fieldList.projectName')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.fieldList.relatedIndustry')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.fieldList.organization')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.fieldList.startDate')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.fieldList.endDate')
    ).toBeInTheDocument();
  });

  it('renders the first project card by default', () => {
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    // Project card heading includes number in translation key
    expect(
      screen.getByText(/projectsRequirements.projectCard/)
    ).toBeInTheDocument();
  });

  it('renders all form fields in the project card', () => {
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(
      screen.getByText('projectsRequirements.startDate')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.endDate')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.relatedIndustry')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.organizationLocation')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.organizationName')
    ).toBeInTheDocument();
  });

  it('calls the context onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find(
      btn => btn.textContent === 'projectsRequirements.cancel'
    );
    expect(cancelButton).toBeDefined();
    if (cancelButton) {
      await user.click(cancelButton);
    }
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Back button is disabled when section is enabled but no data entered', async () => {
    const user = userEvent.setup();
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    // Enable the section - now canNavigate is false because no data
    const toggleSwitch = screen.getByTestId('toggle-switch');
    await user.click(toggleSwitch);

    const buttons = screen.getAllByRole('button');
    const backButton = buttons.find(
      btn => btn.getAttribute('aria-label') === 'projectsRequirements.back'
    );
    // Back button should be disabled when section is enabled but no data entered
    expect(backButton?.hasAttribute('disabled')).toBe(true);
  });

  it('Next button is disabled when section is enabled but no data entered', async () => {
    const user = userEvent.setup();
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    // Enable the section - now canNavigate is false because no data
    const toggleSwitch = screen.getByTestId('toggle-switch');
    await user.click(toggleSwitch);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(
      btn => btn.textContent === 'projectsRequirements.next'
    );
    // Next button should be disabled when section is enabled but no data entered
    expect(nextButton?.hasAttribute('disabled')).toBe(true);
  });

  it('can enable the section with toggle switch', async () => {
    const user = userEvent.setup();
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    // First enable the toggle
    const toggleSwitch = screen.getByTestId('toggle-switch');
    expect((toggleSwitch as HTMLInputElement).checked).toBe(false);
    await user.click(toggleSwitch);
    expect((toggleSwitch as HTMLInputElement).checked).toBe(true);
  });

  it('disables all input fields when data taken from candidate is checked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    // Enable the toggle
    const toggleSwitch = screen.getByTestId('toggle-switch');
    await user.click(toggleSwitch);

    // Find and check the "data from candidate" checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    const dataFromCandidateCheckbox = checkboxes.find(
      cb => cb.id === 'projectsDataTakenFromCandidate'
    );
    expect(dataFromCandidateCheckbox).toBeDefined();
    if (dataFromCandidateCheckbox) {
      await user.click(dataFromCandidateCheckbox);
    }

    // Verify that input fields are disabled
    const multiSelects = screen.getAllByTestId(/multi-select-/);
    multiSelects.forEach(select => {
      expect(select).toBeDisabled();
    });
  });

  it('renders toggle switch in header for enabling/disabling section', () => {
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    const toggleSwitch = screen.getByTestId('toggle-switch');
    expect(toggleSwitch).toBeInTheDocument();
    expect((toggleSwitch as HTMLInputElement).checked).toBe(false);
  });

  it('renders correct number of fields in MessageBox', () => {
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    // All 5 field translation keys should be in the document
    expect(
      screen.getByText('projectsRequirements.fieldList.projectName')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.fieldList.relatedIndustry')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.fieldList.organization')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.fieldList.startDate')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.fieldList.endDate')
    ).toBeInTheDocument();
  });

  it('displays "data from candidate profile" checkbox label', () => {
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );
    expect(
      screen.getByText('projectsRequirements.dataTakenFromCandidate')
    ).toBeInTheDocument();
  });

  // ── Multi-select empty state (DQCGP-3671) ─────────────────────────────────
  // Every searchable multi-select must show the shared icon + title +
  // description "no data" state instead of the old plain-text message, so
  // an incorrectly formatted result doesn't look like a broken modal.
  it('passes the shared no-data empty indicator to every multi-select field', () => {
    render(
      <ProjectsRequirementsStep
        onNext={mockOnNext}
        onBack={mockOnBack}
        onSubmit={vi.fn()}
      />
    );

    const placeholders = [
      'projectsRequirements.placeholders.relatedIndustry',
      'projectsRequirements.placeholders.organizationLocation',
      'projectsRequirements.placeholders.organizationName',
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
    it('resets the industries character counter when disabled with uncommitted search text', async () => {
      const user = userEvent.setup();
      render(
        <ProjectsRequirementsStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );

      const toggleSwitch = screen.getByTestId('toggle-switch');
      await user.click(toggleSwitch); // enable

      await user.click(
        screen.getByRole('button', {
          name: 'search:projectsRequirements.placeholders.relatedIndustry',
        })
      );
      expect(screen.getByTestId('character-count')).toHaveTextContent('7');

      await user.click(toggleSwitch); // disable, no data entered yet

      expect(screen.getByTestId('character-count')).toHaveTextContent('0');
    });

    it('marks the dataTakenFromCandidate checkbox itself as disabled once toggled off (DQCGP-3640)', async () => {
      const user = userEvent.setup();
      render(
        <ProjectsRequirementsStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );

      const toggleSwitch = screen.getByTestId('toggle-switch');
      await user.click(toggleSwitch); // enable

      const checkboxes = screen.getAllByRole('checkbox');
      const dataFromCandidateCheckbox = checkboxes.find(
        cb => cb.id === 'projectsDataTakenFromCandidate'
      );
      expect(dataFromCandidateCheckbox).not.toBeDisabled();

      await user.click(toggleSwitch); // disable, no data entered yet

      expect(dataFromCandidateCheckbox).toBeDisabled();
    });
  });

  describe('project date pickers', () => {
    function renderEnabled() {
      render(
        <ProjectsRequirementsStep
          onNext={mockOnNext}
          onBack={mockOnBack}
          onSubmit={vi.fn()}
        />
      );
      return screen.getByTestId('toggle-switch');
    }

    it("rejects future dates and dates before the 100-year boundary for the project's start date", async () => {
      const user = userEvent.setup();
      const toggleSwitch = renderEnabled();
      await user.click(toggleSwitch); // enable

      // [startDate call, endDate call] — start renders first each pass.
      const startCall = vi.mocked(Calendar).mock.calls[0]?.[0] as
        | CalendarProps
        | undefined;
      const disabled = startCall?.disabled;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const hundredOneYearsAgo = new Date();
      hundredOneYearsAgo.setFullYear(hundredOneYearsAgo.getFullYear() - 101);

      expect(disabled?.(new Date())).toBe(false); // today is allowed
      expect(disabled?.(tomorrow)).toBe(true); // a start date can't be in the future
      expect(disabled?.(hundredOneYearsAgo)).toBe(true);
    });

    it("rejects dates before the current start date and beyond the 100-year boundary for the project's end date", async () => {
      const user = userEvent.setup();
      const toggleSwitch = renderEnabled();
      await user.click(toggleSwitch); // enable

      const endCall = vi.mocked(Calendar).mock.calls[1]?.[0] as
        | CalendarProps
        | undefined;
      const disabled = endCall?.disabled;

      const hundredOneYearsFromNow = new Date();
      hundredOneYearsFromNow.setFullYear(
        hundredOneYearsFromNow.getFullYear() + 101
      );

      expect(disabled?.(new Date())).toBe(false); // no start date yet — today is allowed
      expect(disabled?.(hundredOneYearsFromNow)).toBe(true);
    });

    it('clears the end date once a newly selected start date falls after it', async () => {
      const user = userEvent.setup();
      const toggleSwitch = renderEnabled();
      await user.click(toggleSwitch); // enable

      // Select an end date first.
      let calls = vi.mocked(Calendar).mock.calls;
      const initialEndCall = calls[calls.length - 1]?.[0] as CalendarProps;
      act(() => {
        initialEndCall.onSelect?.(new Date(2025, 5, 10)); // 2025-06-10
      });

      // Then select a start date that falls after that end date.
      calls = vi.mocked(Calendar).mock.calls;
      const latestStartCall = calls[calls.length - 2]?.[0] as CalendarProps;
      act(() => {
        latestStartCall.onSelect?.(new Date(2025, 5, 20)); // 2025-06-20
      });

      // The end date field should have been cleared back to its placeholder.
      await waitFor(() => {
        expect(
          screen.getByText('projectsRequirements.placeholders.endDate')
        ).toBeInTheDocument();
      });
    });
  });
});
