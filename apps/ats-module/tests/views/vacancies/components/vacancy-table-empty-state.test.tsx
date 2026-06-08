import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyTableEmptyState from '@/views/vacancies/components/vacancy-table-empty-state';

const navigate = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

describe('VacancyTableEmptyState', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the empty state title', () => {
    render(<VacancyTableEmptyState />);
    expect(screen.getByText('vacancies.emptyState.title')).toBeInTheDocument();
  });

  it('renders the empty state description', () => {
    render(<VacancyTableEmptyState />);
    expect(
      screen.getByText('vacancies.emptyState.description')
    ).toBeInTheDocument();
  });

  it('renders the create vacancy button', () => {
    render(<VacancyTableEmptyState />);
    expect(
      screen.getByRole('button', { name: /vacancies.createVacancyButton/i })
    ).toBeInTheDocument();
  });

  it('navigates to the new vacancy route when the button is clicked', async () => {
    const user = userEvent.setup();
    render(<VacancyTableEmptyState />);
    await user.click(
      screen.getByRole('button', { name: /vacancies.createVacancyButton/i })
    );
    expect(navigate).toHaveBeenCalledWith('/dashboard/ats/vacancies/new');
  });
});
