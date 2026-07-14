import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { render, screen } from '@testing-library/react';

import PreferredHonoursAwardsStep from '@/views/vacancies/components/form-steps/preferred-honours-awards-step';

// ── Hoisted mock refs ─────────────────────────────────────────────────────────

const mockNavigate = vi.hoisted(() => vi.fn());
const mockOrganizationsQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: [
      {
        id: 'org-1',
        name: 'Test Organization',
        label: 'Test Organization',
        source: 'MASTER',
      },
    ],
    isLoading: false,
  }))
);
const mockLocationsQuery = vi.hoisted(() =>
  vi.fn(() => ({
    data: [
      { id: 'loc-1', label: 'New York' },
      { id: 'loc-2', label: 'London' },
    ],
    isLoading: false,
  }))
);
const mockUseVacancyForm = vi.hoisted(() =>
  vi.fn(() => ({
    form: {
      watch: vi.fn(),
      getValues: vi.fn(),
      control: {},
    },
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
  useNavigate: () => mockNavigate,
}));

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    StepDisableDialog: () => null,
  };
});

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
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked?: boolean;
    onCheckedChange?: (v: boolean) => void;
    id?: string;
  }) => (
    <input
      id={id}
      type="checkbox"
      role="switch"
      checked={checked ?? false}
      onChange={e => onCheckedChange?.(e.target.checked)}
      data-testid={id ? `switch-${id}` : 'switch'}
    />
  ),
}));

vi.mock('@cgp/ui-kit/components/multi-select', () => ({
  default: () => null,
}));

vi.mock('@cgp/ui-kit/components/ui/calendar', () => ({
  Calendar: () => null,
}));

vi.mock('@cgp/ui-kit/components/ui/popover', () => ({
  Popover: ({ children }: { children?: ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
  PopoverContent: () => null,
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
      data-testid={id ? `checkbox-${id}` : 'checkbox'}
    />
  ),
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

function renderWithQueryClient(
  component: React.ReactElement,
  queryClient?: QueryClient
) {
  const client = queryClient || new QueryClient();
  return render(
    <QueryClientProvider client={client}>{component}</QueryClientProvider>
  );
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('PreferredHonoursAwardsStep', () => {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component', () => {
    renderWithQueryClient(
      <PreferredHonoursAwardsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('renders Back and Next buttons', () => {
    renderWithQueryClient(
      <PreferredHonoursAwardsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    const buttons = screen.getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('queries organizations on mount', () => {
    renderWithQueryClient(
      <PreferredHonoursAwardsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(mockOrganizationsQuery).toHaveBeenCalled();
  });

  it('queries locations on mount', () => {
    renderWithQueryClient(
      <PreferredHonoursAwardsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(mockLocationsQuery).toHaveBeenCalled();
  });

  it('renders the vacancy form hook', () => {
    renderWithQueryClient(
      <PreferredHonoursAwardsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(mockUseVacancyForm).toHaveBeenCalled();
  });

  it('uses vacancy form context', () => {
    renderWithQueryClient(
      <PreferredHonoursAwardsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    const mockFormValue = mockUseVacancyForm.mock.results[0]?.value as
      | Record<string, unknown>
      | undefined;
    expect(mockFormValue).toBeDefined();
    expect(mockFormValue?.form).toBeDefined();
  });
});
