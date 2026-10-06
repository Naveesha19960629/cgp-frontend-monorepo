import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyDataTable from '@/views/vacancies/components/vacancy-data-table';

import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

type TestRow = { id: string; name: string };

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { id: 'status', header: 'Status', cell: () => <span>status-cell</span> },
  { id: 'actions', header: '', cell: () => <span>actions-cell</span> },
];

const rows: TestRow[] = [
  { id: 'row-1', name: 'First Row' },
  { id: 'row-2', name: 'Second Row' },
];

function TableWrapper({
  data,
  isLoading,
  onRowClick,
}: {
  data: TestRow[];
  isLoading?: boolean;
  onRowClick?: (row: TestRow) => void;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <VacancyDataTable
      table={table}
      isLoading={isLoading}
      onRowClick={onRowClick}
    />
  );
}

describe('VacancyDataTable', () => {
  it('renders column headers', () => {
    render(<TableWrapper data={rows} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders row cell content when data is provided', () => {
    render(<TableWrapper data={rows} />);
    expect(screen.getByText('row-1')).toBeInTheDocument();
    expect(screen.getByText('First Row')).toBeInTheDocument();
    expect(screen.getByText('row-2')).toBeInTheDocument();
    expect(screen.getByText('Second Row')).toBeInTheDocument();
  });

  it('does not render actual row content when isLoading is true', () => {
    render(<TableWrapper data={rows} isLoading />);
    expect(screen.queryByText('row-1')).not.toBeInTheDocument();
    expect(screen.queryByText('First Row')).not.toBeInTheDocument();
  });

  it('does not render actual row content when data is empty', () => {
    render(<TableWrapper data={[]} />);
    expect(screen.queryByText('row-1')).not.toBeInTheDocument();
  });

  it('still renders headers when data is empty', () => {
    render(<TableWrapper data={[]} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('calls onRowClick when a regular cell is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<TableWrapper data={rows} onRowClick={onRowClick} />);

    await user.click(screen.getByText('First Row'));

    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it('does not call onRowClick when text is selected (drag-to-copy)', () => {
    const onRowClick = vi.fn();
    render(<TableWrapper data={rows} onRowClick={onRowClick} />);

    const cell = screen.getByText('First Row');
    const range = document.createRange();
    range.selectNodeContents(cell);
    globalThis.getSelection()?.removeAllRanges();
    globalThis.getSelection()?.addRange(range);

    fireEvent.click(cell);

    expect(onRowClick).not.toHaveBeenCalled();
    globalThis.getSelection()?.removeAllRanges();
  });

  it('does not call onRowClick when the status cell is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<TableWrapper data={rows} onRowClick={onRowClick} />);

    await user.click(screen.getAllByText('status-cell')[0]);

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('does not call onRowClick when the actions cell is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<TableWrapper data={rows} onRowClick={onRowClick} />);

    await user.click(screen.getAllByText('actions-cell')[0]);

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('applies flexible min-width styles to the title column', () => {
    const titleColumns: ColumnDef<TestRow>[] = [
      { id: 'title', accessorFn: row => row.name, header: 'Title' },
      { accessorKey: 'id', header: 'ID' },
    ];

    function TitleWrapper() {
      const table = useReactTable({
        data: rows,
        columns: titleColumns,
        getCoreRowModel: getCoreRowModel(),
      });
      return <VacancyDataTable table={table} />;
    }

    render(<TitleWrapper />);

    const headerCell = screen.getByText('Title').closest('th');
    expect(headerCell).toHaveStyle({ width: 'auto', position: 'sticky' });

    const bodyCell = screen.getAllByText('First Row')[0].closest('td');
    expect(bodyCell).toHaveStyle({ width: 'auto' });
    expect(bodyCell?.style.position).toBe('');
  });

  it('applies sticky pinned styles and scroll shadows for pinned columns', () => {
    const pinnedColumns: ColumnDef<TestRow>[] = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => <span>actions-cell</span>,
      },
    ];

    function PinnedWrapper() {
      const table = useReactTable({
        data: rows,
        columns: pinnedColumns,
        getCoreRowModel: getCoreRowModel(),
        state: { columnPinning: { left: ['id'], right: ['actions'] } },
        onColumnPinningChange: () => {},
      });
      return <VacancyDataTable table={table} />;
    }

    const { container } = render(<PinnedWrapper />);

    const viewport = container.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement;

    Object.defineProperty(viewport, 'scrollWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(viewport, 'clientWidth', {
      value: 300,
      configurable: true,
    });
    Object.defineProperty(viewport, 'scrollLeft', {
      value: 200,
      configurable: true,
    });

    fireEvent.scroll(viewport);

    const idHeaderCell = screen.getByText('ID').closest('th');
    expect(idHeaderCell).toHaveStyle({ position: 'sticky' });
    expect(idHeaderCell?.style.boxShadow).toBe(
      '10px 0 6px -3px rgba(0,0,0,0.06)'
    );

    const actionsHeaderCell = screen.getByText('Actions').closest('th');
    expect(actionsHeaderCell?.style.boxShadow).toBe(
      '-10px 0 6px -3px rgba(0,0,0,0.06)'
    );
  });

  it('renders empty placeholder cells for grouped column headers', () => {
    const groupedColumns: ColumnDef<TestRow>[] = [
      { accessorKey: 'id', header: 'ID' },
      {
        id: 'group',
        header: 'Group',
        columns: [{ accessorKey: 'name', header: 'Name' }],
      },
    ];

    function GroupedWrapper() {
      const table = useReactTable({
        data: rows,
        columns: groupedColumns,
        getCoreRowModel: getCoreRowModel(),
      });
      return <VacancyDataTable table={table} />;
    }

    const { container } = render(<GroupedWrapper />);

    const headerRows = container.querySelectorAll(
      '[data-slot="table-header"] tr'
    );
    expect(headerRows.length).toBe(2);

    const firstRowCells = Array.from(headerRows[0].querySelectorAll('th'));
    expect(firstRowCells.some(cell => cell.textContent === '')).toBe(true);
  });
});
