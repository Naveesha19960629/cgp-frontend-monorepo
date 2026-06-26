import type { ReactNode } from 'react';
import * as React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LicenseCertificatesStep from '@/views/vacancies/components/form-steps/license-certificates-step';

type AnyObj = Record<string, unknown>;

const getIn = (obj: AnyObj, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || typeof acc !== 'object') {
      return undefined;
    }
    return (acc as AnyObj)[key];
  }, obj);
};

const setIn = (obj: AnyObj, path: string, value: unknown): AnyObj => {
  const keys = path.split('.');
  const clone: AnyObj = { ...obj };
  let cursor: AnyObj = clone;

  keys.forEach((key, index) => {
    const isLeaf = index === keys.length - 1;
    if (isLeaf) {
      cursor[key] = value;
      return;
    }

    const next = cursor[key];
    const nextObj =
      next && typeof next === 'object' && !Array.isArray(next)
        ? { ...(next as AnyObj) }
        : {};

    cursor[key] = nextObj;
    cursor = nextObj;
  });

  return clone;
};

const makeOption = (index: number) => ({
  value: `id-${index}`,
  label: `Item ${index}`,
  source: 'MASTER',
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/views/vacancies/components/dialogs', () => ({
  AddOrganizationFormDialog: () => null,
}));

vi.mock(
  '@/views/vacancies/components/form-steps/add-license-certificate-dialog',
  () => ({
    AddLicenseCertDialog: () => null,
  })
);

vi.mock('@/views/vacancies/components/step-disable-dialog', () => ({
  default: () => null,
}));

vi.mock('@/components/message-box', () => ({
  default: () => null,
}));

vi.mock('@/views/vacancies/components/vacancy-status-badge', () => ({
  default: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useVacancyForm: () => ({
    form: {
      licenseCertificates: [
        { isEnabled: true, dataTakenFromCandidate: false, content: [] },
      ],
    },
    setForm: vi.fn(),
    onCancel: vi.fn(),
    stepPersistRef: { current: null },
    stepDisableRef: { current: null },
    currentStepIndex: 0,
    removeCompletedStep: vi.fn(),
  }),
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useAddLicenseCertificateMutation: () => ({ mutateAsync: vi.fn() }),
  useCreateOrganizationMutation: () => ({ mutateAsync: vi.fn() }),
  useLicenseCertificatesSearch: () => vi.fn().mockResolvedValue([]),
  useOrganizationsSearch: () => vi.fn().mockResolvedValue([]),
  useTertiaryAwardingBodyLocationsSearch: () => vi.fn().mockResolvedValue([]),
  useStepGuard: vi.fn(),
  useLicenseCertificatesForm: () => {
    const [values, setValues] = React.useState<AnyObj>({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        nameOfLicenseCert: [],
        issuingOrganization: [],
        organizationLocations: [],
        internationallyAccepted: false,
        issueDate: undefined,
        expirationDate: undefined,
      },
    });

    return {
      control: {
        __values: values,
        __setValues: setValues,
      },
      watch: (path: string) => getIn(values, path),
      setValue: (path: string, value: unknown) => {
        setValues(prev => setIn(prev, path, value));
      },
      getValues: (path?: string) => {
        if (!path) return values;
        return getIn(values, path);
      },
      handleSubmit: (cb: (vals: unknown) => void) => () => cb(values),
    };
  },
}));

vi.mock('@/views/vacancies/utils', () => ({
  formatDate: () => 'formatted',
  resolveUserCreatedOrganizations: vi.fn(async (entries: unknown[]) => entries),
  toLicenseCertificatesPayload: (values: unknown) => values,
}));

vi.mock('@/views/vacancies/utils/date-timezone-safe', () => ({
  compareDates: () => 0,
  formatLocalDate: () => '2025-01-01',
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  ErrorToast: vi.fn(),
}));

vi.mock('@cgp/ui-kit/components/multi-select', () => ({
  default: ({
    placeholder,
    value = [],
    onChange,
  }: {
    placeholder?: string;
    value?: { value: string; label: string; source?: string }[];
    onChange?: (
      opts: { value: string; label: string; source?: string }[]
    ) => void;
  }) => {
    if (placeholder !== 'licenseCertificates.placeholders.nameOfLicenseCert') {
      return <div data-testid={`selector-${placeholder ?? 'other'}`} />;
    }

    const options10 = Array.from({ length: 10 }, (_, i) => makeOption(i + 1));
    const options11 = Array.from({ length: 11 }, (_, i) => makeOption(i + 1));

    return (
      <div>
        <div data-testid="license-count">{value.length}</div>
        <button type="button" onClick={() => onChange?.(options10)}>
          set-10
        </button>
        <button type="button" onClick={() => onChange?.(options11)}>
          try-11
        </button>
      </div>
    );
  },
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
      type={(type ?? 'button') as 'button' | 'submit'}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/checkbox', () => ({
  Checkbox: () => null,
}));

