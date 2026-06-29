import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyCancelDialog from '@/views/vacancies/components/vacancy-cancel-dialog';

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
const onDiscard = vi.fn();
const onSaveAsDraft = vi.fn();

describe('VacancyCancelDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render dialog content when closed', () => {
    render(
      <VacancyCancelDialog
        open={false}
        onOpenChange={onOpenChange}
        onDiscard={onDiscard}
        onSaveAsDraft={onSaveAsDraft}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(
      <VacancyCancelDialog
        open={true}
        onOpenChange={onOpenChange}
        onDiscard={onDiscard}
        onSaveAsDraft={onSaveAsDraft}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'vacancyCancelDialog.title' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'vacancyCancelDialog.discardButton' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'vacancyCancelDialog.saveAsDraftButton',
      })
    ).toBeInTheDocument();
  });

  it('calls onDiscard when the Discard button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyCancelDialog
        open={true}
        onOpenChange={onOpenChange}
        onDiscard={onDiscard}
        onSaveAsDraft={onSaveAsDraft}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'vacancyCancelDialog.discardButton' })
    );

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onSaveAsDraft).not.toHaveBeenCalled();
  });

  it('calls onSaveAsDraft when Save as Draft is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyCancelDialog
        open={true}
        onOpenChange={onOpenChange}
        onDiscard={onDiscard}
        onSaveAsDraft={onSaveAsDraft}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'vacancyCancelDialog.saveAsDraftButton',
      })
    );

    expect(onSaveAsDraft).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('disables the Save as Draft button when isSavingDraft is true', () => {
    render(
      <VacancyCancelDialog
        open={true}
        onOpenChange={onOpenChange}
        onDiscard={onDiscard}
        onSaveAsDraft={onSaveAsDraft}
        isSavingDraft={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    const saveDraftButton = buttons[buttons.length - 1];
    expect(saveDraftButton).toBeDisabled();
  });

  it('shows spinner alongside button text when isSavingDraft is true', () => {
    render(
      <VacancyCancelDialog
        open={true}
        onOpenChange={onOpenChange}
        onDiscard={onDiscard}
        onSaveAsDraft={onSaveAsDraft}
        isSavingDraft={true}
      />
    );

    expect(
      screen.getByText('vacancyCancelDialog.saveAsDraftButton')
    ).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const saveDraftButton = buttons[buttons.length - 1];
    expect(saveDraftButton.querySelector('svg')).toBeInTheDocument();
  });

  it('shows Save as Draft text and enables button when isSavingDraft is false', () => {
    render(
      <VacancyCancelDialog
        open={true}
        onOpenChange={onOpenChange}
        onDiscard={onDiscard}
        onSaveAsDraft={onSaveAsDraft}
        isSavingDraft={false}
      />
    );

    const saveBtn = screen.getByRole('button', {
      name: 'vacancyCancelDialog.saveAsDraftButton',
    });
    expect(saveBtn).not.toBeDisabled();
  });
});
