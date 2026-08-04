import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyOnholdUpdateDialog from '@/views/vacancies/components/vacancy-onhold-update-dialog';

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

describe('VacancyOnholdUpdateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render dialog content when closed', () => {
    render(
      <VacancyOnholdUpdateDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={false}
        hasApplicants={false}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the scheduleChanged variant copy when publish date changed and has applicants', () => {
    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={true}
        hasApplicants={true}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'vacancyOnholdUpdateDialog.scheduleChanged.title',
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        'vacancyOnholdUpdateDialog.scheduleChanged.description'
      ).length
    ).toBeGreaterThan(0);
  });

  it('renders the scheduleChangedNoApplicants variant when publish date changed and no applicants', () => {
    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={true}
        hasApplicants={false}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'vacancyOnholdUpdateDialog.scheduleChangedNoApplicants.title',
      })
    ).toBeInTheDocument();
  });

  it('renders the scheduleUnchanged variant when publish date unchanged and has applicants', () => {
    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={false}
        hasApplicants={true}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'vacancyOnholdUpdateDialog.scheduleUnchanged.title',
      })
    ).toBeInTheDocument();
  });

  it('renders the scheduleUnchangedNoApplicants variant when publish date unchanged and no applicants', () => {
    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={false}
        hasApplicants={false}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'vacancyOnholdUpdateDialog.scheduleUnchangedNoApplicants.title',
      })
    ).toBeInTheDocument();
  });

  it('calls onOpenChange with false when the No button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={false}
        hasApplicants={false}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'vacancyOnholdUpdateDialog.noButton',
      })
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when the Yes button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={false}
        hasApplicants={false}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'vacancyOnholdUpdateDialog.yesButton',
      })
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('disables the No button when isConfirming is true', () => {
    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={false}
        hasApplicants={false}
        isConfirming={true}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'vacancyOnholdUpdateDialog.noButton',
      })
    ).toBeDisabled();
  });

  it('does not disable the No button when isConfirming defaults to false', () => {
    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={false}
        hasApplicants={false}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'vacancyOnholdUpdateDialog.noButton',
      })
    ).not.toBeDisabled();
  });

  it('disables the Yes button and shows a spinner when isConfirming is true', () => {
    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={false}
        hasApplicants={false}
        isConfirming={true}
      />
    );

    const yesButton = screen.getByRole('button', {
      name: /vacancyOnholdUpdateDialog\.yesButton/,
    });
    expect(yesButton).toBeDisabled();
    expect(yesButton.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show a spinner and enables the Yes button when isConfirming defaults to false', () => {
    render(
      <VacancyOnholdUpdateDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPublishDateChanged={false}
        hasApplicants={false}
      />
    );

    const yesButton = screen.getByRole('button', {
      name: 'vacancyOnholdUpdateDialog.yesButton',
    });
    expect(yesButton).not.toBeDisabled();
    expect(yesButton.querySelector('svg')).not.toBeInTheDocument();
  });
});
