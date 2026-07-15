import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TemplatesPage from '@/views/vacancies/pages/templates-page';

const navigate = vi.fn();
const useVacancyTemplatesQueryMock = vi.fn();
const useVacancyTemplatesTableParamsMock = vi.fn();
const useDeleteTemplateMutationMock = vi.fn();
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

const defaultParams = {
  page: 1,
  size: 12,
  search: '',
  sortOrder: 'NEWEST',
};

const mockTemplate = {
  vacancyTemplateId: 'template-1',
  templateName: 'Software Engineer',
  refNumber: 'REF-001',
  updatedAt: '2026-06-01T00:00:00Z',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => ({
    keycloak: { authenticated: true },
    initialized: true,
  }),
}));

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: (...args: unknown[]) => mockSuccessToast(...args) as unknown,
  ErrorToast: (...args: unknown[]) => mockErrorToast(...args) as unknown,
}));

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useVacancyTemplatesQuery: () => useVacancyTemplatesQueryMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useVacancyTemplatesTableParams: () => useVacancyTemplatesTableParamsMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useDeleteTemplateMutation: () => useDeleteTemplateMutationMock(),
    TemplatesToolbar: () => <div data-testid="templates-toolbar" />,
    TemplateEmptyState: () => <div data-testid="template-empty-state" />,
    TemplateSearchEmptyState: () => (
      <div data-testid="template-search-empty-state" />
    ),
    VacancyLoadingState: () => <div data-testid="vacancy-loading-state" />,
    VacancyTablePagination: () => (
      <div data-testid="vacancy-table-pagination" />
    ),
    TemplateCard: ({
      template,
      onDelete,
    }: {
      template: { vacancyTemplateId: string };
      onDelete: (id: string) => void;
    }) => (
      <div data-testid="template-card">
        <button
          type="button"
          onClick={() => onDelete(template.vacancyTemplateId)}
        >
          delete
        </button>
      </div>
    ),
    TemplateDeleteDialog: ({
      open,
      onConfirm,
      onOpenChange,
      isDeleting,
    }: {
      open: boolean;
      onConfirm: () => void;
      onOpenChange: (open: boolean) => void;
      isDeleting?: boolean;
    }) =>
      open ? (
        <div role="dialog">
          <button type="button" onClick={onConfirm} disabled={isDeleting}>
            templates.deleteDialog.confirm
          </button>
          <button type="button" onClick={() => onOpenChange(false)}>
            templates.deleteDialog.cancel
          </button>
        </div>
      ) : null,
  };
});

describe('TemplatesPage', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useVacancyTemplatesQueryMock.mockReturnValue({
      data: { data: { content: [mockTemplate], totalPages: 1 } },
      isLoading: false,
    });
    useVacancyTemplatesTableParamsMock.mockReturnValue([
      defaultParams,
      vi.fn(),
    ]);
    useDeleteTemplateMutationMock.mockReturnValue({
      mutate,
      isPending: false,
    });
  });

  it('renders page heading and template cards', () => {
    render(<TemplatesPage />);

    expect(screen.getByText('templates.title')).toBeInTheDocument();
    expect(screen.getByTestId('template-card')).toBeInTheDocument();
  });

  it('shows empty state when not loading and no templates exist', () => {
    useVacancyTemplatesQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    render(<TemplatesPage />);

    expect(screen.getByTestId('template-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('template-card')).not.toBeInTheDocument();
  });

  it('does not open the delete dialog by default', () => {
    render(<TemplatesPage />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the delete dialog when a template delete action is triggered', async () => {
    const user = userEvent.setup();
    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'delete' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes the delete dialog when cancelled', async () => {
    const user = userEvent.setup();
    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'delete' }));
    await user.click(
      screen.getByRole('button', { name: 'templates.deleteDialog.cancel' })
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls the delete mutation with the selected template id on confirm', async () => {
    const user = userEvent.setup();
    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'delete' }));
    await user.click(
      screen.getByRole('button', { name: 'templates.deleteDialog.confirm' })
    );

    expect(mutate).toHaveBeenCalledWith(
      'template-1',
      expect.objectContaining({
        onSuccess: expect.any(Function) as unknown,
        onError: expect.any(Function) as unknown,
      })
    );
  });

  it('shows a success toast and closes the dialog when deletion succeeds', async () => {
    const user = userEvent.setup();
    mutate.mockImplementation(
      (
        _id: string,
        options: { onSuccess: () => void; onError: () => void }
      ) => {
        options.onSuccess();
      }
    );

    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'delete' }));
    await user.click(
      screen.getByRole('button', { name: 'templates.deleteDialog.confirm' })
    );

    expect(mockSuccessToast).toHaveBeenCalledWith({
      title: 'templates.deleteDialog.notifications.successTitle',
      description: 'templates.deleteDialog.notifications.successMessage',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows an error toast and keeps templates unchanged when deletion fails', async () => {
    const user = userEvent.setup();
    mutate.mockImplementation(
      (
        _id: string,
        options: { onSuccess: () => void; onError: () => void }
      ) => {
        options.onError();
      }
    );

    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'delete' }));
    await user.click(
      screen.getByRole('button', { name: 'templates.deleteDialog.confirm' })
    );

    expect(mockErrorToast).toHaveBeenCalledWith({
      title: 'templates.deleteDialog.notifications.errorTitle',
      description: 'templates.deleteDialog.notifications.errorMessage',
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('disables the confirm button while the delete mutation is pending', async () => {
    const user = userEvent.setup();
    useDeleteTemplateMutationMock.mockReturnValue({
      mutate,
      isPending: true,
    });

    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'delete' }));

    expect(
      screen.getByRole('button', { name: 'templates.deleteDialog.confirm' })
    ).toBeDisabled();
  });
});
