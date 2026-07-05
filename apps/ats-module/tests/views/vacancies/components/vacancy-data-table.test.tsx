import { render, screen } from '@testing-library/react';
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
});