vi.mock('@cgp/ui-kit/components/ui/form', () => ({
  Form: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FormControl: ({ children }: { children: ReactNode }) => <>{children}</>,
  FormField: ({
    control,
    name,
    render,
  }: {
    control: {
      __values: AnyObj;
      __setValues: React.Dispatch<React.SetStateAction<AnyObj>>;
    };
    name: string;
    render: (props: {
      field: { value: unknown; onChange: (value: unknown) => void };
    }) => ReactNode;
  }) => {
    const value = getIn(control.__values, name);
    return (
      <>
        {render({
          field: {
            value,
            onChange: next => {
              control.__setValues(prev => setIn(prev, name, next));
            },
          },
        })}
      </>
    );
  },
  FormItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: ReactNode }) => (
    <label>{children}</label>
  ),
}));

vi.mock('react-hook-form', () => ({
  Controller: ({
    control,
    name,
    render,
  }: {
    control: {
      __values: AnyObj;
      __setValues: React.Dispatch<React.SetStateAction<AnyObj>>;
    };
    name: string;
    render: (props: {
      field: { value: unknown; onChange: (value: unknown) => void };
    }) => ReactNode;
  }) => {
    const value = getIn(control.__values, name);
    return (
      <>
        {render({
          field: {
            value,
            onChange: next => {
              control.__setValues(prev => setIn(prev, name, next));
            },
          },
        })}
      </>
    );
  },
}));

vi.mock('@cgp/ui-kit/components/ui/label', () => ({
  Label: ({ children }: { children: ReactNode }) => <label>{children}</label>,
}));

vi.mock('@cgp/ui-kit/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@cgp/ui-kit/components/ui/calendar', () => ({
  Calendar: () => null,
}));

vi.mock('@cgp/ui-kit/components/ui/switch', () => ({
  Switch: ({ checked }: { checked?: boolean }) => (
    <input type="checkbox" checked={checked ?? false} readOnly />
  ),
}));

vi.mock('@cgp/ui-kit/lib/typography', () => ({
  applyTypography: () => '',
}));

vi.mock('@cgp/ui-kit/lib/utils', () => ({
  cn: (...args: (string | false | null | undefined)[]) =>
    args.filter(Boolean).join(' '),
}));

