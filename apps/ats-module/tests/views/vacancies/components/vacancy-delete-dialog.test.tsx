import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyDeleteDialog from '@/views/vacancies/components/vacancy-delete-dialog';

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

describe('VacancyDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render dialog content when closed', () => {
    render(
      <VacancyDeleteDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(
      <VacancyDeleteDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'vacancies.deleteDialog.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'vacancies.deleteDialog.cancel' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'vacancies.deleteDialog.confirm' })
    ).toBeInTheDocument();
  });

  it('calls onOpenChange with false when the Cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyDeleteDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'vacancies.deleteDialog.cancel' })
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when Confirm is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyDeleteDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'vacancies.deleteDialog.confirm' })
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('disables the Confirm button when isDeleting is true', () => {
    render(
      <VacancyDeleteDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isDeleting={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons[buttons.length - 1];
    expect(confirmButton).toBeDisabled();
  });

  it('shows spinner and hides button text when isDeleting is true', () => {
    render(
      <VacancyDeleteDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isDeleting={true}
      />
    );

    expect(
      screen.queryByText('vacancies.deleteDialog.confirm')
    ).not.toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons[buttons.length - 1];
    expect(confirmButton.querySelector('svg')).toBeInTheDocument();
  });

  it('shows Confirm text and enables button when isDeleting is false', () => {
    render(
      <VacancyDeleteDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isDeleting={false}
      />
    );

    const confirmBtn = screen.getByRole('button', {
      name: 'vacancies.deleteDialog.confirm',
    });
    expect(confirmBtn).not.toBeDisabled();
  });
});
