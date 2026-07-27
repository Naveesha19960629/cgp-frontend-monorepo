import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyRescheduleConfirmDialog from '@/views/vacancies/components/vacancy-reschedule-confirm-dialog';

// ── Mock react-i18next ─────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ── Mock Dialog ────────────────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children: ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
  DialogDescription: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));

// ── Mock Button ────────────────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    type,
    disabled,
  }: {
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
  }) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// ── Mock ui-kit utilities ─────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/lib/typography', () => ({
  applyTypography: () => '',
}));

vi.mock('@cgp/ui-kit/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// ── Shared props ───────────────────────────────────────────────────────────

const onOpenChange = vi.fn();
const onConfirm = vi.fn();

describe('VacancyRescheduleConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render dialog content when closed', () => {
    render(
      <VacancyRescheduleConfirmDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(
      <VacancyRescheduleConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'scheduleVacancy.rescheduleConfirmDialog.title',
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('scheduleVacancy.rescheduleConfirmDialog.description')
        .length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', {
        name: 'scheduleVacancy.rescheduleConfirmDialog.noButton',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'scheduleVacancy.rescheduleConfirmDialog.yesButton',
      })
    ).toBeInTheDocument();
  });

  it('calls onOpenChange with false when the No button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyRescheduleConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'scheduleVacancy.rescheduleConfirmDialog.noButton',
      })
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when the Yes button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyRescheduleConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'scheduleVacancy.rescheduleConfirmDialog.yesButton',
      })
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('disables both buttons when isConfirming is true', () => {
    render(
      <VacancyRescheduleConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isConfirming={true}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'scheduleVacancy.rescheduleConfirmDialog.noButton',
      })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: 'scheduleVacancy.rescheduleConfirmDialog.yesButton',
      })
    ).toBeDisabled();
  });

  it('enables both buttons when isConfirming is false', () => {
    render(
      <VacancyRescheduleConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isConfirming={false}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'scheduleVacancy.rescheduleConfirmDialog.noButton',
      })
    ).not.toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: 'scheduleVacancy.rescheduleConfirmDialog.yesButton',
      })
    ).not.toBeDisabled();
  });
});