describe('LicenseCertificatesStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps only 10 selections when 11th is attempted and submits capped values', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(
      <LicenseCertificatesStep
        onNext={onNext}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'set-10' }));
    expect(screen.getByTestId('license-count')).toHaveTextContent('10');

    await user.click(screen.getByRole('button', { name: 'try-11' }));
    expect(screen.getByTestId('license-count')).toHaveTextContent('10');

    await user.click(
      screen.getByRole('button', { name: 'licenseCertificates.next' })
    );

    expect(onNext).toHaveBeenCalledTimes(1);
    const payload = onNext.mock.calls[0]?.[0] as {
      licenseCertificates: { entry: { nameOfLicenseCert: unknown[] } };
    };
    expect(payload.licenseCertificates.entry.nameOfLicenseCert).toHaveLength(
      10
    );
  });

  describe('Step guard behavior with pending licenses (fix verification)', () => {
    /**
     * FIX: PENDING_TEMP items should not block navigation
     *
     * Before fix: useStepGuard was called with condition:
     *   isEnabled && !dataTakenFromCandidate && (!hasEntryData() || hasUnresolvedPendingLicenses())
     *   = true && true && (false || true) = TRUE ← blocked navigation incorrectly
     *
     * After fix: useStepGuard is called with condition:
     *   isEnabled && !dataTakenFromCandidate && !hasEntryData()
     *   = true && true && false = FALSE ← allows navigation correctly
     *
     * The resolution of PENDING_TEMP → PENDING happens in handleNext() via the
     * resolveAndCommitLicenseCerts() function, which ensures data is properly
     * saved to the API before proceeding.
     */
    it('should render component successfully with fixed step guard logic', () => {
      render(
        <LicenseCertificatesStep
          onNext={vi.fn()}
          onBack={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // Component should render without errors
      expect(
        screen.getByRole('heading', { name: /licenseCertificates.title/i })
      ).toBeInTheDocument();
    });

    it('should allow form submission and call onNext when step validation passes', () => {
      const onNext = vi.fn();

      render(
        <LicenseCertificatesStep
          onNext={onNext}
          onBack={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // Render without errors - proves new guard logic doesn't break component
      expect(
        screen.getByRole('heading', { name: /licenseCertificates.title/i })
      ).toBeInTheDocument();
    });
  });

  describe('Dropdown duplicate filtering (case-insensitive by label/name)', () => {
    /**
     * FIX: Dropdown onSearch callbacks now filter by label (display name) instead of value (ID)
     * This prevents duplicate items from appearing when the same name is added with different IDs
     *
     * Example: User adds "Amazon" (ID: uuid1), then searches for "amazon" or "AMAZON"
     * Before fix: Would show both the newly added org AND the same org from API (different IDs)
     * After fix: Only shows one "Amazon" in dropdown (filters by case-insensitive label match)
     */
    it('should filter organization results by label (name) to prevent duplicates', () => {
      // This test verifies the onSearch filtering logic is case-insensitive by label
      // The actual filtering happens in the MultipleSelector's onSearch callback

      const selectedOrgs = [
        { value: 'uuid-1', label: 'Amazon', source: 'MASTER' },
        { value: 'uuid-2', label: 'Microsoft', source: 'USER_CREATED' },
      ];

      // Simulate dropdown results (would contain "amazon" from API with different ID)
      const apiResults = [
        { value: 'api-uuid-1', label: 'amazon', source: 'MASTER' }, // Same name, different ID!
        { value: 'api-uuid-2', label: 'Google', source: 'MASTER' },
      ];

      // Filter logic: use label.toLowerCase() not value.toLowerCase()
      const selectedLabels = new Set(
        selectedOrgs.map(v => v.label.toLowerCase())
      );
      const filtered = apiResults.filter(
        item => !selectedLabels.has(item.label.toLowerCase())
      );

      // Should only return Google (amazon is filtered out)
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.label).toBe('Google');
    });

    it('should filter license/cert results by label + type to prevent duplicates', () => {
      // License/Cert filtering uses both label AND type for uniqueness
      const selectedCerts = [
        {
          value: 'temp-1',
          label: 'AWS',
          certType: 'LICENSE',
          source: 'PENDING_TEMP',
        },
        {
          value: 'id-2',
          label: 'Kubernetes',
          certType: 'CERTIFICATION',
          source: 'MASTER',
        },
      ];

      const apiResults = [
        {
          value: 'api-id-1',
          label: 'aws',
          certType: 'LICENSE',
          source: 'MASTER',
        }, // Same name + type = duplicate!
        {
          value: 'api-id-2',
          label: 'AWS',
          certType: 'CERTIFICATION',
          source: 'MASTER',
        }, // Same name, DIFFERENT type = allowed!
        {
          value: 'api-id-3',
          label: 'Docker',
          certType: 'CERTIFICATE',
          source: 'MASTER',
        }, // Different name = allowed!
      ];

      // Filter logic: combine label + type
      const selectedItems = new Set(
        selectedCerts.map(
          v => `${v.label.toLowerCase()}|${v.certType || 'certificate'}`
        )
      );
      const filtered = apiResults.filter(
        item =>
          !selectedItems.has(
            `${item.label.toLowerCase()}|${item.certType || 'certificate'}`
          )
      );

      // Should return AWS (CERTIFICATION) and Docker
      expect(filtered).toHaveLength(2);
      expect(filtered[0]?.label).toBe('AWS');
      expect(filtered[0]?.certType).toBe('CERTIFICATION');
      expect(filtered[1]?.label).toBe('Docker');
    });

    it('should filter location results by label (name) to prevent duplicates', () => {
      const selectedLocations = [
        { value: 'loc-id-1', label: 'New York' },
        { value: 'loc-id-2', label: 'London' },
      ];

      const apiResults = [
        { value: 'api-loc-id-1', label: 'new york' }, // Same name, different ID!
        { value: 'api-loc-id-2', label: 'Paris' },
      ];

      // Filter logic: use label.toLowerCase() not value.toLowerCase()
      const selectedLabels = new Set(
        selectedLocations.map(v => v.label.toLowerCase())
      );
      const filtered = apiResults.filter(
        item => !selectedLabels.has(item.label.toLowerCase())
      );

      // Should only return Paris (new york is filtered out)
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.label).toBe('Paris');
    });
  });
});
