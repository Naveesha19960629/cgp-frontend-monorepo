import { render, screen } from '@testing-library/react';

import VacancySearchEmptyState from '@/views/vacancies/components/vacancy-search-empty-state';
import { TABLE_PAGE_SIZE } from '@/views/vacancies/utils';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancySearchEmptyState', () => {
  it('renders the empty state title', () => {
    render(<VacancySearchEmptyState />);
    expect(
      screen.getByText('vacancies.searchEmptyState.title')
    ).toBeInTheDocument();
  });

  it('renders both lines of the empty state description', () => {
    const { container } = render(<VacancySearchEmptyState />);
    expect(container.textContent).toContain(
      'vacancies.searchEmptyState.descriptionLine1'
    );
    expect(container.textContent).toContain(
      'vacancies.searchEmptyState.descriptionLine2'
    );
  });

  it('renders the skeleton table header with the fixed and dynamic columns', () => {
    const { container } = render(<VacancySearchEmptyState />);
    const headerCells = container.querySelectorAll('thead th');
    // 2 fixed columns + 7 generated skeleton columns
    expect(headerCells).toHaveLength(9);
  });

  it('renders one skeleton row per configured table page size', () => {
    const { container } = render(<VacancySearchEmptyState />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(TABLE_PAGE_SIZE);
  });

  it('adds a bottom border to every row except the last one', () => {
    const { container } = render(<VacancySearchEmptyState />);
    const rows = container.querySelectorAll('tbody tr');
    const firstRowFirstCell = rows[0].querySelector('td');
    const lastRowFirstCell = rows[rows.length - 1].querySelector('td');

    expect(firstRowFirstCell).toHaveClass('border-b');
    expect(lastRowFirstCell).not.toHaveClass('border-b');
  });
});
