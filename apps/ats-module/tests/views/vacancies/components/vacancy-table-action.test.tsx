import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyTableAction from '@/views/vacancies/components/vacancy-table-action';

const mockNavigate = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('VacancyTableAction', () => {
  const onVersionHistory = vi.fn();
  const onMatchCandidate = vi.fn();
  const onCopyLink = vi.fn();
  const onMakeACopy = vi.fn();
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  // unpublished + no applicants: Edit, Duplicate, Version History, Copy Link, Delete
  const defaultProps = {
    vacancy: {
      id: 'test-vacancy-id',
      status: 'unpublished',
      applicantCount: 0,
    },
    onVersionHistory,
    onMatchCandidate,
    onCopyLink,
    onMakeACopy,
    onEdit,
    onDelete,
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders the trigger button with sr-only label', () => {
    render(<VacancyTableAction {...defaultProps} />);
    expect(
      screen.getByText('vacancies.table.actions.openMenu')
    ).toBeInTheDocument();
  });

  it('shows correct action items for unpublished vacancy when opened', async () => {
    const user = userEvent.setup();
    render(<VacancyTableAction {...defaultProps} />);
    await user.click(screen.getByRole('button'));

    expect(
      screen.getByText('vacancies.table.actions.edit')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.makeACopy')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.versionHistory')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.copyLink')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.delete')
    ).toBeInTheDocument();
    // Match candidates not shown for unpublished
    expect(
      screen.queryByText('vacancies.table.actions.matchCandidate')
    ).not.toBeInTheDocument();
  });

  it('shows match candidates and hides delete for live vacancy with applicants', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTableAction
        {...defaultProps}
        vacancy={{ id: 'test', status: 'live', applicantCount: 3 }}
      />
    );
    await user.click(screen.getByRole('button'));

    expect(
      screen.getByText('vacancies.table.actions.matchCandidate')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('vacancies.table.actions.delete')
    ).not.toBeInTheDocument();
  });

  it('hides duplicate, version history, copy link, and match candidates for draft vacancy', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTableAction
        {...defaultProps}
        vacancy={{ id: 'test', status: 'draft', applicantCount: 0 }}
      />
    );
    await user.click(screen.getByRole('button'));

    expect(
      screen.getByText('vacancies.table.actions.edit')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.delete')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('vacancies.table.actions.makeACopy')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('vacancies.table.actions.versionHistory')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('vacancies.table.actions.copyLink')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('vacancies.table.actions.matchCandidate')
    ).not.toBeInTheDocument();
  });

  it.each([
    [
      'onVersionHistory',
      'vacancies.table.actions.versionHistory',
      onVersionHistory,
    ],
    ['onCopyLink', 'vacancies.table.actions.copyLink', onCopyLink],
    ['onMakeACopy', 'vacancies.table.actions.makeACopy', onMakeACopy],
    ['onDelete', 'vacancies.table.actions.delete', onDelete],
  ])(
    'calls %s callback when its menu item is clicked',
    async (_name, label, callback) => {
      const user = userEvent.setup();
      render(<VacancyTableAction {...defaultProps} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText(label));
      expect(callback).toHaveBeenCalledTimes(1);
    }
  );

  it('navigates to edit page when edit menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<VacancyTableAction {...defaultProps} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('vacancies.table.actions.edit'));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/dashboard/ats/vacancies/test-vacancy-id/edit'
    );
  });

  it('calls onMatchCandidate callback when its menu item is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTableAction
        {...defaultProps}
        vacancy={{ id: 'test', status: 'live', applicantCount: 1 }}
      />
    );
    await user.click(screen.getByRole('button'));
    await user.click(
      screen.getByText('vacancies.table.actions.matchCandidate')
    );
    expect(onMatchCandidate).toHaveBeenCalledTimes(1);
  });
});
