import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import JobRequirementsStep from '@/views/vacancies/components/form-steps/job-requirements-step';

// ── Hoisted mock refs ─────────────────────────────────────────────────────────

const mockNavigate = vi.hoisted(() => vi.fn());

const mockDisciplinesQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false }))
);
const mockCareerPathsQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false }))
);
const mockRolesQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false }))
);
const mockJobTitlesQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false }))
);
const mockEmploymentTypesQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false }))
);
const mockWorkSchedulesQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false }))
);
const mockEngagementModelsQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false }))
);
const mockJobLevelsQuery = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false }))
);

const mockAddDisciplineMutation = vi.hoisted(() =>
  vi.fn(() => ({ mutateAsync: vi.fn() }))
);
const mockAddCareerPathMutation = vi.hoisted(() =>
  vi.fn(() => ({ mutateAsync: vi.fn() }))
);
const mockAddRoleMutation = vi.hoisted(() =>
  vi.fn(() => ({ mutateAsync: vi.fn() }))
);
const mockAddJobTitleMutation = vi.hoisted(() =>
  vi.fn(() => ({ mutateAsync: vi.fn() }))
);

const mockStepDraftSaveRef = {
  current: null as (() => Promise<unknown>) | null,
};

const mockOnCancel = vi.hoisted(() => vi.fn());

const mockUseVacancyForm = vi.hoisted(() =>
  vi.fn(() => ({
    form: {
      jobRequirements: [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          discipline: [],
          careerPath: [],
          level: [],
          role: [],
          jobTitle: [],
          employmentType: [],
          workSchedule: [],
          engagementModel: [],
          description: '',
        },
      ],
    },
    onCancel: mockOnCancel,
    stepDraftSaveRef: mockStepDraftSaveRef,
  }))
);

const mockFormWatch = vi.hoisted(() =>
  vi.fn((field: string) => {
    const defaults: Record<string, unknown> = {
      discipline: [],
      careerPath: [],
      level: [],
      description: '',
    };
    return defaults[field] ?? [];
  })
);

const mockFormHandleSubmit = vi.hoisted(() => vi.fn((fn: () => void) => fn));

const mockFormTrigger = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));

const mockJobRequirementsForm = vi.hoisted(() =>
  vi.fn(() => ({
    watch: mockFormWatch,
    handleSubmit: mockFormHandleSubmit,
    control: {},
    setValue: vi.fn(),
    getValues: vi.fn(() => ({
      isEnabled: true,
      dataTakenFromCandidate: false,
      discipline: [],
      careerPath: [],
      level: [],
      role: [],
      jobTitle: [],
      employmentType: [],
      workSchedule: [],
      engagementModel: [],
      description: '',
    })),
    trigger: mockFormTrigger,
    formState: { errors: {} },
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

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useVacancyForm: mockUseVacancyForm,
}));

vi.mock('@/views/vacancies/hooks/use-job-requirements-form', () => ({
  useJobRequirementsForm: mockJobRequirementsForm,
}));

vi.mock('@/views/vacancies/hooks', async () => {
  const actual = await vi.importActual<
    typeof import('@/views/vacancies/hooks')
  >('@/views/vacancies/hooks');
  return {
    ...actual,
    useDisciplinesQuery: mockDisciplinesQuery,
    useCareerPathsQuery: mockCareerPathsQuery,
    useRolesQuery: mockRolesQuery,
    useJobTitlesQuery: mockJobTitlesQuery,
    useEmploymentTypesQuery: mockEmploymentTypesQuery,
    useWorkSchedulesQuery: mockWorkSchedulesQuery,
    useEngagementModelsQuery: mockEngagementModelsQuery,
    useJobLevelsQuery: mockJobLevelsQuery,
    useAddDisciplineMutation: mockAddDisciplineMutation,
    useAddCareerPathMutation: mockAddCareerPathMutation,
    useAddRoleMutation: mockAddRoleMutation,
    useAddJobTitleMutation: mockAddJobTitleMutation,
  };
});

vi.mock('@/views/vacancies/utils', () => ({
  resolveUserCreatedOptions: vi.fn((options: unknown[]) =>
    Promise.resolve(options)
  ),
}));

vi.mock('@/app/utils/api-error', () => ({
  getApiErrorMessage: vi.fn(() => 'Error'),
}));

// ── UI component mocks ─────────────────────────────────────────────────────

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

vi.mock('@cgp/ui-kit/components/ui/form', () => ({
  Form: ({ children, ...props }: { children?: ReactNode }) => (
    <form {...props}>{children}</form>
  ),
  FormControl: ({ children }: { children?: ReactNode }) => <>{children}</>,
  FormField: ({
    render,
    name,
  }: {
    render: (props: {
      field: {
        value: unknown;
        onChange: (...args: unknown[]) => void;
        name: string;
      };
    }) => ReactNode;
    name?: string;
  }) =>
    render({
      field: { value: [], onChange: vi.fn(), name: name ?? '' },
    }),
  FormItem: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children?: ReactNode }) => (
    <label>{children}</label>
  ),
  FormMessage: () => null,
}));

