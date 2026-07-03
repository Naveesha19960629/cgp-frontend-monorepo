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
const onView = vi.fn();
const onEdit = vi.fn();
const onDelete = vi.fn();
const onMakeACopy = vi.fn();
const onToggleActive = vi.fn();

const sampleRow: VacancyTableColumn = {
  vacancyId: 'f4e3d2c1-b0a9-8f7e-6d5c-4b3a2f1e0d9c',
  title: 'DevOps Engineer - AWS/Kubernetes',
  jobTitle: 'DevOps Engineer',
  discipline: 'Infrastructure',
  careerPath: 'Technical',
  role: 'Individual Contributor',
  createdAt: '2026-05-29T11:15:00.000Z',
  createdAtLabel: 'May 29, 2026',
  createdBy: 'Cloud Operations',
  schedulePublishAt: '2026-05-29T12:00:00.000Z',
  schedulePublishAtLabel: 'May 29, 2026',
  expirationAt: '2026-06-29T23:59:59.000Z',
  expirationAtLabel: 'June 29, 2026',
  applicantCount: 8,
  updatedAt: '2026-05-29T11:15:00.000Z',
  updatedAtLabel: 'May 29, 2026',
  updatedBy: 'Cloud Operations',
  version: 1,
  status: 'ON_HOLD',
  availableActions: ['VIEW', 'EDIT', 'CLOSE'],
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
  const columns = createVacancyColumns({
    sortBy,
    sortOrder,
    onSort,
    onView,
    onEdit,
    onDelete,
    onMakeACopy,
    onToggleActive,
    t,
  });
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
      onView,
      onEdit,
      onDelete,
      onMakeACopy,
      onToggleActive,
      t,
    });
    expect(cols).toHaveLength(17);
  });

  it('includes select and actions columns', () => {
    const cols = createVacancyColumns({
      sortBy: '',
      sortOrder: null,
      onSort,
      onView,
      onEdit,
      onDelete,
      onMakeACopy,
      onToggleActive,
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
    expect(screen.getByText('#F4E3')).toBeInTheDocument();
  });

  it('renders the title cell content', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(
      screen.getByText('DevOps Engineer - AWS/Kubernetes')
    ).toBeInTheDocument();
  });

  it('calls onView when title is clicked', async () => {
    const user = userEvent.setup();
    render(<TableWrapper data={[sampleRow]} />);

    await user.click(screen.getByText('DevOps Engineer - AWS/Kubernetes'));

    expect(onView).toHaveBeenCalledWith(sampleRow.vacancyId);
  });

  it('renders the status badge and active toggle in the status cell', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('active-toggle')).toBeInTheDocument();
  });

  it('renders an inactive toggle for the ONHOLD API enum status', () => {
    render(<TableWrapper data={[{ ...sampleRow, status: 'ONHOLD' }]} />);
    expect(screen.getByTestId('active-toggle')).toHaveTextContent('inactive');
  });

  it('renders an active toggle for LIVE status', () => {
    render(<TableWrapper data={[{ ...sampleRow, status: 'LIVE' }]} />);
    expect(screen.getByTestId('active-toggle')).toHaveTextContent('active');
  });

  it('does not render a toggle for DRAFT status', () => {
    render(<TableWrapper data={[{ ...sampleRow, status: 'DRAFT' }]} />);
    expect(screen.queryByTestId('active-toggle')).not.toBeInTheDocument();
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
