import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyDataTable from '@/views/vacancies/components/vacancy-data-table';
import createVacancyColumns from '@/views/vacancies/components/vacancy-table-columns';
import type { VacancyTableColumn } from '@/views/vacancies/types';

import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

// DQCGP-4542 / Figma: the vacancy table shows a hover message for a vacancy
// with several Job Titles, several Roles, and for its (truncated) Title.
// Unlike the cell-level tests, this uses the REAL Radix tooltip inside the real
// table, so it proves the message actually opens on hover and closes again.

vi.mock('@/views/vacancies', () => ({ VacancyTableAction: () => null }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const t = (key: string, options?: { count?: number }) =>
  options?.count === undefined ? key : `${key}:${options.count}`;

const baseRow = {
  vacancyId: 'vacancy-1',
  title: 'Data Analyst - SQL, Excel, HTML, CSS, JS',
  jobTitle: ['Software Engineer', 'Senior Software Engineer', 'Career Path'],
  role: ['Software Engineer', 'Back End Engineer'],
  discipline: 'IT',
  careerPath: 'Software Engineering',
  status: 'Live',
  availableActions: [],
  applicantCount: 0,
} as unknown as VacancyTableColumn;

function Harness({ rows }: Readonly<{ rows: VacancyTableColumn[] }>) {
  const table = useReactTable({
    data: rows,
    columns: createVacancyColumns({
      sortBy: '',
      sortOrder: null,
      onSort: vi.fn(),
      onView: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onMakeACopy: vi.fn(),
      onSaveAsTemplate: vi.fn(),
      onToggleActive: vi.fn(),
      onCopyLink: vi.fn(),
      t,
    }),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    state: {
      columnPinning: {
        left: ['select', 'vacancyId'],
        right: ['status', 'actions'],
      },
    },
  });

  return <VacancyDataTable table={table} isLoading={false} />;
}

// Radix renders the content twice (visible bubble + a visually-hidden
// role="tooltip" copy for screen readers), so assert on the tooltip role.
const tooltip = () => screen.findByRole('tooltip');

describe('vacancy table hover messages (DQCGP-4542)', () => {
  it('lists every Job Title when hovering "N Job Titles"', async () => {
    const user = userEvent.setup();
    render(<Harness rows={[baseRow]} />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(
      screen.getByRole('button', {
        name: 'vacancies.table.multiValue.jobTitlesCount:3',
      })
    );

    const bubble = await tooltip();
    expect(bubble).toHaveTextContent('Software Engineer');
    expect(bubble).toHaveTextContent('Senior Software Engineer');
    expect(bubble).toHaveTextContent('Career Path');
  });

  it('lists every Role when hovering "N Job Roles"', async () => {
    const user = userEvent.setup();
    render(<Harness rows={[baseRow]} />);

    await user.hover(
      screen.getByRole('button', {
        name: 'vacancies.table.multiValue.rolesCount:2',
      })
    );

    const bubble = await tooltip();
    expect(bubble).toHaveTextContent('Software Engineer');
    expect(bubble).toHaveTextContent('Back End Engineer');
  });

  it('shows the full Title when hovering the Title cell', async () => {
    const user = userEvent.setup();
    render(<Harness rows={[baseRow]} />);

    await user.hover(screen.getByRole('button', { name: baseRow.title }));

    expect(await tooltip()).toHaveTextContent(baseRow.title);
  });

  it('can be dismissed with Escape', async () => {
    const user = userEvent.setup();
    render(<Harness rows={[baseRow]} />);

    await user.hover(
      screen.getByRole('button', {
        name: 'vacancies.table.multiValue.jobTitlesCount:3',
      })
    );
    await tooltip();
    await user.keyboard('{Escape}');

    // (Closing on pointer-leave relies on Radix's hover grace-area geometry,
    // which jsdom does not implement, so dismissal is asserted via Escape.)
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    );
  });

  it('opens on keyboard focus too', async () => {
    render(<Harness rows={[baseRow]} />);
    const trigger = screen.getByRole('button', {
      name: 'vacancies.table.multiValue.rolesCount:2',
    });

    act(() => trigger.focus());

    expect(await tooltip()).toHaveTextContent('Back End Engineer');
  });

  it('shows no count trigger or hover message for a vacancy with a single Job Title and Role', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        rows={[{ ...baseRow, jobTitle: ['UX Designer'], role: ['Designer'] }]}
      />
    );

    expect(screen.getByText('UX Designer')).toBeInTheDocument();
    expect(screen.getByText('Designer')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /multiValue/ })
    ).not.toBeInTheDocument();

    await user.hover(screen.getByText('UX Designer'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('keeps the hover message working after the rows are replaced (e.g. a new search)', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness rows={[baseRow]} />);

    rerender(
      <Harness
        rows={[
          {
            ...baseRow,
            vacancyId: 'vacancy-2',
            jobTitle: ['QA Lead', 'Test Engineer'],
          },
        ]}
      />
    );

    await user.hover(
      screen.getByRole('button', {
        name: 'vacancies.table.multiValue.jobTitlesCount:2',
      })
    );

    expect(await tooltip()).toHaveTextContent('Test Engineer');
  });
});
