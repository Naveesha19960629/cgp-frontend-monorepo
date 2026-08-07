import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SimpleConfirmDialog from '@/views/vacancies/components/simple-confirm-dialog';

// ── Mock react-i18next ─────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ── Mock Dialog ────────────────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="dialog-root" data-on-open-change="true">
        {children}
        <button
          type="button"
          aria-label="simulate-escape-close"
          onClick={() => onOpenChange(false)}
        >
          simulate-escape-close
        </button>
      </div>
    ) : null,
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

const baseProps = {
  onOpenChange,
  onConfirm,
  titleKey: 'test.title',
  descriptionKey: 'test.description',
  cancelLabelKey: 'test.cancel',
  confirmLabelKey: 'test.confirm',
};

describe('SimpleConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render dialog content when closed', () => {
    render(<SimpleConfirmDialog open={false} {...baseProps} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the given title and description keys', () => {
    render(<SimpleConfirmDialog open={true} {...baseProps} />);

    expect(
      screen.getByRole('heading', { name: 'test.title' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('test.description').length).toBeGreaterThan(0);
  });

  it('calls onOpenChange with false when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<SimpleConfirmDialog open={true} {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'test.cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<SimpleConfirmDialog open={true} {...baseProps} />);

    await user.click(screen.getByRole('button', { name: 'test.confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not disable buttons or show a spinner when isConfirming defaults to false', () => {
    render(<SimpleConfirmDialog open={true} {...baseProps} />);

    const confirmButton = screen.getByRole('button', {
      name: 'test.confirm',
    });
    expect(confirmButton).not.toBeDisabled();
    expect(confirmButton.querySelector('svg')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'test.cancel' })
    ).not.toBeDisabled();
  });

  it('disables both buttons and shows a spinner on confirm when isConfirming is true', () => {
    render(
      <SimpleConfirmDialog open={true} {...baseProps} isConfirming={true} />
    );

    const confirmButton = screen.getByRole('button', {
      name: /test\.confirm/,
    });
    expect(confirmButton).toBeDisabled();
    expect(confirmButton.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'test.cancel' })).toBeDisabled();
  });

  it('ignores close attempts (ESC/outside click) routed through onOpenChange while isConfirming is true', async () => {
    const user = userEvent.setup();
    render(
      <SimpleConfirmDialog open={true} {...baseProps} isConfirming={true} />
    );

    await user.click(
      screen.getByRole('button', { name: 'simulate-escape-close' })
    );

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('forwards close attempts routed through onOpenChange when isConfirming is false', async () => {
    const user = userEvent.setup();
    render(<SimpleConfirmDialog open={true} {...baseProps} />);

    await user.click(
      screen.getByRole('button', { name: 'simulate-escape-close' })
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
