import type { ReactNode } from 'react';

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

// Radix Tooltip relies on pointer geometry that jsdom does not implement, so
// (matching the existing pattern in job-requirements-step.test.tsx) the
// trigger/content are rendered unconditionally instead of simulating hover.
vi.mock('@cgp/ui-kit/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    VacancyTableAction: ({ onCopyLink }: { onCopyLink?: () => void }) => (
      <div data-testid="vacancy-table-action">
        <button type="button" onClick={onCopyLink}>
          copy-link
        </button>
      </div>
    ),
  };
});

vi.mock('@/views/vacancies/components/vacancy-active-toggle', () => ({
  default: ({
    isActive,
    disabled,
  }: {
    isActive: boolean;
    disabled?: boolean;
  }) => (
    <div
      data-testid="active-toggle"
      data-disabled={disabled ? 'true' : 'false'}
    >
      {isActive ? 'active' : 'inactive'}
    </div>
  ),
}));

vi.mock('@/views/vacancies/components/vacancy-status-badge', () => ({
  default: ({
    status,
    applicantCount,
  }: {
    status: string;
    applicantCount?: number;
  }) => (
    <div data-testid="status-badge" data-applicant-count={applicantCount}>
      {status}
    </div>
  ),
}));

const t = (key: string, options?: { count?: number }) =>
  options?.count !== undefined ? `${key}:${options.count}` : key;
const onSort = vi.fn();
const onView = vi.fn();
const onEdit = vi.fn();
const onDelete = vi.fn();
const onMakeACopy = vi.fn();
const onSaveAsTemplate = vi.fn();
const onToggleActive = vi.fn();
const onCopyLink = vi.fn();

const sampleRow: VacancyTableColumn = {
  vacancyId: 'f4e3d2c1-b0a9-8f7e-6d5c-4b3a2f1e0d9c',
  title: 'DevOps Engineer - AWS/Kubernetes',
  jobTitle: ['DevOps Engineer'],
  discipline: 'Infrastructure',
  careerPath: 'Technical',
  role: ['Individual Contributor'],
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
  vacancyLink:
    'http://localhost:5173/jobs/f4e3d2c1-b0a9-8f7e-6d5c-4b3a2f1e0d9c',
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
    onSaveAsTemplate,
    onToggleActive,
    onCopyLink,
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
      onSaveAsTemplate,
      onToggleActive,
      onCopyLink,
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
      onSaveAsTemplate,
      onToggleActive,
      onCopyLink,
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

  it('truncates a long title with an ellipsis and shows the full text via a title attribute (DQCGP-3308)', () => {
    const longTitle =
      'Software Engineer Intern - Cloud Infrastructure and Platform Reliability Team';
    render(<TableWrapper data={[{ ...sampleRow, title: longTitle }]} />);

    const titleButton = screen.getByText(longTitle);
    expect(titleButton).toHaveClass('truncate');
    expect(titleButton).toHaveAttribute('title', longTitle);
  });

  it('renders a single configured job title as plain text (DQCGP-3838)', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(screen.getByText('DevOps Engineer')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /job title/i })
    ).not.toBeInTheDocument();
  });

  it('renders a single configured role as plain text (DQCGP-3838)', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(screen.getByText('Individual Contributor')).toBeInTheDocument();
  });

  it('renders a count trigger with all job titles accessible via tooltip when multiple are configured (DQCGP-3838)', () => {
    render(
      <TableWrapper
        data={[
          {
            ...sampleRow,
            jobTitle: ['Software Engineer', 'Senior Software Engineer'],
          },
        ]}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'vacancies.table.multiValue.jobTitlesCount:2',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
  });

  it('renders a count trigger with all roles accessible via tooltip when multiple are configured (DQCGP-3838)', () => {
    render(
      <TableWrapper
        data={[
          {
            ...sampleRow,
            role: ['Individual Contributor', 'Team Lead'],
          },
        ]}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'vacancies.table.multiValue.rolesCount:2',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Individual Contributor')).toBeInTheDocument();
    expect(screen.getByText('Team Lead')).toBeInTheDocument();
  });

  it('does not crash and renders the value when jobTitle/role come back as a legacy plain string (pre-DQCGP-3838 API shape)', () => {
    render(
      <TableWrapper
        data={[
          {
            ...sampleRow,
            jobTitle: 'DevOps Engineer' as unknown as string[],
            role: 'Individual Contributor' as unknown as string[],
          },
        ]}
      />
    );

    expect(screen.getAllByText('DevOps Engineer')).not.toHaveLength(0);
    expect(screen.getAllByText('Individual Contributor')).not.toHaveLength(0);
  });

  it('renders an empty job title cell without crashing when the field is missing entirely', () => {
    render(
      <TableWrapper
        data={[
          {
            ...sampleRow,
            jobTitle: null as unknown as string[],
            role: undefined as unknown as string[],
          },
        ]}
      />
    );

    expect(
      screen.queryByRole('button', { name: /job title/i })
    ).not.toBeInTheDocument();
  });

  it('renders the status badge and active toggle in the status cell', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('active-toggle')).toBeInTheDocument();
  });

  it('passes the row applicantCount to the status badge (DQCGP-3194)', () => {
    render(<TableWrapper data={[{ ...sampleRow, applicantCount: 5 }]} />);
    expect(screen.getByTestId('status-badge')).toHaveAttribute(
      'data-applicant-count',
      '5'
    );
  });

  it('renders an inactive toggle for the ONHOLD API enum status', () => {
    render(<TableWrapper data={[{ ...sampleRow, status: 'ONHOLD' }]} />);
    expect(screen.getByTestId('active-toggle')).toHaveTextContent('inactive');
  });

  it('renders an active toggle for LIVE status', () => {
    render(<TableWrapper data={[{ ...sampleRow, status: 'LIVE' }]} />);
    expect(screen.getByTestId('active-toggle')).toHaveTextContent('active');
  });

  it('renders an enabled toggle for LIVE and ONHOLD statuses', () => {
    const { rerender } = render(
      <TableWrapper data={[{ ...sampleRow, status: 'LIVE' }]} />
    );
    expect(screen.getByTestId('active-toggle')).toHaveAttribute(
      'data-disabled',
      'false'
    );

    rerender(<TableWrapper data={[{ ...sampleRow, status: 'ONHOLD' }]} />);
    expect(screen.getByTestId('active-toggle')).toHaveAttribute(
      'data-disabled',
      'false'
    );
  });

  it('renders a disabled toggle for non Live/On hold statuses', () => {
    for (const status of ['DRAFT', 'UNPUBLISHED', 'EXPIRED']) {
      const { unmount } = render(
        <TableWrapper data={[{ ...sampleRow, status }]} />
      );
      const toggle = screen.getByTestId('active-toggle');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('data-disabled', 'true');
      unmount();
    }
  });

  it('renders the actions cell', () => {
    render(<TableWrapper data={[sampleRow]} />);
    expect(screen.getByTestId('vacancy-table-action')).toBeInTheDocument();
  });

  it('calls onCopyLink with the row vacancyLink when the copy link action is triggered', async () => {
    const user = userEvent.setup();
    render(<TableWrapper data={[sampleRow]} />);

    await user.click(screen.getByText('copy-link'));

    expect(onCopyLink).toHaveBeenCalledWith(sampleRow.vacancyLink);
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
