import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NewVacancyPage from '@/views/vacancies/pages/new-vacancy-page';

const navigate = vi.fn();

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
    VacancyCreateStepperForm: () => <div>Mock Vacancy Stepper</div>,
  };
});

describe('NewVacancyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders vacancy title step initially', () => {
    render(<NewVacancyPage />);

    expect(
      screen.getByText('vacancies.createVacancy.heading')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('vacancies.createVacancy.titlePlaceholder')
    ).toBeInTheDocument();
    expect(screen.queryByText('Mock Vacancy Stepper')).not.toBeInTheDocument();
  });

  it('shows validation message when title is empty and next is clicked', async () => {
    const user = userEvent.setup();

    render(<NewVacancyPage />);

    await user.click(
      screen.getByRole('button', { name: 'vacancies.createVacancy.nextButton' })
    );

    expect(
      screen.getByText('vacancies.createVacancy.titleRequired')
    ).toBeInTheDocument();
  });

  it('navigates back to vacancy list when cancel is clicked', async () => {
    const user = userEvent.setup();

    render(<NewVacancyPage />);

    await user.click(
      screen.getByRole('button', {
        name: 'vacancies.createVacancy.cancelButton',
      })
    );

    expect(navigate).toHaveBeenCalledWith('/dashboard/ats/vacancies');
  });

  it('goes to stepper view after entering a title and clicking next', async () => {
    const user = userEvent.setup();

    render(<NewVacancyPage />);

    await user.type(
      screen.getByPlaceholderText('vacancies.createVacancy.titlePlaceholder'),
      'Frontend Engineer'
    );

    await user.click(
      screen.getByRole('button', { name: 'vacancies.createVacancy.nextButton' })
    );

    expect(screen.getByText('Mock Vacancy Stepper')).toBeInTheDocument();
  });
});
