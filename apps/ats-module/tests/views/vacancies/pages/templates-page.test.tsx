import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TemplatesPage from '@/views/vacancies/pages/templates-page';
import { TABLE_PAGE_SIZE } from '@/views/vacancies/utils';

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
    TemplatesToolbar: ({
      onSearchChange,
      onSortOrderChange,
    }: {
      onSearchChange: (value: string) => void;
      onSortOrderChange: (value: string) => void;
    }) => (
      <div data-testid="templates-toolbar">
        <button type="button" onClick={() => onSearchChange('foo')}>
          change-search
        </button>
        <button type="button" onClick={() => onSortOrderChange('OLDEST')}>
          change-sort
        </button>
      </div>
    ),
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
      onEdit,
      onUse,
    }: {
      template: { vacancyTemplateId: string };
      onDelete: (id: string) => void;
      onEdit: (id: string) => void;
      onUse: (id: string) => void;
    }) => (
      <div data-testid="template-card">
        <button
          type="button"
          onClick={() => onDelete(template.vacancyTemplateId)}
        >
          delete
        </button>
        <button type="button" onClick={() => onEdit(template.vacancyTemplateId)}>
          edit
        </button>
        <button type="button" onClick={() => onUse(template.vacancyTemplateId)}>
          use
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
  const setParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useVacancyTemplatesQueryMock.mockReturnValue({
      data: { data: { content: [mockTemplate], totalPages: 1 } },
      isLoading: false,
    });
    useVacancyTemplatesTableParamsMock.mockReturnValue([
      defaultParams,
      setParams,
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

  it('navigates to the edit route when a template edit action is triggered', async () => {
    const user = userEvent.setup();
    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'edit' }));

    expect(navigate).toHaveBeenCalledWith(
      '/dashboard/ats/templates/template-1/edit'
    );
  });

  it('navigates to the use-template route with the origin state when a template use action is triggered', async () => {
    const user = userEvent.setup();
    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'use' }));

    expect(navigate).toHaveBeenCalledWith(
      '/dashboard/ats/vacancies/from-template/template-1',
      { state: { from: '/dashboard/ats/templates' } }
    );
  });

  it('resets to the previous page when deleting the last item on a page beyond the first', async () => {
    const user = userEvent.setup();
    useVacancyTemplatesTableParamsMock.mockReturnValue([
      { ...defaultParams, page: 2 },
      setParams,
    ]);
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

    expect(setParams).toHaveBeenCalledWith({ page: 1 });
  });

  it('renders skeleton placeholders while templates are being fetched', () => {
    useVacancyTemplatesQueryMock.mockReturnValue({
      data: undefined,
      isFetching: true,
    });

    render(<TemplatesPage />);

    expect(screen.getAllByRole('article')).toHaveLength(8);
    expect(screen.queryByTestId('template-card')).not.toBeInTheDocument();
  });

  it('shows the search empty state when a search is active and no templates match', () => {
    useVacancyTemplatesQueryMock.mockReturnValue({
      data: { data: { content: [], totalPages: 0 } },
      isFetching: false,
    });
    useVacancyTemplatesTableParamsMock.mockReturnValue([
      { ...defaultParams, search: 'foo' },
      setParams,
    ]);

    render(<TemplatesPage />);

    expect(
      screen.getByTestId('template-search-empty-state')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('template-empty-state')).not.toBeInTheDocument();
  });

  it('updates the sort order and resets to page one', async () => {
    const user = userEvent.setup();
    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'change-sort' }));

    expect(setParams).toHaveBeenCalledWith({ sortOrder: 'OLDEST', page: 1 });
  });

  it('resets filters and clears the reload marker when reopened after a page reload', () => {
    sessionStorage.setItem('templates_page_loaded', '1');

    render(<TemplatesPage />);

    expect(setParams).toHaveBeenCalledWith({
      page: 1,
      size: TABLE_PAGE_SIZE,
      search: '',
      sortOrder: 'NEWEST',
    });
    expect(sessionStorage.getItem('templates_page_loaded')).toBeNull();
  });

  it('does not reset filters on a fresh (non-reload) session', () => {
    render(<TemplatesPage />);

    expect(setParams).not.toHaveBeenCalled();
  });

  it('marks the session on beforeunload so a subsequent reload can reset filters', () => {
    render(<TemplatesPage />);

    window.dispatchEvent(new Event('beforeunload'));

    expect(sessionStorage.getItem('templates_page_loaded')).toBe('1');
  });
});
