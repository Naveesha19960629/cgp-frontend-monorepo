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

  it('renders all page number buttons with no ellipsis when totalPages < 7', () => {
    render(
      <VacancyTablePagination
        currentPage={0}
        totalPages={4}
        onPageChange={onPageChange}
      />
    );
    for (let i = 1; i <= 4; i++) {
      expect(
        screen.getByRole('button', { name: String(i) })
      ).toBeInTheDocument();
    }
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });

  it('renders all 6 pages individually with no ellipsis regardless of current page', () => {
    render(
      <VacancyTablePagination
        currentPage={3}
        totalPages={6}
        onPageChange={onPageChange}
      />
    );
    for (let i = 1; i <= 6; i++) {
      expect(
        screen.getByRole('button', { name: String(i) })
      ).toBeInTheDocument();
    }
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });

  it('calls onPageChange with the correct 0-based index when a page button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTablePagination
        currentPage={0}
        totalPages={4}
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

  it('renders "1 2 3 ... 8 9 10" on the first page of a 10-page set (DQCGP-3310)', () => {
    render(
      <VacancyTablePagination
        currentPage={0}
        totalPages={10}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '2', '3', '...', '8', '9', '10']);
  });

  it('renders "1 2 3 ... 8 9 10" on the last page of a 10-page set', () => {
    render(
      <VacancyTablePagination
        currentPage={9}
        totalPages={10}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '2', '3', '...', '8', '9', '10']);
  });

  it('collapses to a single pinned page on each side of a centred window for a middle page in a large set', () => {
    render(
      <VacancyTablePagination
        currentPage={9}
        totalPages={20}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '...', '9', '10', '11', '...', '20']);
  });

  it('renders "1 ... 2 3 4 ... 10" on page 3 of a 10-page set', () => {
    render(
      <VacancyTablePagination
        currentPage={2}
        totalPages={10}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '...', '2', '3', '4', '...', '10']);
  });

  it('stays on the fixed 3+3 edge pattern for page 2 (still adjacent to the start boundary)', () => {
    render(
      <VacancyTablePagination
        currentPage={1}
        totalPages={10}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '2', '3', '...', '8', '9', '10']);
  });

  it('absorbs the trailing gap near the end instead of showing a pointless ellipsis (page 8 of 10)', () => {
    render(
      <VacancyTablePagination
        currentPage={7}
        totalPages={10}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '...', '7', '8', '9', '10']);
  });

  it('stays on the fixed 3+3 edge pattern for the second-to-last page', () => {
    render(
      <VacancyTablePagination
        currentPage={8}
        totalPages={10}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '2', '3', '...', '8', '9', '10']);
  });

  it('absorbs a trailing single-page gap instead of showing a pointless ellipsis (page 13 of 15)', () => {
    render(
      <VacancyTablePagination
        currentPage={12}
        totalPages={15}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '...', '12', '13', '14', '15']);
  });

  it('absorbs a trailing 2-page gap instead of showing a pointless ellipsis (page 12 of 15)', () => {
    render(
      <VacancyTablePagination
        currentPage={11}
        totalPages={15}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '...', '11', '12', '13', '14', '15']);
  });

  it('renders "1 ... 5 6 7 8" on page 6 of an 8-page set with no trailing ellipsis', () => {
    render(
      <VacancyTablePagination
        currentPage={5}
        totalPages={8}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '...', '5', '6', '7', '8']);
  });

  it('switches to the 3+3 boundary at exactly 7 pages', () => {
    render(
      <VacancyTablePagination
        currentPage={0}
        totalPages={7}
        onPageChange={onPageChange}
      />
    );
    const labels = screen
      .getAllByText(/^(\d+|\.\.\.)$/)
      .map(el => el.textContent);
    expect(labels).toEqual(['1', '2', '3', '...', '5', '6', '7']);
  });
});
