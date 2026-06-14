import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScheduleVacancyStep from '@/views/vacancies/components/form-steps/schedule-vacancy-step';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import { useCreateVacancyMutation } from '@/views/vacancies/hooks';

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

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: vi.fn(),
  ErrorToast: vi.fn(),
}));

vi.mock('date-fns', () => ({
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
  const mockStepPersistRef: { current: (() => void) | null } = {
    current: null,
  };

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    onBack: mockOnBack,
    onSubmit: mockOnSubmit,
    onNext: mockOnNext,
  };

  /** Helper — sets up the useVacancyForm mock with required fields + optional overrides. */
  const mockVacancyForm = (overrides: Record<string, unknown> = {}) => {
    vi.mocked(useVacancyForm).mockReturnValue({
      form: { schedule: undefined },
      setForm: mockSetForm,
      onCancel: mockOnCancel,
      stepPersistRef: mockStepPersistRef,
      ...overrides,
    } as unknown as ReturnType<typeof useVacancyForm>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStepPersistRef.current = null;
    mockVacancyForm();

    vi.mocked(useCreateVacancyMutation).mockReturnValue({
      mutateAsync: mockCreateVacancy,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateVacancyMutation>);
  });

  const renderComponent = (overrideProps = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ScheduleVacancyStep {...defaultProps} {...overrideProps} />
      </QueryClientProvider>
    );

  // ── Field label constants (t() returns the key in tests) ─────────────────
  const PUBLISH_TIME_LABEL = 'scheduleVacancy.timeLabel';
  const EXPIRATION_TIME_LABEL = 'Expiration Time';

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
  });

  describe('button interactions', () => {
    it('calls onCancel when Cancel is clicked', async () => {
      renderComponent();
      await userEvent.click(getCancelButton());
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('does not call onBack when Cancel is clicked', async () => {
      renderComponent();
      await userEvent.click(getCancelButton());
      expect(mockOnBack).not.toHaveBeenCalled();
    });

    it('calls onBack when the header back arrow is clicked', async () => {
      renderComponent();
      const backButton = screen.getAllByRole('button')[0];
      await userEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalled();
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
  });

  describe('picker rendering', () => {
    it('passes correct timeLabel to publish and expiration pickers', () => {
      renderComponent();

      const publishCall = vi.mocked(CalendarWithTime).mock.calls[0]?.[0];
      const expirationCall = vi.mocked(CalendarWithTime).mock.calls[1]?.[0];

      expect(publishCall?.timeLabel).toBe('scheduleVacancy.timeLabel');
      expect(expirationCall?.timeLabel).toBe('Expiration Time');
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

      // Wait for re-render
      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
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
    it('shows ErrorToast when expiration datetime is before publish datetime', async () => {
      renderComponent();

      fillPublish('2099-12-26', '10:00:00 AM');
      fillExpiration('2099-12-25', '10:00:00 AM'); // before publish

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(ErrorToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.validationErrorTitle',
            description:
              'scheduleVacancy.notifications.expirationLessOrEqualMessage',
          })
        );
      });
    });

    it('shows ErrorToast when expiration equals publish datetime', async () => {
      renderComponent();

      fillPublish('2099-12-25', '10:00:00 AM');
      fillExpiration('2099-12-25', '10:00:00 AM'); // same datetime

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(ErrorToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description:
              'scheduleVacancy.notifications.expirationLessOrEqualMessage',
          })
        );
      });
    });

    it('shows ErrorToast when publish datetime is in the past', async () => {
      renderComponent();

      // 2020 dates are definitively in the past; expiration > publish so schema passes
      fillPublish('2020-01-01', '10:00:00 AM');
      fillExpiration('2020-01-02', '10:00:00 AM');

      await waitFor(() => {
        expect(getCreateButton()).not.toBeDisabled();
      });

      await userEvent.click(getCreateButton());

      await waitFor(() => {
        expect(ErrorToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'scheduleVacancy.notifications.validationErrorTitle',
            description: 'scheduleVacancy.notifications.pastDateTimeMessage',
          })
        );
      });
    });

    it('does not call onSubmit when datetime is in the past', async () => {
      renderComponent();

      fillPublish('2020-01-01', '10:00:00 AM');
      fillExpiration('2020-01-02', '10:00:00 AM');

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
});
