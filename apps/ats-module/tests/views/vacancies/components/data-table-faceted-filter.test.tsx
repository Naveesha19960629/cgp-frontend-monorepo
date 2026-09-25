import { useState } from 'react';

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

// DQCGP-4310 — ATS NFR-024 on the vacancy list filters (Career Path,
// Discipline, Status), with the real Radix Popover and cmdk.
function KeyboardHarness({
  hideSearch = false,
  initial = ['opt-1', 'opt-2'],
}: {
  hideSearch?: boolean;
  initial?: string[];
}) {
  const [selected, setSelected] = useState(initial);
  const [search, setSearch] = useState('');
  return (
    <>
      <DataTableFacetedFilter
        title="Career Path"
        options={OPTIONS}
        selectedValues={selected}
        onSelectionChange={setSelected}
        {...(hideSearch
          ? { hideSearch: true }
          : { searchValue: search, onSearchChange: setSearch })}
      />
      <span data-testid="selected">{selected.join(',')}</span>
    </>
  );
}

const filterButton = () => screen.getByRole('button', { name: 'Career Path' });
const selectedValues = () => screen.getByTestId('selected');
const expectNothingTicked = () => {
  for (const option of screen.getAllByRole('option')) {
    expect(option.querySelector('svg')).toBeNull();
  }
};

describe('DataTableFacetedFilter — Backspace / Delete', () => {
  it.each(['{Backspace}', '{Delete}'])(
    'clears the whole filter with %s on the focused, closed button',
    async key => {
      const user = userEvent.setup();
      render(<KeyboardHarness />);

      filterButton().focus();
      await user.keyboard(key);

      expect(selectedValues()).toBeEmptyDOMElement();
      expect(filterButton()).toHaveFocus();
      expect(screen.getByRole('status')).toHaveTextContent(
        'vacancies.table.filter.cleared'
      );
    }
  );

  it('does nothing on the button while the filter is empty', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <DataTableFacetedFilter
        title="Career Path"
        options={OPTIONS}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );

    filterButton().focus();
    await user.keyboard('{Delete}');

    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('erases the search one character at a time with Backspace, keeping the filter', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness />);

    await user.click(filterButton());
    await user.type(screen.getByRole('combobox'), 'eng');
    await user.keyboard('{Backspace}');

    expect(screen.getByRole('combobox')).toHaveValue('en');
    expect(selectedValues()).toHaveTextContent('opt-1,opt-2');
  });

  it('clears the whole filter with Delete once the search is empty, keeping the list open', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness />);

    await user.click(filterButton());
    expect(screen.getByRole('combobox')).toHaveFocus();
    await user.keyboard('{Delete}');

    expect(selectedValues()).toBeEmptyDOMElement();
    expect(
      screen.getByRole('dialog', { name: 'Career Path' })
    ).toBeInTheDocument();
    expectNothingTicked();
  });

  it('clears after Backspace has erased the whole search', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness />);

    await user.click(filterButton());
    await user.type(screen.getByRole('combobox'), 'e');
    await user.keyboard('{Backspace}');
    expect(selectedValues()).toHaveTextContent('opt-1,opt-2');
    await user.keyboard('{Backspace}');

    expect(selectedValues()).toBeEmptyDOMElement();
  });

  it('still picks one option at a time with Enter', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness initial={[]} />);

    await user.click(filterButton());
    await user.keyboard('{ArrowDown}{Enter}');

    expect(selectedValues()).toHaveTextContent('opt-1');
  });
});

describe('DataTableFacetedFilter — Status (no search box) from the keyboard', () => {
  it('focuses the list on open, so the arrows and Enter work', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness hideSearch initial={[]} />);

    filterButton().focus();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toHaveAttribute('cmdk-root');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(selectedValues()).toHaveTextContent('opt-1');
  });

  it('clears the whole filter with Delete from the open list', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness hideSearch />);

    filterButton().focus();
    await user.keyboard('{Enter}{Delete}');

    expect(selectedValues()).toBeEmptyDOMElement();
    expectNothingTicked();
  });

  it('returns focus to the button on Escape', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness hideSearch />);

    filterButton().focus();
    await user.keyboard('{Enter}{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(filterButton()).toHaveFocus();
  });
});

describe('DataTableFacetedFilter — visible highlight (WCAG 2.4.7)', () => {
  /** The option cmdk has active, if the list draws it. */
  const drawnHighlight = () =>
    screen
      .getAllByRole('option')
      .find(
        option =>
          option.getAttribute('data-selected') === 'true' &&
          option.classList.contains('data-[selected=true]:bg-accent')
      );

  it('draws no highlight before the user moves it, and Enter waits for one', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness initial={[]} />);

    await user.click(filterButton());
    expect(drawnHighlight()).toBeUndefined();
    await user.keyboard('{Enter}');

    expect(selectedValues()).toBeEmptyDOMElement();
  });

  it('draws the highlight where the arrow keys move it', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness initial={[]} />);

    await user.click(filterButton());
    await user.keyboard('{ArrowDown}');
    expect(drawnHighlight()).toHaveTextContent('Option One');
    await user.keyboard('{ArrowDown}');
    expect(drawnHighlight()).toHaveTextContent('Option Two');

    await user.keyboard('{Enter}');
    expect(selectedValues()).toHaveTextContent('opt-2');
  });

  it('hides the highlight again once the user types', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness initial={[]} />);

    await user.click(filterButton());
    await user.keyboard('{ArrowDown}o');

    expect(drawnHighlight()).toBeUndefined();
  });

  it('draws it in the Status list, which has no search box', async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness hideSearch initial={[]} />);

    filterButton().focus();
    await user.keyboard('{Enter}{ArrowDown}');

    expect(drawnHighlight()).toHaveTextContent('Option One');
  });
});
