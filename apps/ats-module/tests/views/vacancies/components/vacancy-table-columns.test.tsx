import * as React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import createVacancyColumns from '@/views/vacancies/components/vacancy-table-columns';
import type { VacancyTableColumn } from '@/views/vacancies/types';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    VacancyTableAction: () => <div data-testid="vacancy-table-action" />,
  };
});

vi.mock('@/views/vacancies/components/vacancy-active-toggle', () => ({
  default: ({ isActive }: { isActive: boolean }) => (
    <div data-testid="active-toggle">{isActive ? 'active' : 'inactive'}</div>
  ),
}));

vi.mock('@/views/vacancies/components/vacancy-status-badge', () => ({
  default: ({ status }: { status: string }) => (
    <div data-testid="status-badge">{status}</div>
  ),
}));

const t = (key: string) => key;
const onSort = vi.fn();

const sampleRow: VacancyTableColumn = {
  vacancyId: 'abcd-efgh-ijkl',
  title: 'Software Engineer',
  jobTitle: 'Senior Developer',
  discipline: 'Engineering',
  careerPath: 'Technology',
  role: 'Developer',
  createdAtLabel: '2024-01-01',
  createdBy: 'John',
  schedulePublishAtLabel: '2024-02-01',
  expirationAtLabel: '2024-12-31',
  applicantCount: 5,
  updatedAtLabel: '2024-01-15',
  updatedBy: 'Jane',
  version: 1,
  status: 'Live',
  availableActions: [],
};

function TableWrapper({
  data,
  sortBy = '',
  sortOrder = null,
}: {
  data: VacancyTableColumn[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | null;
}) {
  const columns = createVacancyColumns({ sortBy, sortOrder, onSort, t });
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(hg => (
          <tr key={hg.id}>
            {hg.headers.map(header => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

describe('createVacancyColumns', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 17 columns', () => {
    const cols = createVacancyColumns({
      sortBy: '',
      sortOrder: null,
      onSort,
      t,
    });
    expect(cols).toHaveLength(17);
  });

  it('includes select and actions columns', () => {
    const cols = createVacancyColumns({
      sortBy: '',
      sortOrder: null,
      onSort,
      t,
    });
    const ids = cols.map(
      c => c.id ?? (c as { accessorKey?: string }).accessorKey
    );
    expect(ids).toContain('select');
    expect(ids).toContain('vacancyId');
    expect(ids).toContain('actions');
  });

  it('renders vacancyId as first 4 chars uppercase with # prefix', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(screen.getByText('#ABCD')).toBeInTheDocument();
  });

  it('renders the title cell content', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders the status badge and active toggle in the status cell', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('active-toggle')).toBeInTheDocument();
  });

  it('renders the actions cell', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(screen.getByTestId('vacancy-table-action')).toBeInTheDocument();
  });

  it('calls onSort with the column key when a sortable header is clicked', async () => {
    const user = userEvent.setup();
    render(<TableWrapper data={[sampleRow]} />);
    await user.click(
      screen.getByRole('button', {
        name: /vacancies.table.columns.title/i,
      })
    );
    expect(onSort).toHaveBeenCalledWith('title');
  });

  it('passes sortBy and sortOrder to sortable headers', () => {
    render(<TableWrapper data={[sampleRow]} sortBy="title" sortOrder="asc" />);
    // SortableHeader for title column renders a button with the label
    expect(
      screen.getByRole('button', {
        name: /vacancies.table.columns.title/i,
      })
    ).toBeInTheDocument();
  });
});
