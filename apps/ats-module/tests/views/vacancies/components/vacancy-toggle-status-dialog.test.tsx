import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyToggleStatusDialog from '@/views/vacancies/components/vacancy-toggle-status-dialog';

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
const onSchedule = vi.fn();

describe('VacancyToggleStatusDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render dialog content when closed', () => {
    render(
      <VacancyToggleStatusDialog
        open={false}
        onOpenChange={onOpenChange}
        action="ACTIVATE"
        onConfirm={onConfirm}
        onSchedule={onSchedule}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders activate message and Activate button for ACTIVATE action', () => {
    render(
      <VacancyToggleStatusDialog
        open={true}
        onOpenChange={onOpenChange}
        action="ACTIVATE"
        onConfirm={onConfirm}
        onSchedule={onSchedule}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'vacancies.toggleStatusDialog.title',
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('vacancies.toggleStatusDialog.activateMessage').length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', {
        name: 'vacancies.toggleStatusDialog.activate',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'vacancies.toggleStatusDialog.schedule',
      })
    ).toBeInTheDocument();
  });

  it('renders deactivate message and Deactivate button for DEACTIVATE action', () => {
    render(
      <VacancyToggleStatusDialog
        open={true}
        onOpenChange={onOpenChange}
        action="DEACTIVATE"
        onConfirm={onConfirm}
        onSchedule={onSchedule}
      />
    );

    expect(
      screen.getAllByText('vacancies.toggleStatusDialog.deactivateMessage')
        .length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', {
        name: 'vacancies.toggleStatusDialog.deactivate',
      })
    ).toBeInTheDocument();
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyToggleStatusDialog
        open={true}
        onOpenChange={onOpenChange}
        action="ACTIVATE"
        onConfirm={onConfirm}
        onSchedule={onSchedule}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'vacancies.toggleStatusDialog.activate',
      })
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onSchedule).not.toHaveBeenCalled();
  });

  it('calls onSchedule when the Schedule button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyToggleStatusDialog
        open={true}
        onOpenChange={onOpenChange}
        action="DEACTIVATE"
        onConfirm={onConfirm}
        onSchedule={onSchedule}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'vacancies.toggleStatusDialog.schedule',
      })
    );

    expect(onSchedule).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables both buttons and shows spinner when isToggling is true', () => {
    render(
      <VacancyToggleStatusDialog
        open={true}
        onOpenChange={onOpenChange}
        action="ACTIVATE"
        onConfirm={onConfirm}
        onSchedule={onSchedule}
        isToggling={true}
      />
    );

    expect(
      screen.queryByText('vacancies.toggleStatusDialog.activate')
    ).not.toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => expect(button).toBeDisabled());
    const confirmButton = buttons[buttons.length - 1];
    expect(confirmButton.querySelector('svg')).toBeInTheDocument();
  });
});
