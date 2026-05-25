import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddAwardingBodyDialog } from '@/views/vacancies/components/form-steps/add-awarding-body-dialog';

// ── Mock react-i18next ─────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ── Mock hooks ─────────────────────────────────────────────────────────────

const mockMutateAsync = vi.fn();

vi.mock('@/views/vacancies/hooks', () => ({
  useAddTertiaryAwardingBodyMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useTertiaryAwardingBodyLocationsSearch: () =>
    vi.fn(() => Promise.resolve([])),
}));

// ── Mock toasts ────────────────────────────────────────────────────────────

const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: (...args: unknown[]) => mockSuccessToast(...args) as unknown,
  ErrorToast: (...args: unknown[]) => mockErrorToast(...args) as unknown,
}));

// ── Mock Dialog ────────────────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children: ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
}));

// ── Mock MultipleSelector ─────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/multiple-selector', () => ({
  default: ({
    placeholder,
    onChange,
  }: {
    placeholder: string;
    onChange?: (opts: { id: string; label: string }[]) => void;
  }) => (
    <div>
      <input placeholder={placeholder} readOnly />
      <button
        type="button"
        data-testid="select-location"
        onClick={() => onChange?.([{ id: 'loc-1', label: 'Colombo' }])}
      >
        Pick Location
      </button>
    </div>
  ),
}));

// ── Mock Button ────────────────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled ?? false}
      type={(type ?? 'button') as 'button' | 'submit'}
    >
      {children}
    </button>
  ),
}));

// ── Mock CharacterCount ───────────────────────────────────────────────────

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => null,
}));

// ── Shared callbacks ──────────────────────────────────────────────────────

const onClose = vi.fn();
const onAdded = vi.fn();

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AddAwardingBodyDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({
      data: { pendingId: 'awarding-body-1' },
    });
  });

  it('does not render when closed', () => {
    render(
      <AddAwardingBodyDialog
        open={false}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog title when open', () => {
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(
      screen.getByText('tertiaryEducation.addAwardingBodyDialog.title')
    ).toBeInTheDocument();
  });

  it('pre-fills the name input with initialName', () => {
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(
      screen.getByDisplayValue('University of Moratuwa')
    ).toBeInTheDocument();
  });

  it('Add Now button is disabled when name is empty', () => {
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName=""
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(
      screen.getByRole('button', {
        name: 'tertiaryEducation.addAwardingBodyDialog.addNow',
      })
    ).toBeDisabled();
  });

  it('Add Now button is disabled when location is not selected', () => {
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(
      screen.getByRole('button', {
        name: 'tertiaryEducation.addAwardingBodyDialog.addNow',
      })
    ).toBeDisabled();
  });

  it('Add Now button is enabled after name and location are both provided', async () => {
    const user = userEvent.setup();
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(screen.getByTestId('select-location'));
    expect(
      screen.getByRole('button', {
        name: 'tertiaryEducation.addAwardingBodyDialog.addNow',
      })
    ).not.toBeDisabled();
  });

  it('shows URL validation error when protocol is not http/https', async () => {
    const user = userEvent.setup();
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.type(
      screen.getByPlaceholderText(
        'tertiaryEducation.addAwardingBodyDialog.urlPlaceholder'
      ),
      'ftp://university.edu'
    );
    expect(
      screen.getByText('tertiaryEducation.addAwardingBodyDialog.urlInvalid')
    ).toBeInTheDocument();
  });

  it('clears URL validation error when a valid URL is typed', async () => {
    const user = userEvent.setup();
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    const urlInput = screen.getByPlaceholderText(
      'tertiaryEducation.addAwardingBodyDialog.urlPlaceholder'
    );
    await user.type(urlInput, 'ftp://bad');
    expect(
      screen.getByText('tertiaryEducation.addAwardingBodyDialog.urlInvalid')
    ).toBeInTheDocument();
    await user.clear(urlInput);
    await user.type(urlInput, 'https://university.edu');
    expect(
      screen.queryByText('tertiaryEducation.addAwardingBodyDialog.urlInvalid')
    ).not.toBeInTheDocument();
  });

  it('Add Now button is disabled when URL has a validation error', async () => {
    const user = userEvent.setup();
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(screen.getByTestId('select-location'));
    await user.type(
      screen.getByPlaceholderText(
        'tertiaryEducation.addAwardingBodyDialog.urlPlaceholder'
      ),
      'not-a-url'
    );
    expect(
      screen.getByRole('button', {
        name: 'tertiaryEducation.addAwardingBodyDialog.addNow',
      })
    ).toBeDisabled();
  });

  it('calls onAdded, SuccessToast, and onClose on successful add', async () => {
    const user = userEvent.setup();
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(screen.getByTestId('select-location'));
    await user.click(
      screen.getByRole('button', {
        name: 'tertiaryEducation.addAwardingBodyDialog.addNow',
      })
    );
    await waitFor(() => {
      expect(onAdded).toHaveBeenCalledWith({
        id: 'awarding-body-1',
        label: 'University of Moratuwa',
        source: 'PENDING',
      });
    });
    expect(mockSuccessToast).toHaveBeenCalledWith({
      title: 'tertiaryEducation.addAwardingBodyDialog.success.title',
      description: 'tertiaryEducation.addAwardingBodyDialog.success.message',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('passes locationId and url to the mutation', async () => {
    const user = userEvent.setup();
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(screen.getByTestId('select-location'));
    await user.type(
      screen.getByPlaceholderText(
        'tertiaryEducation.addAwardingBodyDialog.urlPlaceholder'
      ),
      'https://uom.lk'
    );
    await user.click(
      screen.getByRole('button', {
        name: 'tertiaryEducation.addAwardingBodyDialog.addNow',
      })
    );
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        displayValue: 'University of Moratuwa',
        locationId: 'loc-1',
        url: 'https://uom.lk',
      });
    });
  });

  it('calls ErrorToast with network error keys on TypeError', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new TypeError('Network failure'));
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(screen.getByTestId('select-location'));
    await user.click(
      screen.getByRole('button', {
        name: 'tertiaryEducation.addAwardingBodyDialog.addNow',
      })
    );
    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith({
        title: 'notifications.networkError.title',
        description: 'notifications.networkError.message',
      });
    });
  });

  it('calls ErrorToast with API error keys on non-TypeError', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Server error'));
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(screen.getByTestId('select-location'));
    await user.click(
      screen.getByRole('button', {
        name: 'tertiaryEducation.addAwardingBodyDialog.addNow',
      })
    );
    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith({
        title: 'notifications.apiError.save.title',
        description: 'notifications.apiError.save.message',
      });
    });
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AddAwardingBodyDialog
        open={true}
        initialName="University of Moratuwa"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(
      screen.getByRole('button', {
        name: 'tertiaryEducation.addAwardingBodyDialog.cancel',
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
