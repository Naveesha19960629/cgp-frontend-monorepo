import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacanciesPage from '@/views/vacancies/pages/vacancies-page';

const navigate = vi.fn();
const useUserMock = vi.fn();
const useGendersQueryMock = vi.fn();

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

vi.mock('@/app/contexts/user-context', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useUser: () => useUserMock(),
}));

vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => ({
    keycloak: { authenticated: true },
    initialized: true,
  }),
}));

vi.mock('@/views/vacancies', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useGendersQuery: () => useGendersQueryMock(),
}));

describe('VacanciesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserMock.mockReturnValue({ user: null });
    useGendersQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
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

  it('renders loading and error states from genders query', () => {
    useGendersQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: true,
    });

    render(<VacanciesPage />);

    expect(screen.getByText('notifications.loading.title')).toBeInTheDocument();
    expect(
      screen.getByText('notifications.loading.message')
    ).toBeInTheDocument();
  });

  it('renders welcome message and gender labels when data exists', () => {
    useUserMock.mockReturnValue({
      user: {
        firstName: 'John',
      },
    });

    useGendersQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          items: {
            content: [
              { id: '1', label: 'Male' },
              { id: '2', label: 'Female' },
            ],
          },
        },
      },
    });

    render(<VacanciesPage />);

    expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
  });
});
