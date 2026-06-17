import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredPatentsStep from '@/views/vacancies/components/form-steps/preferred-patents-step';

// ── Hoisted mock refs ─────────────────────────────────────────────────────────

const mockNavigate = vi.hoisted(() => vi.fn());
const mockIndustriesQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false }))
);
const mockCreateIndustryMutation = vi.hoisted(() =>
  vi.fn(() => ({ mutateAsync: vi.fn() }))
);
const mockUseVacancyForm = vi.hoisted(() =>
  vi.fn(() => ({
    form: {
      patents: {
        isEnabled: false,
        dataTakenFromCandidate: false,
        patents: [],
      },
    },
    setForm: vi.fn(),
    setStepGuard: vi.fn(),
    stepPersistRef: { current: null },
    stepDisableRef: { current: null },
  }))
);

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/components/message-box', () => ({
  default: () => null,
}));

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    StepDisableDialog: () => null,
  };
});

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useVacancyForm: mockUseVacancyForm,
  VACANCY_STEPS: [],
  VacancyFormProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock('@/views/vacancies/hooks', async () => {
  const actual = await vi.importActual<
    typeof import('@/views/vacancies/hooks')
  >('@/views/vacancies/hooks');
  return {
    ...actual,
    useIndustriesQuery: mockIndustriesQuery,
    useCreateIndustryMutation: mockCreateIndustryMutation,
  };
});

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
    />
  ),
}));

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('PreferredPatentsStep', () => {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'preferredPatents.title' })
    ).toBeInTheDocument();
  });

  it('renders the cancel button', () => {
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(
      screen.getByText('preferredPatents.cancelButton')
    ).toBeInTheDocument();
  });

  it('renders Back and Next buttons', () => {
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('calls onBack when the Back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when the Next button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
  });

  it('does not call onNext when the Back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onNext).not.toHaveBeenCalled();
  });
});
