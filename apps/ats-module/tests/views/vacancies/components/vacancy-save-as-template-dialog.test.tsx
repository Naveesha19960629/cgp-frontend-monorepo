import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancySaveAsTemplateDialog from '@/views/vacancies/components/vacancy-save-as-template-dialog';

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

// ── Mock ui-kit utilities ─────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/lib/typography', () => ({
  applyTypography: () => '',
}));

vi.mock('@cgp/ui-kit/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  removeEmoji: (str: string) => str,
}));

// ── Shared props ───────────────────────────────────────────────────────────

const onOpenChange = vi.fn();
const onTemplateNameChange = vi.fn();
const onConfirm = vi.fn();

const defaultProps = {
  open: true,
  onOpenChange,
  templateName: 'Template 4',
  onTemplateNameChange,
  onConfirm,
};

describe('VacancySaveAsTemplateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render dialog content when closed', () => {
    render(<VacancySaveAsTemplateDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    render(<VacancySaveAsTemplateDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'vacancySaveAsTemplateDialog.title',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'vacancySaveAsTemplateDialog.noButton',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'vacancySaveAsTemplateDialog.yesButton',
      })
    ).toBeInTheDocument();
  });

  it('pre-fills the input with the given templateName and shows the character count', () => {
    render(<VacancySaveAsTemplateDialog {...defaultProps} />);

    expect(screen.getByDisplayValue('Template 4')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('/150')).toBeInTheDocument();
  });

  it('calls onTemplateNameChange as the recruiter types', async () => {
    const user = userEvent.setup();
    render(<VacancySaveAsTemplateDialog {...defaultProps} templateName="" />);

    await user.type(
      screen.getByPlaceholderText(
        'vacancySaveAsTemplateDialog.namePlaceholder'
      ),
      'A'
    );

    expect(onTemplateNameChange).toHaveBeenCalledWith('A');
  });

  it('calls onConfirm when Yes is clicked', async () => {
    const user = userEvent.setup();
    render(<VacancySaveAsTemplateDialog {...defaultProps} />);

    await user.click(
      screen.getByRole('button', {
        name: 'vacancySaveAsTemplateDialog.yesButton',
      })
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when No is clicked', async () => {
    const user = userEvent.setup();
    render(<VacancySaveAsTemplateDialog {...defaultProps} />);

    await user.click(
      screen.getByRole('button', {
        name: 'vacancySaveAsTemplateDialog.noButton',
      })
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables the Yes button when templateName is empty', () => {
    render(<VacancySaveAsTemplateDialog {...defaultProps} templateName="" />);

    expect(
      screen.getByRole('button', {
        name: 'vacancySaveAsTemplateDialog.yesButton',
      })
    ).toBeDisabled();
  });

  it('disables the Yes button when templateName is only whitespace', () => {
    render(
      <VacancySaveAsTemplateDialog {...defaultProps} templateName="   " />
    );

    expect(
      screen.getByRole('button', {
        name: 'vacancySaveAsTemplateDialog.yesButton',
      })
    ).toBeDisabled();
  });

  it('shows a spinner and disables both buttons while isSaving is true', () => {
    render(<VacancySaveAsTemplateDialog {...defaultProps} isSaving />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.every(button => button.hasAttribute('disabled'))).toBe(true);
    expect(
      screen.queryByRole('button', {
        name: 'vacancySaveAsTemplateDialog.yesButton',
      })
    ).not.toBeInTheDocument();
  });

  it('does not exceed the maximum character limit', () => {
    render(<VacancySaveAsTemplateDialog {...defaultProps} />);

    expect(screen.getByDisplayValue('Template 4')).toHaveAttribute(
      'maxlength',
      '150'
    );
  });
});
