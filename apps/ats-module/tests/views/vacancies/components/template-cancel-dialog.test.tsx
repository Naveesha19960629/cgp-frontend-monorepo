import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TemplateCancelDialog from '@/views/vacancies/components/template-cancel-dialog';

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
  }: {
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
  }) => (
    <button type={type ?? 'button'} onClick={onClick}>
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

describe('TemplateCancelDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render dialog content when closed', () => {
    render(
      <TemplateCancelDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, description and both buttons when open', () => {
    render(
      <TemplateCancelDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'templateCancelDialog.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'templateCancelDialog.noButton' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'templateCancelDialog.yesButton' })
    ).toBeInTheDocument();
  });

  it('closes without confirming when No is clicked (AC.2.a.ii.2)', async () => {
    const user = userEvent.setup();

    render(
      <TemplateCancelDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'templateCancelDialog.noButton' })
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when Yes is clicked (AC.2.a.ii.1)', async () => {
    const user = userEvent.setup();

    render(
      <TemplateCancelDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'templateCancelDialog.yesButton' })
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
