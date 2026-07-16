import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacanciesPage from '@/views/vacancies/pages/vacancies-page';

const navigate = vi.fn();
const useVacanciesQueryMock = vi.fn();
const useVacancyTableParamsMock = vi.fn();
const useDeleteVacancyMutationMock = vi.fn();
const useDuplicateVacancyMutationMock = vi.fn();
const useToggleVacancyStatusMutationMock = vi.fn();
const createVacancyColumnsMock = vi.fn(() => []);
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

const defaultParams = {
  page: 0,
  size: 12,
  sortBy: '',
  sortOrder: null,
  search: '',
  careerPath: '',
  discipline: '',
  status: '',
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
    useVacanciesQuery: () => useVacanciesQueryMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useVacancyTableParams: () => useVacancyTableParamsMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useDeleteVacancyMutation: () => useDeleteVacancyMutationMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useDuplicateVacancyMutation: () => useDuplicateVacancyMutationMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useToggleVacancyStatusMutation: () => useToggleVacancyStatusMutationMock(),
    VacancyDataTable: () => <div data-testid="vacancy-data-table" />,
    VacancyFilteringSection: () => (
      <div data-testid="vacancy-filtering-section" />
    ),
    VacancyTableEmptyState: () => (
      <div data-testid="vacancy-table-empty-state" />
    ),
    VacancyTablePagination: () => (
      <div data-testid="vacancy-table-pagination" />
    ),
    createVacancyColumns: (options: unknown) =>
      createVacancyColumnsMock(options) as never,
  };
});

describe('VacanciesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVacanciesQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    useVacancyTableParamsMock.mockReturnValue([defaultParams, vi.fn()]);
    useDeleteVacancyMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    useDuplicateVacancyMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    useToggleVacancyStatusMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('shows a blocking overlay while a vacancy is being duplicated', () => {
    useDuplicateVacancyMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    render(<VacanciesPage />);

    expect(
      screen.getByText('vacancies.duplicateVacancy.inProgress')
    ).toBeInTheDocument();
    // Overlay div and its Spinner both expose role="status"
    expect(screen.getAllByRole('status')).not.toHaveLength(0);
  });

  it('does not render the duplicate overlay when no duplication is pending', () => {
    render(<VacanciesPage />);

    expect(
      screen.queryByText('vacancies.duplicateVacancy.inProgress')
    ).not.toBeInTheDocument();
  });

  it('renders page heading and create vacancy button when data exists', () => {
    useVacanciesQueryMock.mockReturnValue({
      isLoading: false,
      data: { data: { content: [{ id: '1' }], totalPages: 1 } },
    });

    render(<VacanciesPage />);

    expect(screen.getByText('vacancies.title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'vacancies.createVacancyButton' })
    ).toBeInTheDocument();
  });

  it('hides create vacancy button and filters when no data and no active filters', () => {
    render(<VacanciesPage />);

    expect(screen.getByText('vacancies.title')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'vacancies.createVacancyButton' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('vacancy-filtering-section')
    ).not.toBeInTheDocument();
  });

  it('navigates to create vacancy route when create button is clicked', async () => {
    const user = userEvent.setup();

    useVacanciesQueryMock.mockReturnValue({
      isLoading: false,
      data: { data: { content: [{ id: '1' }], totalPages: 1 } },
    });

    render(<VacanciesPage />);

    await user.click(
      screen.getByRole('button', { name: 'vacancies.createVacancyButton' })
    );

    expect(navigate).toHaveBeenCalledWith('/dashboard/ats/vacancies/new');
  });

  it('shows empty state when not loading and no vacancies exist', () => {
    useVacanciesQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    render(<VacanciesPage />);

    expect(screen.getByTestId('vacancy-table-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('vacancy-data-table')).not.toBeInTheDocument();
  });

  it('shows data table when vacancies data has content', () => {
    useVacanciesQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          content: [{ id: '1' }],
          totalPages: 1,
        },
      },
    });

    render(<VacanciesPage />);

    expect(screen.getByTestId('vacancy-data-table')).toBeInTheDocument();
    expect(
      screen.queryByTestId('vacancy-table-empty-state')
    ).not.toBeInTheDocument();
  });

  describe('copy vacancy link', () => {
    const getOnCopyLink = () => {
      const options = createVacancyColumnsMock.mock.calls.at(-1)?.[0] as {
        onCopyLink: (vacancyLink: string) => void;
      };
      return options.onCopyLink;
    };

    it('copies the vacancy link and shows a success toast', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });

      render(<VacanciesPage />);
      getOnCopyLink()(
        'http://localhost:5173/jobs/85f9b624-ee93-46d0-b8d6-5cea49a8597a'
      );

      await waitFor(() => expect(mockSuccessToast).toHaveBeenCalled());
      expect(writeText).toHaveBeenCalledWith(
        'http://localhost:5173/jobs/85f9b624-ee93-46d0-b8d6-5cea49a8597a'
      );
      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'vacancies.copyLink.notifications.successTitle',
        description: 'vacancies.copyLink.notifications.successMessage',
      });
    });

    it('shows an error toast when the clipboard write fails', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denied'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });

      render(<VacanciesPage />);
      getOnCopyLink()('http://localhost:5173/jobs/abc');

      await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
      expect(mockErrorToast).toHaveBeenCalledWith({
        title: 'vacancies.copyLink.notifications.errorTitle',
        description: 'vacancies.copyLink.notifications.errorMessage',
      });
    });

    it('shows an error toast without touching the clipboard when vacancyLink is empty', () => {
      const writeText = vi.fn();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });

      render(<VacanciesPage />);
      getOnCopyLink()('');

      expect(writeText).not.toHaveBeenCalled();
      expect(mockErrorToast).toHaveBeenCalledWith({
        title: 'vacancies.copyLink.notifications.errorTitle',
        description: 'vacancies.copyLink.notifications.errorMessage',
      });
    });
  });
});
