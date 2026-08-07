import { useLocation, useParams } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScheduleVacancyStep from '@/views/vacancies/components/form-steps/schedule-vacancy-step';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCreateVacancyMutation,
  useNotifyApplicantsMutation,
  useUpdateVacancyMutation,
} from '@/views/vacancies/hooks';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { CalendarWithTime } from '@cgp/ui-kit/components/ui/calendar-with-time';

type CalendarWithTimeProps = {
  dateValue?: string;
  onDateChange?: (v: string) => void;
  timeValue?: string;
  onTimeChange?: (v: string) => void;
  timeLabel?: string;
  dateButtonPlaceholder?: string;
  timeInputPlaceholder?: string;
  error?: string;
  formattedDateDisplay?: string;
  disabledDates?: (date: Date) => boolean;
};

vi.mock('@/views/vacancies/context/vacancy-form-context');
vi.mock('@/views/vacancies/hooks', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/hooks')>();
  return {
    ...actual,
    useCreateVacancyMutation: vi.fn(),
    useUpdateVacancyMutation: vi.fn(),
    useNotifyApplicantsMutation: vi.fn(),
  };
});

vi.mock('@cgp/ui-kit/components/ui/calendar-with-time', () => ({
  CalendarWithTime: vi.fn(
    ({
      timeLabel,
      error,
      dateValue,
      onDateChange,
      timeValue,
      onTimeChange,
      formattedDateDisplay,
    }: CalendarWithTimeProps) => (
      <div data-testid="calendar-with-time">
        {error && <div data-testid="calendar-error">{error}</div>}
        <input
          aria-label={`date-${timeLabel}`}
          value={dateValue ?? ''}
          onChange={e => onDateChange?.(e.target.value)}
          readOnly={false}
        />
        <input
          aria-label={`time-${timeLabel}`}
          value={timeValue ?? ''}
          onChange={e => onTimeChange?.(e.target.value)}
          readOnly={false}
        />
        {formattedDateDisplay && (
          <span data-testid="formatted-display">{formattedDateDisplay}</span>
        )}
      </div>
    )
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: vi.fn(() => ({})),
  useLocation: vi.fn(() => ({ state: null })),
}));
vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: vi.fn(),
  ErrorToast: vi.fn(),
}));

vi.mock('@/views/vacancies/components/vacancy-status-badge', () => ({
  default: ({ status }: { status: string }) => (
    <div data-testid="vacancy-status-badge">{status}</div>
  ),
}));

vi.mock(
  '@/views/vacancies/components/vacancy-reschedule-confirm-dialog',
  () => ({
    default: ({
      open,
      onConfirm,
      onOpenChange,
    }: {
      open: boolean;
      onConfirm: () => void;
      onOpenChange: (open: boolean) => void;
    }) =>
      open ? (
        <div data-testid="reschedule-confirm-dialog">
          <button type="button" onClick={onConfirm}>
            confirm-yes
          </button>
          <button type="button" onClick={() => onOpenChange(false)}>
            confirm-no
          </button>
        </div>
      ) : null,
  })
);

vi.mock(
  '@/views/vacancies/components/vacancy-no-reschedule-confirm-dialog',
  () => ({
    default: ({
      open,
      onConfirm,
      onOpenChange,
    }: {
      open: boolean;
      onConfirm: () => void;
      onOpenChange: (open: boolean) => void;
    }) =>
      open ? (
        <div data-testid="no-reschedule-confirm-dialog">
          <button type="button" onClick={onConfirm}>
            confirm-yes
          </button>
          <button type="button" onClick={() => onOpenChange(false)}>
            confirm-no
          </button>
        </div>
      ) : null,
  })
);

vi.mock('@/views/vacancies/components/simple-confirm-dialog', () => ({
  default: ({
    open,
    onConfirm,
    onOpenChange,
    titleKey,
    isConfirming,
  }: {
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    titleKey: string;
    isConfirming?: boolean;
  }) => {
    if (!open) return null;
    return (
      <div
        data-testid="simple-confirm-dialog"
        data-title-key={titleKey}
        data-confirming={String(!!isConfirming)}
      >
        <button type="button" onClick={onConfirm}>
          simple-confirm-yes
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          simple-confirm-no
        </button>
      </div>
    );
  },
}));

vi.mock('@/views/vacancies/components/vacancy-onhold-update-dialog', () => ({
  default: ({
    open,
    onConfirm,
    onOpenChange,
    isPublishDateChanged,
    hasApplicants,
  }: {
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    isPublishDateChanged: boolean;
    hasApplicants: boolean;
  }) => {
    if (!open) return null;
    return (
      <div
        data-testid="onhold-update-dialog"
        data-publish-changed={String(isPublishDateChanged)}
        data-has-applicants={String(hasApplicants)}
      >
        <button type="button" onClick={onConfirm}>
          dialog-yes
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          dialog-no
        </button>
      </div>
    );
  },
}));

vi.mock('date-fns', async importOriginal => ({
  ...(await importOriginal<typeof import('date-fns')>()),
  format: (_date: Date, _format: string) => '10 Jun 2026',
  startOfToday: () => new Date('2026-06-08'),
}));

