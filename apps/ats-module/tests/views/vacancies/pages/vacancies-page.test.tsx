import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacanciesPage from '@/views/vacancies/pages/vacancies-page';

const navigate = vi.fn();
const useVacanciesQueryMock = vi.fn();
const useVacancyTableParamsMock = vi.fn();

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

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useVacanciesQuery: () => useVacanciesQueryMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useVacancyTableParams: () => useVacancyTableParamsMock(),
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
    createVacancyColumns: () => [],
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
  });

  it('renders page heading and create vacancy button', () => {
    render(<VacanciesPage />);

    expect(screen.getByText('vacancies.title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'vacancies.createVacancyButton' })
    ).toBeInTheDocument();
  });

  it('navigates to create vacancy route when create button is clicked', async () => {
    const user = userEvent.setup();

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
});
