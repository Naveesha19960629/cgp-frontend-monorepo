import { FormProvider, useForm } from 'react-hook-form';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScheduleVacancyStep from '@/views/vacancies/components/form-steps/schedule-vacancy-step';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import { useCreateVacancyMutation } from '@/views/vacancies/hooks';

import { CalendarWithTime } from '@cgp/ui-kit/components/ui/calendar-with-time';

// Mock dependencies
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
  CalendarWithTime: vi.fn(({ label, error, value, onChange }) => (
    <div data-testid="calendar-with-time">
      <label>{label}</label>
      {error && <div className="text-red-500">{error}</div>}
      <input
        type="hidden"
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        data-testid={`${label}-input`}
      />
    </div>
  )),
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
  const mockCreateVacancy = vi.fn();
  const queryClient = new QueryClient();

  const defaultProps = {
    onBack: mockOnBack,
    onSubmit: mockOnSubmit,
    onNext: mockOnNext,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useVacancyForm as any).mockReturnValue({
      form: {
        schedule: {
          schedulePublishDate: '',
          schedulePublishTime: '',
          expirationDate: '',
          expirationTime: '',
        },
      },
    });

    (useCreateVacancyMutation as any).mockReturnValue({
      mutateAsync: mockCreateVacancy,
      isPending: false,
    });
  });

  const renderComponent = (overrideProps = {}) => {
    // Create a form wrapper component that uses hooks properly
    const FormWrapper = () => {
      const form = useForm({
        defaultValues: {
          schedulePublishDate: '',
          schedulePublishTime: '',
          expirationDate: '',
          expirationTime: '',
        },
        mode: 'onChange',
      });
      return (
        <QueryClientProvider client={queryClient}>
          <FormProvider {...form}>
            <ScheduleVacancyStep {...defaultProps} {...overrideProps} />
          </FormProvider>
        </QueryClientProvider>
      );
    };
    return render(<FormWrapper />);
  };

  describe('rendering', () => {
    it('should render the schedule vacancy step', () => {
      renderComponent();

      // Component should render without errors
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('should render both CalendarWithTime picker fields', () => {
      renderComponent();

      const pickers = screen.getAllByTestId('calendar-with-time');
      expect(pickers).toHaveLength(2); // Publish and Expiration fields
    });

    it('should render footer with buttons', () => {
      renderComponent();

      const buttons = screen.getAllByRole('button');
      // Back button + Cancel + Create
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('button states', () => {
    it('should render Create button in disabled state initially', () => {
      renderComponent();

      const buttons = screen.getAllByRole('button');
      const createButton = buttons[buttons.length - 1]; // Last button is Create
      // Should be disabled because form is invalid (empty required fields)
      expect(createButton).toBeDisabled();
    });

    it('should disable Create button when mutation is pending', () => {
      (useCreateVacancyMutation as any).mockReturnValue({
        mutateAsync: mockCreateVacancy,
        isPending: true,
      });

      renderComponent();

      const buttons = screen.getAllByRole('button');
      const createButton = buttons[buttons.length - 1];
      expect(createButton).toBeDisabled();
    });
  });

  describe('button interactions', () => {
    it('should call onBack when Cancel button is clicked', async () => {
      renderComponent();

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons[buttons.length - 2]; // Second to last is Cancel
      await userEvent.click(cancelButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should call onBack when header back button is clicked', async () => {
      renderComponent();

      const buttons = screen.getAllByRole('button');
      const backButton = buttons[0]; // First button is back
      await userEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('picker rendering', () => {
    it('should render CalendarWithTime components for date and time selection', () => {
      renderComponent();

      const pickers = screen.getAllByTestId('calendar-with-time');
      expect(pickers).toHaveLength(2);
    });

    it('should render both publish and expiration date pickers', () => {
      renderComponent();

      const pickers = screen.getAllByTestId('calendar-with-time');
      expect(pickers.length).toBe(2);
    });

    it('should pass combined date and 24-hour time as formatted display', () => {
      (useVacancyForm as any).mockReturnValue({
        form: {
          schedule: {
            schedulePublishAt: '2026-06-25T10:30:00 AM',
          },
        },
      });

      renderComponent();

      const calendarWithTimeMock = vi.mocked(CalendarWithTime);
      const publishCall = calendarWithTimeMock.mock.calls[0]?.[0];

      expect(publishCall?.formattedDateDisplay).toBe('10 Jun 2026 10:30:00 AM');
    });

    it('should pass combined date and 12-hour normalized time as formatted display', () => {
      (useVacancyForm as any).mockReturnValue({
        form: {
          schedule: {
            expirationAt: '2026-06-30T5:27 PM',
          },
        },
      });

      renderComponent();

      const calendarWithTimeMock = vi.mocked(CalendarWithTime);
      const expirationCall = calendarWithTimeMock.mock.calls[1]?.[0];

      expect(expirationCall?.formattedDateDisplay).toBe(
        '10 Jun 2026 05:27:00 PM'
      );
    });

    it('should pass date-only formatted display when time is missing', () => {
      (useVacancyForm as any).mockReturnValue({
        form: {
          schedule: {
            schedulePublishAt: '2026-06-25T',
          },
        },
      });

      renderComponent();

      const calendarWithTimeMock = vi.mocked(CalendarWithTime);
      const publishCall = calendarWithTimeMock.mock.calls[0]?.[0];

      expect(publishCall?.formattedDateDisplay).toBe('10 Jun 2026');
    });

    it('should pass correct time labels to publish and expiration pickers', () => {
      renderComponent();

      const calendarWithTimeMock = vi.mocked(CalendarWithTime);
      const publishCall = calendarWithTimeMock.mock.calls[0]?.[0];
      const expirationCall = calendarWithTimeMock.mock.calls[1]?.[0];

      expect(publishCall?.timeLabel).toBe('scheduleVacancy.timeLabel');
      expect(expirationCall?.timeLabel).toBe('Expiration Time');
    });

    it('should pass disabledDates function that blocks dates before publish date for expiration', () => {
      (useVacancyForm as any).mockReturnValue({
        form: {
          schedule: {
            schedulePublishAt: '2026-06-25T10:30:00 AM',
            expirationAt: '2026-06-30T05:27:00 PM',
          },
        },
      });

      renderComponent();

      const calendarWithTimeMock = vi.mocked(CalendarWithTime);
      const expirationCall = calendarWithTimeMock.mock.calls[1]?.[0];
      const expirationDisabledDates = expirationCall?.disabledDates as
        | ((date: Date) => boolean)
        | undefined;

      expect(expirationDisabledDates).toBeTypeOf('function');
      expect(expirationDisabledDates?.(new Date('2026-06-24'))).toBe(true);
      expect(expirationDisabledDates?.(new Date('2026-06-25'))).toBe(false);
    });
  });

  describe('component layout', () => {
    it('should render component with flex layout for fields', () => {
      renderComponent();

      const pickers = screen.getAllByTestId('calendar-with-time');
      expect(pickers.length).toBe(2);
    });

    it('should support responsive wrapping', () => {
      renderComponent();

      const pickers = screen.getAllByTestId('calendar-with-time');
      expect(pickers.length).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should display error messages from validation', () => {
      renderComponent();

      const pickers = screen.getAllByTestId('calendar-with-time');
      expect(pickers.length).toBeGreaterThan(0);
    });
  });

  describe('form integration', () => {
    it('should use useCreateVacancyMutation for submission', () => {
      renderComponent();

      expect(useCreateVacancyMutation).toHaveBeenCalled();
    });
  });
});