describe('ScheduleVacancyStep', () => {
  const mockOnBack = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnCancel = vi.fn();
  const mockSetForm = vi.fn();
  const mockCreateVacancy = vi.fn();
  const mockUpdateVacancy = vi.fn();
  const mockNotifyApplicants = vi.fn();
  const mockStepPersistRef: { current: (() => void) | null } = {
    current: null,
  };
  const mockOriginalFormRef: { current: Record<string, unknown> | null } = {
    current: null,
  };
  const mockResolveFormUserCreatedEntries = vi.fn((form: unknown) =>
    Promise.resolve(form)
  );

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    onBack: mockOnBack,
    onSubmit: mockOnSubmit,
    onNext: mockOnNext,
    mode: 'create' as const,
  };

  /** Helper — sets up the useVacancyForm mock with required fields + optional overrides. */
  const mockVacancyForm = (overrides: Record<string, unknown> = {}) => {
    vi.mocked(useVacancyForm).mockReturnValue({
      form: { schedule: undefined },
      setForm: mockSetForm,
      onCancel: mockOnCancel,
      stepPersistRef: mockStepPersistRef,
      resolveFormUserCreatedEntries: mockResolveFormUserCreatedEntries,
      originalFormRef: mockOriginalFormRef,
      ...overrides,
    } as unknown as ReturnType<typeof useVacancyForm>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStepPersistRef.current = null;
    mockOriginalFormRef.current = null;
    mockVacancyForm();

    vi.mocked(useParams).mockReturnValue({});
    vi.mocked(useLocation).mockReturnValue({
      state: null,
    } as unknown as ReturnType<typeof useLocation>);

    vi.mocked(useCreateVacancyMutation).mockReturnValue({
      mutateAsync: mockCreateVacancy,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateVacancyMutation>);

    vi.mocked(useUpdateVacancyMutation).mockReturnValue({
      mutateAsync: mockUpdateVacancy,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateVacancyMutation>);

    vi.mocked(useNotifyApplicantsMutation).mockReturnValue({
      mutateAsync: mockNotifyApplicants,
      isPending: false,
    } as unknown as ReturnType<typeof useNotifyApplicantsMutation>);
  });

  const renderComponent = (overrideProps = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ScheduleVacancyStep {...defaultProps} {...overrideProps} />
      </QueryClientProvider>
    );

  // ── Field label constants (t() returns the key in tests) ─────────────────
  const PUBLISH_TIME_LABEL = 'scheduleVacancy.timeLabel';
  const EXPIRATION_TIME_LABEL = 'scheduleVacancy.expirationTimeLabel';

  // ── DOM helpers ──────────────────────────────────────────────────────────
  const getCreateButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons[buttons.length - 1];
  };

  const getCancelButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons[buttons.length - 2];
  };

  const fillPublish = (date: string, time: string) => {
    fireEvent.change(
      screen.getByRole('textbox', { name: `date-${PUBLISH_TIME_LABEL}` }),
      { target: { value: date } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: `time-${PUBLISH_TIME_LABEL}` }),
      { target: { value: time } }
    );
  };

  const fillExpiration = (date: string, time: string) => {
    fireEvent.change(
      screen.getByRole('textbox', { name: `date-${EXPIRATION_TIME_LABEL}` }),
      { target: { value: date } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: `time-${EXPIRATION_TIME_LABEL}` }),
      { target: { value: time } }
    );
  };

  // ── Tests ────────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the step without errors', () => {
      renderComponent();
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('renders both CalendarWithTime picker fields', () => {
      renderComponent();
      expect(screen.getAllByTestId('calendar-with-time')).toHaveLength(2);
    });

    it('renders footer with back, Cancel, and Create buttons', () => {
      renderComponent();
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3);
    });

    it('renders vacancy status badge in edit mode when status exists', () => {
      mockVacancyForm({
        form: { schedule: undefined, status: 'ON_HOLD' },
      });
      renderComponent({ mode: 'edit' as const });

      expect(screen.getByTestId('vacancy-status-badge')).toHaveTextContent(
        'ON_HOLD'
      );
    });

    it('renders vacancy status badge in create mode when status exists', () => {
      mockVacancyForm({
        form: { schedule: undefined, status: 'ON_HOLD' },
      });
      renderComponent({ mode: 'create' as const });

      expect(screen.getByTestId('vacancy-status-badge')).toHaveTextContent(
        'ON_HOLD'
      );
    });
  });

  describe('button states', () => {
    it('disables Create when all fields are empty', () => {
      renderComponent();
      expect(getCreateButton()).toBeDisabled();
    });

    it('disables Create when mutation is pending', () => {
      vi.mocked(useCreateVacancyMutation).mockReturnValue({
        mutateAsync: mockCreateVacancy,
        isPending: true,
      } as unknown as ReturnType<typeof useCreateVacancyMutation>);

      renderComponent();
      expect(getCreateButton()).toBeDisabled();
    });

    it('enables Create once all four fields have values', async () => {
      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-26', '10:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });
    });

    it('disables Create when publish datetime is in the past relative to now', async () => {
      const toDateInput = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const toTimeInput = (date: Date) => {
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        hours %= 12;
        if (hours === 0) hours = 12;
        return `${hours}:${minutes}:${seconds} ${period}`;
      };

      const now = new Date();
      const publishAt = new Date(now.getTime() - 60 * 60 * 1000);
      const expirationAt = new Date(now.getTime() + 60 * 60 * 1000);

      renderComponent();

      fillPublish(toDateInput(publishAt), toTimeInput(publishAt));
      fillExpiration(toDateInput(expirationAt), toTimeInput(expirationAt));

      await waitFor(() => {
        expect(getCreateButton()).toBeDisabled();
      });
    });
  });

  describe('button interactions', () => {
    it('calls onCancel when Cancel is clicked', async () => {
      renderComponent();
      await userEvent.click(getCancelButton());
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('does not call onSubmit when Cancel is clicked', async () => {
      renderComponent();
      await userEvent.click(getCancelButton());
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('calls onBack when the header back arrow is clicked while enabled', async () => {
      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');

      const backButton = screen.getAllByRole('button')[0];
      await waitFor(() => {
        expect(backButton).not.toBeDisabled();
      });

      await userEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('persists filled schedule values when the header back arrow is clicked', async () => {
      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-26', '10:00:00 AM');

      const backButton = screen.getAllByRole('button')[0];
      await userEvent.click(backButton);

      await waitFor(() => {
        expect(mockSetForm).toHaveBeenCalled();
      });
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('persists partial data when only publish fields are filled and back is clicked', async () => {
      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');

      const backButton = screen.getAllByRole('button')[0];
      await userEvent.click(backButton);

      await waitFor(() => {
        expect(mockSetForm).toHaveBeenCalled();
      });
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('persists partial data when only expiration fields are filled and back is clicked', async () => {
      renderComponent();

      fillExpiration('2099-12-26', '10:00:00 AM');

      const backButton = screen.getAllByRole('button')[0];
      await userEvent.click(backButton);

      await waitFor(() => {
        expect(mockSetForm).toHaveBeenCalled();
      });
      expect(mockOnBack).toHaveBeenCalled();
    });

    // Regression test for DQCGP-3273 — the real CalendarWithTime's native
    // <input type="time"> always emits 24-hour "HH:mm:ss" (never AM/PM), so
    // when only one of the two schedule pairs is filled, the persisted
    // partial value must still be converted to the "hh:mm:ss AM/PM" format
    // the backend expects — not sent as a bare 24-hour string.
    it('formats a partial publish-only save as 12-hour AM/PM, not a bare 24-hour string', async () => {
      renderComponent();

      fillPublish('2099-12-25', '22:00:00');

      const backButton = screen.getAllByRole('button')[0];
      await userEvent.click(backButton);

      await waitFor(() => {
        expect(mockSetForm).toHaveBeenCalled();
      });

      const updater = mockSetForm.mock.calls[0][0] as (prev: unknown) => {
        schedule?: { schedulePublishAt?: string; expirationAt?: string };
      };
      const result = updater({ schedule: undefined });

      expect(result.schedule?.schedulePublishAt).toBe('2099-12-25T10:00:00 PM');
      expect(result.schedule?.expirationAt).toBe('');
    });

    it('formats a partial expiration-only save as 12-hour AM/PM, not a bare 24-hour string', async () => {
      renderComponent();

      fillExpiration('2099-12-26', '05:30:00');

      const backButton = screen.getAllByRole('button')[0];
      await userEvent.click(backButton);

      await waitFor(() => {
        expect(mockSetForm).toHaveBeenCalled();
      });

      const updater = mockSetForm.mock.calls[0][0] as (prev: unknown) => {
        schedule?: { schedulePublishAt?: string; expirationAt?: string };
      };
      const result = updater({ schedule: undefined });

      expect(result.schedule?.expirationAt).toBe('2099-12-26T05:30:00 AM');
      expect(result.schedule?.schedulePublishAt).toBe('');
    });
  });

  describe('back button disabled state', () => {
    it('disables the back button when all schedule fields are empty', () => {
      renderComponent();
      const backButton = screen.getAllByRole('button')[0];
      expect(backButton).toBeDisabled();
    });

    it('does not call onBack when the disabled back button is clicked', async () => {
      renderComponent();
      const backButton = screen.getAllByRole('button')[0];
      await userEvent.click(backButton);
      expect(mockOnBack).not.toHaveBeenCalled();
    });

    it('enables the back button once the publish date is filled', async () => {
      renderComponent();

      fillPublish('2099-12-25', '');

      await waitFor(() => {
        expect(screen.getAllByRole('button')[0]).not.toBeDisabled();
      });
    });

    it('enables the back button once the expiration date is filled', async () => {
      renderComponent();

      fillExpiration('2099-12-26', '');

      await waitFor(() => {
        expect(screen.getAllByRole('button')[0]).not.toBeDisabled();
      });
    });

    it('enables the back button in edit mode when the step is pre-filled from saved schedule data', () => {
      mockVacancyForm({
        form: {
          schedule: {
            schedulePublishAt: '2026-06-25T10:30:00 AM',
            expirationAt: '2026-07-15T11:59:59 PM',
          },
          status: 'unpublished',
        },
      });

      renderComponent({ mode: 'edit' as const });

      expect(screen.getAllByRole('button')[0]).not.toBeDisabled();
    });
  });

  describe('step persistence', () => {
    it('sets stepPersistRef.current to a function after mount', async () => {
      renderComponent();
      await waitFor(() => {
        expect(mockStepPersistRef.current).toBeTypeOf('function');
      });
    });

    it('clears stepPersistRef.current on unmount', async () => {
      const { unmount } = renderComponent();
      await waitFor(() => {
        expect(mockStepPersistRef.current).toBeTypeOf('function');
      });
      unmount();
      expect(mockStepPersistRef.current).toBeNull();
    });

    it('calls setForm with schedule payload when all fields are filled and ref is invoked', async () => {
      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-26', '10:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      expect(mockStepPersistRef.current).toBeTypeOf('function');
      mockStepPersistRef.current?.();

      await waitFor(() => {
        expect(mockSetForm).toHaveBeenCalled();
      });
    });

    it('does not call setForm when ref is invoked with all fields empty', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockStepPersistRef.current).toBeTypeOf('function');
      });

      mockStepPersistRef.current?.();

      expect(mockSetForm).not.toHaveBeenCalled();
    });

    it('calls setForm when ref is invoked with only publish fields filled', async () => {
      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');

      await waitFor(() => {
        expect(mockStepPersistRef.current).toBeTypeOf('function');
      });

      mockStepPersistRef.current?.();

      await waitFor(() => {
        expect(mockSetForm).toHaveBeenCalled();
      });
    });

    it('calls setForm when ref is invoked with only expiration fields filled', async () => {
      renderComponent();

      fillExpiration('2099-12-26', '10:00:00 AM');

      await waitFor(() => {
        expect(mockStepPersistRef.current).toBeTypeOf('function');
      });

      mockStepPersistRef.current?.();

      await waitFor(() => {
        expect(mockSetForm).toHaveBeenCalled();
      });
    });
  });

  describe('picker rendering', () => {
    it('passes correct timeLabel to publish and expiration pickers', () => {
      renderComponent();

      const publishCall = vi.mocked(CalendarWithTime).mock.calls[0]?.[0];
      const expirationCall = vi.mocked(CalendarWithTime).mock.calls[1]?.[0];

      expect(publishCall?.timeLabel).toBe('scheduleVacancy.timeLabel');
      expect(expirationCall?.timeLabel).toBe(
        'scheduleVacancy.expirationTimeLabel'
      );
    });

    it('passes formattedDateDisplay to publish picker when date is set', () => {
      mockVacancyForm({
        form: {
          schedule: { schedulePublishAt: '2026-06-25T10:30:00 AM' },
        },
      });

      renderComponent();

      const publishCall = vi.mocked(CalendarWithTime).mock.calls[0]?.[0];
      expect(publishCall?.formattedDateDisplay).toBe('10 Jun 2026 10:30:00 AM');
    });

    it('passes formattedDateDisplay to expiration picker when date is set', () => {
      mockVacancyForm({
        form: {
          schedule: { expirationAt: '2026-06-30T5:27 PM' },
        },
      });

      renderComponent();

      const expirationCall = vi.mocked(CalendarWithTime).mock.calls[1]?.[0];
      expect(expirationCall?.formattedDateDisplay).toBe(
        '10 Jun 2026 05:27:00 PM'
      );
    });

    it('passes date-only formattedDateDisplay when time part is missing', () => {
      mockVacancyForm({
        form: {
          schedule: { schedulePublishAt: '2026-06-25T' },
        },
      });

      renderComponent();

      const publishCall = vi.mocked(CalendarWithTime).mock.calls[0]?.[0];
      expect(publishCall?.formattedDateDisplay).toBe('10 Jun 2026');
    });

    it('pre-populates publish fields from partial 24-hour schedule data', () => {
      mockVacancyForm({
        form: {
          schedule: {
            schedulePublishAt: '2099-12-25T10:30:00',
            expirationAt: '',
          },
        },
      });

      renderComponent();

      expect(
        screen.getByRole('textbox', { name: `date-${PUBLISH_TIME_LABEL}` })
      ).toHaveValue('2099-12-25');
      expect(
        screen.getByRole('textbox', { name: `time-${PUBLISH_TIME_LABEL}` })
      ).toHaveValue('10:30:00 AM');
      // Expiration fields should be empty
      expect(
        screen.getByRole('textbox', { name: `date-${EXPIRATION_TIME_LABEL}` })
      ).toHaveValue('');
    });

    it('pre-populates expiration fields from partial 24-hour schedule data', () => {
      mockVacancyForm({
        form: {
          schedule: {
            schedulePublishAt: '',
            expirationAt: '2099-12-26T14:30:00',
          },
        },
      });

      renderComponent();

      expect(
        screen.getByRole('textbox', { name: `date-${EXPIRATION_TIME_LABEL}` })
      ).toHaveValue('2099-12-26');
      expect(
        screen.getByRole('textbox', { name: `time-${EXPIRATION_TIME_LABEL}` })
      ).toHaveValue('02:30:00 PM');
      // Publish fields should be empty
      expect(
        screen.getByRole('textbox', { name: `date-${PUBLISH_TIME_LABEL}` })
      ).toHaveValue('');
    });

    it('passes a disabledDates function to the publish picker', () => {
      renderComponent();

      const publishCall = vi.mocked(CalendarWithTime).mock.calls[0]?.[0];
      expect(publishCall?.disabledDates).toBeTypeOf('function');
    });

    it('publish disabledDates blocks dates before today', () => {
      renderComponent();

      const publishCall = vi.mocked(CalendarWithTime).mock.calls[0]?.[0];
      const disabledDates = publishCall?.disabledDates;

      expect(disabledDates?.(new Date('2020-01-01'))).toBe(true);
      expect(disabledDates?.(new Date('2099-12-31'))).toBe(false);
    });

    it('passes a disabledDates function to the expiration picker', () => {
      renderComponent();

      const expirationCall = vi.mocked(CalendarWithTime).mock.calls[1]?.[0];
      expect(expirationCall?.disabledDates).toBeTypeOf('function');
    });

    it('expiration disabledDates blocks dates before publish date', async () => {
      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');

      await waitFor(() => {
        const allCalls = vi.mocked(CalendarWithTime).mock.calls;
        // Latest expiration call is the last one (odd-indexed renders after re-render)
        const latestExpirationCall = allCalls[allCalls.length - 1]?.[0];
        const disabledDates = latestExpirationCall?.disabledDates;

        expect(disabledDates).toBeTypeOf('function');
        // Day before publish → disabled
        expect(disabledDates?.(new Date('2099-12-24'))).toBe(true);
        // Same day as publish → not disabled (only submit-level check)
        expect(disabledDates?.(new Date('2099-12-25'))).toBe(false);
      });
    });

    it('does not render inline error for expirationAfterPublish violation', async () => {
      renderComponent();

      // Expiration before publish — triggers the schema superRefine error
      fillPublish('2099-12-26', '10:00:00 AM');
      fillExpiration('2099-12-25', '10:00:00 AM');

      // Create stays disabled when expiration <= publish
      await waitFor(() => {
        expect(getCreateButton()).toBeDisabled();
      });

      // The expirationAfterPublish error must NOT appear as inline text
      const errorDivs = screen.queryAllByTestId('calendar-error');
      const hasInlineExpirationError = errorDivs.some(el =>
        el.textContent?.includes(
          'scheduleVacancy.validation.expirationAfterPublish'
        )
      );
      expect(hasInlineExpirationError).toBe(false);
    });
  });

  describe('validation toasts', () => {
    it('disables Create when expiration datetime is before publish datetime', async () => {
      renderComponent();

      fillPublish('2099-12-26', '10:00:00 AM');
      fillExpiration('2099-12-25', '10:00:00 AM'); // before publish

      await waitFor(() => {
        expect(getCreateButton()).toBeDisabled();
      });

      expect(ErrorToast).not.toHaveBeenCalled();
    });

    it('disables Create when expiration equals publish datetime', async () => {
      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-25', '10:00:00 AM'); // same datetime

      await waitFor(() => {
        expect(getCreateButton()).toBeDisabled();
      });

      expect(ErrorToast).not.toHaveBeenCalled();
    });

    it('disables Create when publish datetime is in the past', async () => {
      renderComponent();

      // 2020 dates are definitively in the past; expiration > publish so schema passes
      fillPublish('2020-01-01', '10:00:00 AM');
      fillExpiration('2020-01-02', '10:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      expect(ErrorToast).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when datetime is in the past', async () => {
      renderComponent();

      fillPublish('2020-01-01', '10:00:00 AM');
      fillExpiration('2020-01-02', '10:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      expect(ErrorToast).not.toHaveBeenCalled();

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('successful submission', () => {
    it('calls createVacancy, shows SuccessToast, and calls onSubmit', async () => {
      mockCreateVacancy.mockResolvedValueOnce(undefined);

      renderComponent();

      // Future dates, expiration after publish
      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-26', '10:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(mockCreateVacancy).toHaveBeenCalled();
        expect(SuccessToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.successTitle',
            description: 'scheduleVacancy.notifications.successMessage',
          })
        );
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('API error handling', () => {
    it('shows ErrorToast when createVacancy rejects', async () => {
      mockCreateVacancy.mockRejectedValueOnce(new Error('Network Error'));

      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-26', '10:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(ErrorToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.apiErrorTitle',
            description: 'scheduleVacancy.notifications.apiErrorMessage',
          })
        );
      });
    });

    it('does not call onSubmit when API call fails', async () => {
      mockCreateVacancy.mockRejectedValueOnce(new Error('Network Error'));

      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-26', '10:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(ErrorToast).toHaveBeenCalled();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('form integration', () => {
    it('uses useCreateVacancyMutation for submission', () => {
      renderComponent();
      expect(useCreateVacancyMutation).toHaveBeenCalled();
    });
  });

  describe('onhold vacancy with applicants', () => {
    const SAVED_PUBLISH_AT = '2099-12-20T10:00:00 AM';
    const SAVED_EXPIRATION_AT = '2099-12-30T11:59:59 PM';

    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'vacancy-onhold-1' });
      mockVacancyForm({
        form: {
          status: 'on_hold',
          applicantCount: 5,
          schedule: {
            schedulePublishAt: SAVED_PUBLISH_AT,
            expirationAt: SAVED_EXPIRATION_AT,
          },
        },
      });
    });

    it('shows the onhold confirmation dialog instead of calling API directly when Update is clicked', async () => {
      renderComponent({ mode: 'edit' as const });

      // Pre-filled from saved schedule; button should be enabled
      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });
      expect(mockUpdateVacancy).not.toHaveBeenCalled();
    });

    it('calls updateVacancy and shows success toast when dialog Yes is clicked', async () => {
      mockUpdateVacancy.mockResolvedValueOnce(undefined);

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'dialog-yes' }));

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalled();
        expect(SuccessToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.updateSuccessTitle',
          })
        );
      });
    });

    it('does not call updateVacancy when dialog No is clicked', async () => {
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'dialog-no' }));

      await waitFor(() => {
        expect(
          screen.queryByTestId('onhold-update-dialog')
        ).not.toBeInTheDocument();
      });
      expect(mockUpdateVacancy).not.toHaveBeenCalled();
    });

    it('passes isPublishDateChanged=false to dialog when publish date is unchanged', async () => {
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('onhold-update-dialog').dataset['publishChanged']
      ).toBe('false');
    });

    it('passes isPublishDateChanged=true to dialog when publish date is changed', async () => {
      renderComponent({ mode: 'edit' as const });

      // Change publish date to a different future date
      fillPublish('2099-11-01', '09:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('onhold-update-dialog').dataset['publishChanged']
      ).toBe('true');
    });

    it('passes data-has-applicants="true" to dialog when applicantCount > 0', async () => {
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('onhold-update-dialog').dataset['hasApplicants']
      ).toBe('true');
    });
  });

  describe('applicant notification trigger', () => {
    const SAVED_PUBLISH_AT = '2099-12-20T10:00:00 AM';
    const SAVED_EXPIRATION_AT = '2099-12-30T11:59:59 PM';

    const preferredSkillsA = {
      isEnabled: true,
      dataTakenFromCandidate: false,
      skills: [
        {
          skillId: 'skill-1',
          skillName: 'React',
          careerPathName: 'Engineering',
          displayValue: 'React',
        },
      ],
    };

    const preferredSkillsB = {
      isEnabled: true,
      dataTakenFromCandidate: false,
      skills: [
        {
          skillId: 'skill-1',
          skillName: 'React',
          careerPathName: 'Engineering',
          displayValue: 'React',
        },
        {
          skillId: 'skill-2',
          skillName: 'TypeScript',
          careerPathName: 'Engineering',
          displayValue: 'TypeScript',
        },
      ],
    };

    const baseForm = {
      status: 'on_hold',
      applicantCount: 5,
      schedule: {
        schedulePublishAt: SAVED_PUBLISH_AT,
        expirationAt: SAVED_EXPIRATION_AT,
      },
    };

    const confirmOnholdUpdate = async () => {
      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });
      await userEvent.click(getCreateButton());
      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByRole('button', { name: 'dialog-yes' }));
    };

    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'vacancy-onhold-1' });
      mockUpdateVacancy.mockResolvedValue(undefined);
      mockNotifyApplicants.mockResolvedValue(undefined);
    });

    it('triggers notifyApplicants when publish date changed, applicants exist, and application form changed', async () => {
      mockOriginalFormRef.current = {
        ...baseForm,
        preferredSkills: preferredSkillsA,
      };
      mockVacancyForm({
        form: { ...baseForm, preferredSkills: preferredSkillsB },
      });

      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-11-01', '09:00:00 AM');
      await confirmOnholdUpdate();

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalled();
        expect(mockNotifyApplicants).toHaveBeenCalledWith(
          expect.objectContaining({
            vacancyId: 'vacancy-onhold-1',
            changedSections: expect.arrayContaining(['preferredSkills']),
          })
        );
      });
    });

    it('does not trigger notifyApplicants when the publish date is unchanged', async () => {
      mockOriginalFormRef.current = {
        ...baseForm,
        preferredSkills: preferredSkillsA,
      };
      mockVacancyForm({
        form: { ...baseForm, preferredSkills: preferredSkillsB },
      });

      renderComponent({ mode: 'edit' as const });

      await confirmOnholdUpdate();

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalled();
      });
      expect(mockNotifyApplicants).not.toHaveBeenCalled();
    });

    it('does not trigger notifyApplicants when the publish date changed but no application form fields changed', async () => {
      mockOriginalFormRef.current = {
        ...baseForm,
        preferredSkills: preferredSkillsA,
      };
      mockVacancyForm({
        form: { ...baseForm, preferredSkills: preferredSkillsA },
      });

      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-11-01', '09:00:00 AM');
      await confirmOnholdUpdate();

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalled();
      });
      expect(mockNotifyApplicants).not.toHaveBeenCalled();
    });

    it('does not trigger notifyApplicants when the vacancy has no applicants, even if fields changed', async () => {
      mockOriginalFormRef.current = {
        ...baseForm,
        applicantCount: 0,
        preferredSkills: preferredSkillsA,
      };
      mockVacancyForm({
        form: {
          ...baseForm,
          applicantCount: 0,
          preferredSkills: preferredSkillsB,
        },
      });

      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-11-01', '09:00:00 AM');
      await confirmOnholdUpdate();

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalled();
      });
      expect(mockNotifyApplicants).not.toHaveBeenCalled();
    });

    it('still shows the update success toast when notifyApplicants rejects', async () => {
      mockOriginalFormRef.current = {
        ...baseForm,
        preferredSkills: preferredSkillsA,
      };
      mockVacancyForm({
        form: { ...baseForm, preferredSkills: preferredSkillsB },
      });
      mockNotifyApplicants.mockRejectedValueOnce(new Error('notify failed'));

      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-11-01', '09:00:00 AM');
      await confirmOnholdUpdate();

      await waitFor(() => {
        expect(mockNotifyApplicants).toHaveBeenCalled();
        expect(SuccessToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.updateSuccessTitle',
          })
        );
      });
      expect(ErrorToast).not.toHaveBeenCalled();
    });

    it('does not call notifyApplicants when the update itself fails', async () => {
      mockOriginalFormRef.current = {
        ...baseForm,
        preferredSkills: preferredSkillsA,
      };
      mockVacancyForm({
        form: { ...baseForm, preferredSkills: preferredSkillsB },
      });
      mockUpdateVacancy.mockRejectedValueOnce(new Error('update failed'));

      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-11-01', '09:00:00 AM');
      await confirmOnholdUpdate();

      await waitFor(() => {
        expect(ErrorToast).toHaveBeenCalled();
      });
      expect(mockNotifyApplicants).not.toHaveBeenCalled();
    });
  });

  describe('onhold vacancy without applicants', () => {
    const SAVED_PUBLISH_AT = '2099-12-20T10:00:00 AM';
    const SAVED_EXPIRATION_AT = '2099-12-30T11:59:59 PM';

    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({
        id: 'vacancy-onhold-no-applicants',
      });
      mockVacancyForm({
        form: {
          status: 'on_hold',
          applicantCount: 0,
          schedule: {
            schedulePublishAt: SAVED_PUBLISH_AT,
            expirationAt: SAVED_EXPIRATION_AT,
          },
        },
      });
    });

    it('shows the onhold confirmation dialog for zero-applicant vacancy', async () => {
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });
      expect(mockUpdateVacancy).not.toHaveBeenCalled();
    });

    it('passes data-has-applicants="false" to dialog when applicantCount = 0', async () => {
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('onhold-update-dialog').dataset['hasApplicants']
      ).toBe('false');
    });

    it('calls updateVacancy and shows success toast when dialog Yes is clicked', async () => {
      mockUpdateVacancy.mockResolvedValueOnce(undefined);

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'dialog-yes' }));

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalled();
        expect(SuccessToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.updateSuccessTitle',
          })
        );
      });
    });

    it('does not call updateVacancy when dialog No is clicked', async () => {
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'dialog-no' }));

      await waitFor(() => {
        expect(
          screen.queryByTestId('onhold-update-dialog')
        ).not.toBeInTheDocument();
      });
      expect(mockUpdateVacancy).not.toHaveBeenCalled();
    });

    it('passes isPublishDateChanged=false when publish date is unchanged', async () => {
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('onhold-update-dialog').dataset['publishChanged']
      ).toBe('false');
    });

    it('passes isPublishDateChanged=true when publish date is changed', async () => {
      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-11-01', '09:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('onhold-update-dialog')).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('onhold-update-dialog').dataset['publishChanged']
      ).toBe('true');
    });
  });

  describe('edit mode and schedule changes', () => {
    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'vacancy-123' });
    });

    it('renders with Update button in edit mode', () => {
      mockVacancyForm({
        form: { schedule: undefined, status: 'unpublished' },
      });
      renderComponent({ mode: 'edit' as const });
      expect(getCreateButton()).toHaveTextContent('scheduleVacancy.update');
    });

    it('pre-fills the form with existing schedule values', async () => {
      mockVacancyForm({
        form: {
          schedule: {
            schedulePublishAt: '2026-06-25T10:30:00 AM',
            expirationAt: '2026-07-15T11:59:59 PM',
          },
          status: 'unpublished',
        },
      });

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(
          screen.getByLabelText('date-scheduleVacancy.timeLabel')
        ).toHaveValue('2026-06-25');
        expect(
          screen.getByLabelText('time-scheduleVacancy.timeLabel')
        ).toHaveValue('10:30:00 AM');
      });
    });

    it('allows Update when schedule is unchanged even if it is in the past', async () => {
      mockVacancyForm({
        form: {
          schedule: {
            schedulePublishAt: '2020-01-01T10:30:00 AM',
            expirationAt: '2020-01-02T11:59:59 PM',
          },
          status: 'unpublished',
        },
      });

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalled();
        expect(ErrorToast).not.toHaveBeenCalled();
      });
    });

    it('submits a Live vacancy as ONHOLD when scheduled via the toggle flow', async () => {
      vi.mocked(useLocation).mockReturnValue({
        state: { scheduleToOnhold: true },
      } as unknown as ReturnType<typeof useLocation>);

      mockVacancyForm({
        form: {
          schedule: {
            schedulePublishAt: '2020-01-01T10:30:00 AM',
            expirationAt: '2020-01-02T11:59:59 PM',
          },
          status: 'live',
        },
      });

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'vacancy-123',
            existingStatus: 'on_hold',
          })
        );
      });
    });

    it('disables Update when schedule is changed to a past date/time', async () => {
      mockVacancyForm({
        form: {
          schedule: {
            schedulePublishAt: '2099-01-01T10:30:00 AM',
            expirationAt: '2099-01-02T11:59:59 PM',
          },
          status: 'unpublished',
        },
      });

      renderComponent({ mode: 'edit' as const });

      // Change publish date/time to a past date (startOfToday mock is 2026-06-08)
      fillPublish('2020-01-01', '10:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).toBeDisabled();
      });
    });
  });

  describe('expired vacancy confirmation dialogs', () => {
    const expiredSchedule = {
      schedulePublishAt: '2020-01-01T10:30:00 AM',
      expirationAt: '2020-01-02T11:59:59 PM',
    };

    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'vacancy-123' });
    });

    it('enables Update button for expired vacancy even when existing dates are in the past', async () => {
      mockVacancyForm({
        form: { schedule: expiredSchedule, status: 'expired' },
      });

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });
    });

    it('shows non-reschedule dialog when Update is clicked without any schedule changes', async () => {
      mockVacancyForm({
        form: { schedule: expiredSchedule, status: 'expired' },
      });

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(
          screen.getByTestId('no-reschedule-confirm-dialog')
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('reschedule-confirm-dialog')
      ).not.toBeInTheDocument();
      expect(ErrorToast).not.toHaveBeenCalled();
    });

    it('shows non-reschedule dialog (not a past-date error) when the saved schedule is 24-hour ISO from the API and Update is clicked immediately with no edits', async () => {
      // Regression test: the API returns 24-hour ISO ("...T10:30:00"), while
      // the form always watches 12-hour AM/PM values. Comparing those two
      // formats as raw strings falsely flagged the schedule as "changed" on
      // the very first render (before any user edit), which ran the
      // past-date validator and showed an ErrorToast instead of the
      // no-reschedule confirmation dialog.
      mockVacancyForm({
        form: {
          schedule: {
            schedulePublishAt: '2020-01-01T10:30:00',
            expirationAt: '2020-01-02T23:59:59',
          },
          status: 'expired',
        },
      });

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(
          screen.getByTestId('no-reschedule-confirm-dialog')
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('reschedule-confirm-dialog')
      ).not.toBeInTheDocument();
      expect(ErrorToast).not.toHaveBeenCalled();
    });

    it('shows reschedule dialog when publish date is changed to a future date', async () => {
      mockVacancyForm({
        form: { schedule: expiredSchedule, status: 'expired' },
      });

      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-26', '11:59:59 PM');

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(
          screen.getByTestId('reschedule-confirm-dialog')
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('no-reschedule-confirm-dialog')
      ).not.toBeInTheDocument();
      expect(ErrorToast).not.toHaveBeenCalled();
    });

    it('shows ErrorToast (not a dialog) when changed dates are in the past', async () => {
      mockVacancyForm({
        form: { schedule: expiredSchedule, status: 'expired' },
      });

      renderComponent({ mode: 'edit' as const });

      fillPublish('2019-01-01', '10:00:00 AM');
      fillExpiration('2019-01-02', '11:59:59 PM');

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(ErrorToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.validationErrorTitle',
            description: 'scheduleVacancy.notifications.pastDateTimeMessage',
          })
        );
      });
      expect(
        screen.queryByTestId('reschedule-confirm-dialog')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('no-reschedule-confirm-dialog')
      ).not.toBeInTheDocument();
    });

    it('calls updateVacancy keeping expired status when Yes is clicked on non-reschedule dialog', async () => {
      mockUpdateVacancy.mockResolvedValueOnce(undefined);
      mockVacancyForm({
        form: { schedule: expiredSchedule, status: 'expired' },
      });

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(
          screen.getByTestId('no-reschedule-confirm-dialog')
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'confirm-yes' })
      );

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'vacancy-123',
            existingStatus: 'expired',
          })
        );
        expect(SuccessToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.updateSuccessTitle',
          })
        );
      });
    });

    it('calls updateVacancy with on_hold status when Yes is clicked on reschedule dialog', async () => {
      mockUpdateVacancy.mockResolvedValueOnce(undefined);
      mockVacancyForm({
        form: { schedule: expiredSchedule, status: 'expired' },
      });

      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-26', '11:59:59 PM');

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(
          screen.getByTestId('reschedule-confirm-dialog')
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'confirm-yes' })
      );

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'vacancy-123',
            existingStatus: 'on_hold',
          })
        );
        expect(SuccessToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.updateSuccessTitle',
          })
        );
      });
    });

    it('closes non-reschedule dialog and does not call updateVacancy when No is clicked', async () => {
      mockVacancyForm({
        form: { schedule: expiredSchedule, status: 'expired' },
      });

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(
          screen.getByTestId('no-reschedule-confirm-dialog')
        ).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'confirm-no' }));

      await waitFor(() => {
        expect(
          screen.queryByTestId('no-reschedule-confirm-dialog')
        ).not.toBeInTheDocument();
      });
      expect(mockUpdateVacancy).not.toHaveBeenCalled();
    });

    it('closes reschedule dialog and does not call updateVacancy when No is clicked', async () => {
      mockVacancyForm({
        form: { schedule: expiredSchedule, status: 'expired' },
      });

      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-26', '11:59:59 PM');

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(
          screen.getByTestId('reschedule-confirm-dialog')
        ).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: 'confirm-no' }));

      await waitFor(() => {
        expect(
          screen.queryByTestId('reschedule-confirm-dialog')
        ).not.toBeInTheDocument();
      });
      expect(mockUpdateVacancy).not.toHaveBeenCalled();
    });

    it('shows ErrorToast on API error after confirming update', async () => {
      mockUpdateVacancy.mockRejectedValueOnce(new Error('API error'));
      mockVacancyForm({
        form: { schedule: expiredSchedule, status: 'expired' },
      });

      renderComponent({ mode: 'edit' as const });

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(
          screen.getByTestId('no-reschedule-confirm-dialog')
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByRole('button', { name: 'confirm-yes' })
      );

      await waitFor(() => {
        expect(ErrorToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.apiErrorTitle',
          })
        );
      });
      expect(SuccessToast).not.toHaveBeenCalled();
    });
  });

  describe('live vacancy confirmation dialogs', () => {
    const liveSchedule = {
      schedulePublishAt: '2099-12-20T10:00:00 AM',
      expirationAt: '2099-12-30T11:59:59 PM',
    };

    beforeEach(() => {
      vi.mocked(useParams).mockReturnValue({ id: 'vacancy-live-1' });
      mockUpdateVacancy.mockResolvedValue(undefined);
      mockNotifyApplicants.mockResolvedValue(undefined);
    });

    it('shows the no-reschedule confirmation dialog when Update is clicked without schedule changes', async () => {
      mockVacancyForm({ form: { schedule: liveSchedule, status: 'live' } });
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('simple-confirm-dialog')).toHaveAttribute(
          'data-title-key',
          'scheduleVacancy.liveUpdateConfirmDialog.title'
        );
      });
      expect(mockUpdateVacancy).not.toHaveBeenCalled();
    });

    it('shows the reschedule confirmation dialog when the publish date is changed', async () => {
      mockVacancyForm({ form: { schedule: liveSchedule, status: 'live' } });
      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-11-01', '09:00:00 AM');

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(screen.getByTestId('simple-confirm-dialog')).toHaveAttribute(
          'data-title-key',
          'scheduleVacancy.liveRescheduleConfirmDialog.title'
        );
      });
    });

    it('updates with existingStatus on_hold and shows the reschedule success toast when reschedule is confirmed', async () => {
      mockVacancyForm({ form: { schedule: liveSchedule, status: 'live' } });
      renderComponent({ mode: 'edit' as const });

      fillPublish('2099-11-01', '09:00:00 AM');
      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());
      await waitFor(() =>
        expect(screen.getByTestId('simple-confirm-dialog')).toBeInTheDocument()
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'simple-confirm-yes' })
      );

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'vacancy-live-1',
            existingStatus: 'on_hold',
          })
        );
        expect(SuccessToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.liveRescheduleSuccessTitle',
            description:
              'scheduleVacancy.notifications.liveRescheduleSuccessMessage',
          })
        );
      });
    });

    it('updates keeping live status and shows the stays-live success toast when no-reschedule is confirmed', async () => {
      mockVacancyForm({ form: { schedule: liveSchedule, status: 'live' } });
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());
      await waitFor(() =>
        expect(screen.getByTestId('simple-confirm-dialog')).toBeInTheDocument()
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'simple-confirm-yes' })
      );

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'vacancy-live-1',
            existingStatus: 'live',
          })
        );
        expect(SuccessToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.liveNoRescheduleSuccessTitle',
            description:
              'scheduleVacancy.notifications.liveNoRescheduleSuccessMessage',
          })
        );
      });
    });

    it('closes the dialog and does not call updateVacancy when No is clicked', async () => {
      mockVacancyForm({ form: { schedule: liveSchedule, status: 'live' } });
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());
      await waitFor(() =>
        expect(screen.getByTestId('simple-confirm-dialog')).toBeInTheDocument()
      );

      await userEvent.click(
        screen.getByRole('button', { name: 'simple-confirm-no' })
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId('simple-confirm-dialog')
        ).not.toBeInTheDocument();
      });
      expect(mockUpdateVacancy).not.toHaveBeenCalled();
    });

    it('does not show a confirmation dialog when arriving via the schedule-to-onhold toggle flow', async () => {
      vi.mocked(useLocation).mockReturnValue({
        state: { scheduleToOnhold: true },
      } as unknown as ReturnType<typeof useLocation>);
      mockVacancyForm({ form: { schedule: liveSchedule, status: 'live' } });
      renderComponent({ mode: 'edit' as const });

      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(mockUpdateVacancy).toHaveBeenCalledWith(
          expect.objectContaining({ existingStatus: 'on_hold' })
        );
      });
      expect(
        screen.queryByTestId('simple-confirm-dialog')
      ).not.toBeInTheDocument();
    });

    it('triggers notifyApplicants when the vacancy has applicants and the application form changed', async () => {
      const preferredSkillsA = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        skills: [
          {
            skillId: 'skill-1',
            skillName: 'React',
            careerPathName: 'Engineering',
            displayValue: 'React',
          },
        ],
      };
      const preferredSkillsB = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        skills: [
          ...preferredSkillsA.skills,
          {
            skillId: 'skill-2',
            skillName: 'TypeScript',
            careerPathName: 'Engineering',
            displayValue: 'TypeScript',
          },
        ],
      };

      mockOriginalFormRef.current = {
        schedule: liveSchedule,
        status: 'live',
        applicantCount: 3,
        preferredSkills: preferredSkillsA,
      };
      mockVacancyForm({
        form: {
          schedule: liveSchedule,
          status: 'live',
          applicantCount: 3,
          preferredSkills: preferredSkillsB,
        },
      });

      renderComponent({ mode: 'edit' as const });
      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());
      await waitFor(() =>
        expect(screen.getByTestId('simple-confirm-dialog')).toBeInTheDocument()
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'simple-confirm-yes' })
      );

      await waitFor(() => {
        expect(mockNotifyApplicants).toHaveBeenCalledWith(
          expect.objectContaining({
            vacancyId: 'vacancy-live-1',
            changedSections: expect.arrayContaining(['preferredSkills']),
          })
        );
      });
    });

    it('does not trigger notifyApplicants when there are no applicants, even though the update succeeds', async () => {
      mockVacancyForm({
        form: { schedule: liveSchedule, status: 'live', applicantCount: 0 },
      });

      renderComponent({ mode: 'edit' as const });
      await waitFor(() => expect(getCreateButton()).not.toBeDisabled());
      await userEvent.click(getCreateButton());
      await waitFor(() =>
        expect(screen.getByTestId('simple-confirm-dialog')).toBeInTheDocument()
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'simple-confirm-yes' })
      );

      await waitFor(() => expect(mockUpdateVacancy).toHaveBeenCalled());
      expect(mockNotifyApplicants).not.toHaveBeenCalled();
    });
  });
});
