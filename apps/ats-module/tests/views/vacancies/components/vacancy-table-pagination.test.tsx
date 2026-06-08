import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyTablePagination from '@/views/vacancies/components/vacancy-table-pagination';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyTablePagination', () => {
  const onPageChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('disables the back button on the first page', () => {
    render(
      <VacancyTablePagination
        currentPage={0}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );
    expect(
      screen.getByText('vacancies.table.pagination.back').closest('button')
    ).toBeDisabled();
  });

  it('disables the next button on the last page', () => {
    render(
      <VacancyTablePagination
        currentPage={4}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );
    expect(
      screen.getByText('vacancies.table.pagination.next').closest('button')
    ).toBeDisabled();
  });

  it('enables both buttons on a middle page', () => {
    render(
      <VacancyTablePagination
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );
    expect(
      screen.getByText('vacancies.table.pagination.back').closest('button')
    ).not.toBeDisabled();
    expect(
      screen.getByText('vacancies.table.pagination.next').closest('button')
    ).not.toBeDisabled();
  });

  it('calls onPageChange with currentPage - 1 when back is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTablePagination
        currentPage={3}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );
    await user.click(
      screen.getByText('vacancies.table.pagination.back').closest('button')!
    );
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with currentPage + 1 when next is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTablePagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );
    await user.click(
      screen.getByText('vacancies.table.pagination.next').closest('button')!
    );
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders all page number buttons when totalPages <= 7', () => {
    render(
      <VacancyTablePagination
        currentPage={0}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );
    for (let i = 1; i <= 5; i++) {
      expect(
        screen.getByRole('button', { name: String(i) })
      ).toBeInTheDocument();
    }
  });

  it('calls onPageChange with the correct 0-based index when a page button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTablePagination
        currentPage={0}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders ellipsis for page counts > 7', () => {
    render(
      <VacancyTablePagination
        currentPage={5}
        totalPages={20}
        onPageChange={onPageChange}
      />
    );
    expect(screen.getAllByText('...')).not.toHaveLength(0);
  });

  it('always renders the first and last page buttons when totalPages > 7', () => {
    render(
      <VacancyTablePagination
        currentPage={5}
        totalPages={20}
        onPageChange={onPageChange}
      />
    );
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
  });
});