vi.mock('@cgp/ui-kit/components/combobox', () => ({
  Combobox: ({ label }: { label?: string }) => (
    <div data-testid={`combobox-${label}`}>{label}</div>
  ),
}));

vi.mock('@cgp/ui-kit/components/multi-select', () => ({
  default: ({ label }: { label?: string }) => (
    <div data-testid={`multi-select-${label}`}>{label}</div>
  ),
}));

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => null,
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  ErrorToast: () => null,
}));

vi.mock('@cgp/ui-kit/components/ui/textarea', () => ({
  Textarea: (props: Record<string, unknown>) => (
    <textarea data-testid="description-textarea" {...props} />
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('JobRequirementsStep', () => {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnCancel.mockClear();
    mockStepDraftSaveRef.current = null;
    mockFormTrigger.mockResolvedValue(true);
  });

  it('renders the heading', () => {
    render(
      <JobRequirementsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'jobRequirements.sectionTitle' })
    ).toBeInTheDocument();
  });

  it('renders Cancel and Next buttons', () => {
    render(
      <JobRequirementsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('does not render a header Back button', () => {
    render(
      <JobRequirementsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(
      screen.queryByRole('button', { name: /back/i })
    ).not.toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <JobRequirementsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onNext when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <JobRequirementsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onNext).not.toHaveBeenCalled();
  });

  it('renders the cancel button', () => {
    render(
      <JobRequirementsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('common.cancel')).toBeInTheDocument();
  });

  describe('stepDraftSaveRef', () => {
    it('registers stepDraftSaveRef.current as a function on mount', async () => {
      render(
        <JobRequirementsStep
          onNext={onNext}
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );

      await waitFor(() => {
        expect(mockStepDraftSaveRef.current).toBeTypeOf('function');
      });
    });

    it('clears stepDraftSaveRef.current on unmount', async () => {
      const { unmount } = render(
        <JobRequirementsStep
          onNext={onNext}
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );

      await waitFor(() => {
        expect(mockStepDraftSaveRef.current).toBeTypeOf('function');
      });

      unmount();
      expect(mockStepDraftSaveRef.current).toBeNull();
    });

    it('returns null when required fields fail form.trigger', async () => {
      mockFormTrigger.mockResolvedValueOnce(false);

      render(
        <JobRequirementsStep
          onNext={onNext}
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );

      await waitFor(() => {
        expect(mockStepDraftSaveRef.current).toBeTypeOf('function');
      });

      const result = await mockStepDraftSaveRef.current!();
      expect(result).toBeNull();
    });

    it('returns jobRequirements payload when required fields pass form.trigger', async () => {
      render(
        <JobRequirementsStep
          onNext={onNext}
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );

      await waitFor(() => {
        expect(mockStepDraftSaveRef.current).toBeTypeOf('function');
      });

      const result = await mockStepDraftSaveRef.current!();
      expect(result).toMatchObject({
        jobRequirements: expect.arrayContaining([
          expect.objectContaining({
            isEnabled: true,
            dataTakenFromCandidate: false,
          }),
        ]),
      });
    });

    it('calls form.trigger with all required field names', async () => {
      render(
        <JobRequirementsStep
          onNext={onNext}
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );

      await waitFor(() => {
        expect(mockStepDraftSaveRef.current).toBeTypeOf('function');
      });

      await mockStepDraftSaveRef.current!();

      expect(mockFormTrigger).toHaveBeenCalledWith([
        'discipline',
        'careerPath',
        'level',
        'role',
        'jobTitle',
      ]);
    });
  });
});
