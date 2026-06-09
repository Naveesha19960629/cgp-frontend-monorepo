import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DataTableFacetedFilter from '@/views/vacancies/components/data-table-faceted-filter';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const OPTIONS = [
  { value: 'opt-1', label: 'Option One' },
  { value: 'opt-2', label: 'Option Two' },
];

describe('DataTableFacetedFilter', () => {
  const onSelectionChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders the trigger button with the given title', () => {
    render(
      <DataTableFacetedFilter
        title="Career Path"
        options={OPTIONS}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    expect(
      screen.getByRole('button', { name: /career path/i })
    ).toBeInTheDocument();
  });

  it('shows options after the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTableFacetedFilter
        title="Status"
        options={OPTIONS}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /status/i }));
    expect(screen.getByText('Option One')).toBeInTheDocument();
    expect(screen.getByText('Option Two')).toBeInTheDocument();
  });

  it('calls onSelectionChange with the selected value when an option is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTableFacetedFilter
        title="Status"
        options={OPTIONS}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /status/i }));
    await user.click(screen.getByText('Option One'));
    expect(onSelectionChange).toHaveBeenCalledWith(['opt-1']);
  });

  it('deselects an already-selected option', async () => {
    const user = userEvent.setup();
    render(
      <DataTableFacetedFilter
        title="Status"
        options={OPTIONS}
        selectedValues={['opt-1']}
        onSelectionChange={onSelectionChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /status/i }));
    await user.click(screen.getByText('Option One'));
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('shows the search input by default', async () => {
    const user = userEvent.setup();
    render(
      <DataTableFacetedFilter
        title="Status"
        options={OPTIONS}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /status/i }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('hides the search input when hideSearch is true', async () => {
    const user = userEvent.setup();
    render(
      <DataTableFacetedFilter
        title="Status"
        options={OPTIONS}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
        hideSearch
      />
    );
    await user.click(screen.getByRole('button', { name: /status/i }));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows loading text in the empty state when isLoading is true', async () => {
    const user = userEvent.setup();
    render(
      <DataTableFacetedFilter
        title="Status"
        options={[]}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
        isLoading
      />
    );
    await user.click(screen.getByRole('button', { name: /status/i }));
    expect(
      screen.getByText('vacancies.table.filter.loading')
    ).toBeInTheDocument();
  });

  it('shows no-results text when options are empty and not loading', async () => {
    const user = userEvent.setup();
    render(
      <DataTableFacetedFilter
        title="Status"
        options={[]}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /status/i }));
    expect(
      screen.getByText('vacancies.table.filter.noResults')
    ).toBeInTheDocument();
  });

  it('calls onSearchChange when the search input value changes', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <DataTableFacetedFilter
        title="Career Path"
        options={OPTIONS}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
        searchValue=""
        onSearchChange={onSearchChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /career path/i }));
    await user.type(screen.getByRole('combobox'), 'eng');
    expect(onSearchChange).toHaveBeenCalled();
  });
});
