import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyActiveToggle from '@/views/vacancies/components/vacancy-active-toggle';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyActiveToggle', () => {
  const onToggle = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders active label when isActive is true', () => {
    render(<VacancyActiveToggle isActive onToggle={onToggle} />);
    expect(
      screen.getByText('vacancies.table.statusOptions.active')
    ).toBeInTheDocument();
  });

  it('renders inactive label when isActive is false', () => {
    render(<VacancyActiveToggle isActive={false} onToggle={onToggle} />);
    expect(
      screen.getByText('vacancies.table.statusOptions.inactive')
    ).toBeInTheDocument();
  });

  it('calls onToggle with false when active toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<VacancyActiveToggle isActive onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('calls onToggle with true when inactive toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<VacancyActiveToggle isActive={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('does not throw when onToggle is undefined and button is clicked', async () => {
    const user = userEvent.setup();
    render(<VacancyActiveToggle isActive={false} />);
    await expect(user.click(screen.getByRole('button'))).resolves.not.toThrow();
  });
});
