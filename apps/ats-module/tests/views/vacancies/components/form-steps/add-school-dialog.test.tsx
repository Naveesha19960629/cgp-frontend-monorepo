import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddSchoolDialog } from '@/views/vacancies/components/form-steps/add-school-dialog';

// â”€â”€ Mock react-i18next â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// â”€â”€ Mock hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockUseSchoolLocationsQuery = vi.hoisted(() => vi.fn());

vi.mock('@/views/vacancies/hooks', () => ({
  useSchoolLocationsQuery: (search: string) =>
    mockUseSchoolLocationsQuery(search) as unknown,
}));

// â”€â”€ Mock toasts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockSuccessToast = vi.fn();

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: (...args: unknown[]) => mockSuccessToast(...args) as unknown,
}));

// â”€â”€ Mock Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

vi.mock('@cgp/ui-kit/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children: ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
  DialogHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
  DialogDescription: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock('@cgp/ui-kit/components/scroll-area-with-shadow', () => ({
  ScrollAreaWithShadow: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@cgp/ui-kit/components/ui/popover', () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@radix-ui/react-popover', () => ({
  Portal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Content: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Arrow: () => null,
}));

vi.mock('@cgp/ui-kit/lib/utils', () => ({
  removeEmoji: (str: string) => str,
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// â”€â”€ Mock LocationAutocomplete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

vi.mock('@cgp/ui-kit/components/location-autocomplete', () => ({
  LocationAutocomplete: ({
    placeholder,
    onSelect,
    onSearchChange,
    options,
  }: {
    placeholder?: string;
    onSelect?: (option: { id: string; label: string }) => void;
    onSearchChange?: (value: string) => void;
    options?: { id: string; label: string }[];
  }) => (
    <div>
      <input placeholder={placeholder} readOnly />
      <button
        type="button"
        data-testid="select-location"
        onClick={() => onSelect?.({ id: 'loc-1', label: 'Colombo' })}
      >
        Pick Location
      </button>
      <button
        type="button"
        data-testid="search-location"
        onClick={() => onSearchChange?.('col')}
      >
        Search Location
      </button>
      <button
        type="button"
        data-testid="search-location-no-match"
        onClick={() => onSearchChange?.('zzz')}
      >
        Search No Match
      </button>
      <p data-testid="location-options-count">{options?.length ?? 0}</p>
    </div>
  ),
}));

// â”€â”€ Mock Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Mock CharacterCount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

vi.mock('@cgp/ui-kit/components/character-count', () => ({
  CharacterCount: () => null,
}));

// â”€â”€ Shared callbacks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const onClose = vi.fn();
const onAdded = vi.fn();

// â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('AddSchoolDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSchoolLocationsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
  });

  it('does not render when closed', () => {
    render(
      <AddSchoolDialog
        open={false}
        initialName="Royal College"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog title when open', () => {
    render(
      <AddSchoolDialog
        open={true}
        initialName="Royal College"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(
      screen.getAllByText('secondaryEducation.addSchoolDialog.title').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('pre-fills the name input with initialName', () => {
    render(
      <AddSchoolDialog
        open={true}
        initialName="Test School"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(screen.getByDisplayValue('Test School')).toBeInTheDocument();
  });

  it('Add Now button is disabled when name is empty', () => {
    render(
      <AddSchoolDialog
        open={true}
        initialName=""
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(
      screen.getByRole('button', {
        name: 'secondaryEducation.addSchoolDialog.addNow',
      })
    ).toBeDisabled();
  });

  it('Add Now button is disabled when location is not selected', () => {
    render(
      <AddSchoolDialog
        open={true}
        initialName="Royal College"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    expect(
      screen.getByRole('button', {
        name: 'secondaryEducation.addSchoolDialog.addNow',
      })
    ).toBeDisabled();
  });

  it('Add Now button is enabled when both name and location are filled', async () => {
    const user = userEvent.setup();
    render(
      <AddSchoolDialog
        open={true}
        initialName="Royal College"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(screen.getByTestId('select-location'));
    expect(
      screen.getByRole('button', {
        name: 'secondaryEducation.addSchoolDialog.addNow',
      })
    ).not.toBeDisabled();
  });

  it('shows URL validation error when protocol is not http/https', async () => {
    const user = userEvent.setup();
    render(
      <AddSchoolDialog
        open={true}
        initialName="Royal College"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.type(
      screen.getByPlaceholderText(
        'secondaryEducation.addSchoolDialog.schoolUrlPlaceholder'
      ),
      'ftp://school.com'
    );
    expect(
      screen.getByText('secondaryEducation.addSchoolDialog.schoolUrlInvalid')
    ).toBeInTheDocument();
  });

  it('clears URL validation error when a valid URL is typed', async () => {
    const user = userEvent.setup();
    render(
      <AddSchoolDialog
        open={true}
        initialName="Royal College"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    const urlInput = screen.getByPlaceholderText(
      'secondaryEducation.addSchoolDialog.schoolUrlPlaceholder'
    );
    await user.type(urlInput, 'ftp://bad');
    expect(
      screen.getByText('secondaryEducation.addSchoolDialog.schoolUrlInvalid')
    ).toBeInTheDocument();
    await user.clear(urlInput);
    await user.type(urlInput, 'https://school.edu');
    expect(
      screen.queryByText('secondaryEducation.addSchoolDialog.schoolUrlInvalid')
    ).not.toBeInTheDocument();
  });

  it('does not call onAdded when URL has a validation error', async () => {
    const user = userEvent.setup();
    render(
      <AddSchoolDialog
        open={true}
        initialName="Royal College"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(screen.getByTestId('select-location'));
    await user.type(
      screen.getByPlaceholderText(
        'secondaryEducation.addSchoolDialog.schoolUrlPlaceholder'
      ),
      'not-a-url'
    );
    await user.click(
      screen.getByRole('button', {
        name: 'secondaryEducation.addSchoolDialog.addNow',
      })
    );
    expect(onAdded).not.toHaveBeenCalled();
  });

  it('calls onAdded and SuccessToast synchronously on Add Now click', async () => {
    const user = userEvent.setup();
    render(
      <AddSchoolDialog
        open={true}
        initialName="Royal College"
        onClose={onClose}
        onAdded={onAdded}
      />
    );
    await user.click(screen.getByTestId('select-location'));
    await user.click(
      screen.getByRole('button', {
        name: 'secondaryEducation.addSchoolDialog.addNow',
      })
    );
    expect(onAdded).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: expect.stringMatching(/^__pending_school_/),
        label: 'Royal College',
        source: 'PENDING_TEMP',
        locationId: 'loc-1',
      })
    );
    expect(mockSuccessToast).toHaveBeenCalledWith({
      title: 'secondaryEducation.addSchoolDialog.success.title',
      description: 'secondaryEducation.addSchoolDialog.success.message',
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('filters location options by search text before passing to autocomplete', async () => {
    const user = userEvent.setup();
    mockUseSchoolLocationsQuery.mockImplementation(() => ({
      data: {
        data: {
          items: {
            content: [
              { id: 'loc-1', label: 'Colombo' },
              { id: 'loc-2', label: 'Kandy' },
            ],
          },
        },
      },
      isLoading: false,
    }));

    render(
      <AddSchoolDialog
        open={true}
        initialName="Royal College"
        onClose={onClose}
        onAdded={onAdded}
      />
    );

    expect(screen.getByTestId('location-options-count')).toHaveTextContent('2');

    await user.click(screen.getByTestId('search-location'));
    expect(screen.getByTestId('location-options-count')).toHaveTextContent('1');

    await user.click(screen.getByTestId('search-location-no-match'));
    expect(screen.getByTestId('location-options-count')).toHaveTextContent('0');
  });
});
