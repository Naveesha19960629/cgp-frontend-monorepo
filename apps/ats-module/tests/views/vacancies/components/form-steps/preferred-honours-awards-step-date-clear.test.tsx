import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredHonoursAwardsStep from '@/views/vacancies/components/form-steps/preferred-honours-awards-step';

// ── Hoisted mock refs ─────────────────────────────────────────────────────────

const mockOrganizationsQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: [], isLoading: false }))
);
const mockLocationsQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: [], isLoading: false }))
);
const stableContextForm = vi.hoisted<{
  watch: () => unknown;
  getValues: () => unknown;
  control: unknown;
  preferredHonoursAwards?: unknown;
}>(() => ({
  watch: () => undefined,
  getValues: () => undefined,
  control: {},
}));
const mockUseVacancyForm = vi.hoisted(() =>
  vi.fn(() => ({
    form: stableContextForm,
    setForm: vi.fn(),
    onCancel: vi.fn(),
    setStepGuard: vi.fn(),
    stepPersistRef: { current: null },
    stepDisableRef: { current: null },
    currentStepIndex: 0,
    removeCompletedStep: vi.fn(),
  }))
);

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useTemplateFieldVisible: () => () => true,
  useVacancyForm: mockUseVacancyForm,
  VACANCY_STEPS: [],
  VacancyFormProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock('@/views/vacancies/components/dialogs', () => ({
  AddOrganizationFormDialog: () => null,
}));

vi.mock('@/views/vacancies/hooks', async () => {
  const actual = await vi.importActual<
    typeof import('@/views/vacancies/hooks')
  >('@/views/vacancies/hooks');
  return {
    ...actual,
    useOrganizationsQuery: mockOrganizationsQuery,
    useLocationsQuery: mockLocationsQuery,
  };
});

vi.mock('@/views/vacancies/utils', () => ({
  resolveUserCreatedOrganizations: vi.fn((data: unknown) =>
    Promise.resolve(data)
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    type,
    disabled,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    type?: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      type={(type ?? 'button') as 'button' | 'submit'}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked?: boolean;
    onCheckedChange?: (v: boolean) => void;
  }) => (
    <input
      type="checkbox"
      role="switch"
      checked={checked ?? false}
      onChange={e => onCheckedChange?.(e.target.checked)}
    />
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

vi.mock('@cgp/ui-kit/components/multi-select', () => ({
  default: () => null,
}));

vi.mock('@cgp/ui-kit/components/ui/calendar', () => ({
  Calendar: ({
    onSelect,
    endMonth,
  }: {
    onSelect?: (d: Date) => void;
    endMonth?: Date;
  }) => {
    const isToCalendar = endMonth
      ? endMonth.getFullYear() - new Date().getFullYear() > 50
      : false;
    return (
      <button
        type="button"
        data-testid={
          isToCalendar ? 'select-issued-date-to' : 'select-issued-date-from'
        }
        onClick={() =>
          onSelect?.(
            isToCalendar ? new Date(2020, 5, 15) : new Date(2020, 0, 15)
          )
        }
      >
        select
      </button>
    );
  },
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

vi.mock('@cgp/ui-kit/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children?: ReactNode }) => <>{children}</>,
  CollapsibleTrigger: ({ children }: { children?: ReactNode }) => (
    <>{children}</>
  ),
  CollapsibleContent: ({ children }: { children?: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => null,
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  ErrorToast: vi.fn(),
  SuccessToast: vi.fn(),
}));

vi.mock('@cgp/ui-kit/lib/utils', () => ({
  cn: (...args: Array<string | undefined>) => args.filter(Boolean).join(' '),
  removeEmoji: (text: string) => text,
}));

// ── Test utility ──────────────────────────────────────────────────────────────

function renderStep() {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <PreferredHonoursAwardsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    </QueryClientProvider>
  );
  return { onNext, onBack, onSubmit };
}

const FROM_PLACEHOLDER = 'preferredHonoursAwards.issuedDateFromPlaceholder';
const TO_PLACEHOLDER = 'preferredHonoursAwards.issuedDateToPlaceholder';

async function fillDates(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('select-issued-date-from'));
  await user.click(screen.getByTestId('select-issued-date-to'));
  expect(screen.queryByText(FROM_PLACEHOLDER)).not.toBeInTheDocument();
  expect(screen.queryByText(TO_PLACEHOLDER)).not.toBeInTheDocument();
}

describe('PreferredHonoursAwardsStep - date clearing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stableContextForm.preferredHonoursAwards = undefined;
  });

  it('clears issued date from/to when the section toggle is switched off and disable is confirmed', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('switch'));
    await fillDates(user);

    await user.click(screen.getByRole('switch'));
    const confirmButton = await screen.findByText(
      'preferredHonoursAwards.disableDialog.confirmButton'
    );
    await user.click(confirmButton);

    expect(screen.getByText(FROM_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText(TO_PLACEHOLDER)).toBeInTheDocument();
  });

  it('clears issued date from/to when the data-taken-from-candidate checkbox is checked', async () => {
    const user = userEvent.setup();
    renderStep();

    await user.click(screen.getByRole('switch'));
    await fillDates(user);

    await user.click(
      screen.getByLabelText('preferredHonoursAwards.dataTakenFromCandidate')
    );

    expect(screen.getByText(FROM_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText(TO_PLACEHOLDER)).toBeInTheDocument();
  });

  it('clears pre-loaded (edit mode) issued dates when the section toggle is switched off and confirmed', async () => {
    stableContextForm.preferredHonoursAwards = {
      isEnabled: true,
      dataTakenFromCandidate: false,
      honoursAndAwards: [
        {
          title: 'Employee of the year',
          issuedBy: 'Acme Corp',
          issuedDateFrom: new Date(2019, 0, 1),
          issuedDateTo: new Date(2019, 5, 1),
          associatedOrganizations: [],
          organizationLocations: [],
          isOpen: true,
        },
      ],
    };
    const user = userEvent.setup();
    renderStep();

    expect(screen.queryByText(FROM_PLACEHOLDER)).not.toBeInTheDocument();
    expect(screen.queryByText(TO_PLACEHOLDER)).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch'));
    const confirmButton = await screen.findByText(
      'preferredHonoursAwards.disableDialog.confirmButton'
    );
    await user.click(confirmButton);

    expect(screen.getByText(FROM_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText(TO_PLACEHOLDER)).toBeInTheDocument();
  });

  it('clears pre-loaded (edit mode) issued dates when the data-taken-from-candidate checkbox is checked', async () => {
    stableContextForm.preferredHonoursAwards = {
      isEnabled: true,
      dataTakenFromCandidate: false,
      honoursAndAwards: [
        {
          title: 'Employee of the year',
          issuedBy: 'Acme Corp',
          issuedDateFrom: new Date(2019, 0, 1),
          issuedDateTo: new Date(2019, 5, 1),
          associatedOrganizations: [],
          organizationLocations: [],
          isOpen: true,
        },
      ],
    };
    const user = userEvent.setup();
    renderStep();

    expect(screen.queryByText(FROM_PLACEHOLDER)).not.toBeInTheDocument();
    expect(screen.queryByText(TO_PLACEHOLDER)).not.toBeInTheDocument();

    await user.click(
      screen.getByLabelText('preferredHonoursAwards.dataTakenFromCandidate')
    );

    expect(screen.getByText(FROM_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText(TO_PLACEHOLDER)).toBeInTheDocument();
  });
});
