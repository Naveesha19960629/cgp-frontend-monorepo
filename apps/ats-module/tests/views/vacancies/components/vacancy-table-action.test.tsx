import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyTableAction from '@/views/vacancies/components/vacancy-table-action';

const mockNavigate = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null, pathname: '/' }),
}));

describe('VacancyTableAction', () => {
  const onVersionHistory = vi.fn();
  const onMatchCandidate = vi.fn();
  const onCopyLink = vi.fn();
  const onMakeACopy = vi.fn();
  const onEdit = vi.fn();
  const onSaveAsTemplate = vi.fn();
  const onDelete = vi.fn();

  // unpublished + no applicants: Edit, Make a Copy, Delete, Copy Link, Save as Template
  // (no Version History, no Match Candidate)
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
    onSaveAsTemplate,
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
      screen.getByText('vacancies.table.actions.editJd')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.makeACopy')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.copyLink')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.saveAsTemplate')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.delete')
    ).toBeInTheDocument();
    // Version History is explicitly excluded for Unpublished vacancies.
    expect(
      screen.queryByText('vacancies.table.actions.versionHistory')
    ).not.toBeInTheDocument();
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
      screen.getByText('vacancies.table.actions.editJd')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.versionHistory')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.saveAsTemplate')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('vacancies.table.actions.delete')
    ).not.toBeInTheDocument();
  });

  it('shows delete and version history but hides match candidates for live vacancy with 0 applicants', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTableAction
        {...defaultProps}
        vacancy={{ id: 'test', status: 'live', applicantCount: 0 }}
      />
    );
    await user.click(screen.getByRole('button'));

    expect(
      screen.getByText('vacancies.table.actions.delete')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.versionHistory')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('vacancies.table.actions.matchCandidate')
    ).not.toBeInTheDocument();
  });

  it.each([['expired'], ['onhold'], ['on_hold']])(
    'shows delete for %s vacancy with 0 applicants',
    async status => {
      const user = userEvent.setup();
      render(
        <VacancyTableAction
          {...defaultProps}
          vacancy={{ id: 'test', status, applicantCount: 0 }}
        />
      );
      await user.click(screen.getByRole('button'));

      expect(
        screen.getByText('vacancies.table.actions.delete')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('vacancies.table.actions.matchCandidate')
      ).not.toBeInTheDocument();
    }
  );

  it.each([['expired'], ['onhold'], ['on_hold']])(
    'hides delete but shows match candidates for %s vacancy with applicants',
    async status => {
      const user = userEvent.setup();
      render(
        <VacancyTableAction
          {...defaultProps}
          vacancy={{ id: 'test', status, applicantCount: 2 }}
        />
      );
      await user.click(screen.getByRole('button'));

      expect(
        screen.queryByText('vacancies.table.actions.delete')
      ).not.toBeInTheDocument();
      expect(
        screen.getByText('vacancies.table.actions.matchCandidate')
      ).toBeInTheDocument();
    }
  );

  it('shows only edit, save as template and delete for draft vacancy', async () => {
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
      screen.getByText('vacancies.table.actions.saveAsTemplate')
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
      screen.queryByText('vacancies.table.actions.editJd')
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
    [
      'onSaveAsTemplate',
      'vacancies.table.actions.saveAsTemplate',
      onSaveAsTemplate,
    ],
    ['onDelete', 'vacancies.table.actions.delete', onDelete],
  ])(
    'calls %s callback when its menu item is clicked',
    async (_name, label, callback) => {
      const user = userEvent.setup();
      render(
        <VacancyTableAction
          {...defaultProps}
          vacancy={{ id: 'test', status: 'live', applicantCount: 0 }}
        />
      );
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText(label));
      expect(callback).toHaveBeenCalledTimes(1);
    }
  );

  it('navigates to edit page when edit menu item is clicked', async () => {
    const user = userEvent.setup();
    const props = { ...defaultProps, onEdit: undefined };
    render(<VacancyTableAction {...props} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('vacancies.table.actions.edit'));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/dashboard/ats/vacancies/test-vacancy-id/edit',
      { state: { from: '/' } }
    );
  });

  it('calls onEdit callback when its menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<VacancyTableAction {...defaultProps} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('vacancies.table.actions.edit'));

    expect(onEdit).toHaveBeenCalledTimes(1);
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

  it('respects availableActions array when present', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTableAction
        {...defaultProps}
        vacancy={{
          id: 'test',
          status: 'live',
          applicantCount: 3,
          availableActions: ['DELETE', 'EDIT'],
        }}
      />
    );
    await user.click(screen.getByRole('button'));

    expect(
      screen.getByText('vacancies.table.actions.delete')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.edit')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('vacancies.table.actions.makeACopy')
    ).not.toBeInTheDocument();
    // Save as Template is always shown, regardless of availableActions.
    expect(
      screen.getByText('vacancies.table.actions.saveAsTemplate')
    ).toBeInTheDocument();
    // EDIT_JD not in availableActions — falls back to status-based (live → show)
    expect(
      screen.getByText('vacancies.table.actions.editJd')
    ).toBeInTheDocument();
  });

  it('always shows saveAsTemplate even when availableActions omits it', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTableAction
        {...defaultProps}
        vacancy={{
          id: 'test',
          status: 'draft',
          applicantCount: 0,
          availableActions: ['EDIT'],
        }}
      />
    );
    await user.click(screen.getByRole('button'));

    expect(
      screen.getByText('vacancies.table.actions.saveAsTemplate')
    ).toBeInTheDocument();
  });

  it('shows editJd when EDIT_JD is explicitly in availableActions, regardless of status', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTableAction
        {...defaultProps}
        vacancy={{
          id: 'test',
          status: 'draft',
          applicantCount: 0,
          availableActions: ['EDIT_JD'],
        }}
      />
    );
    await user.click(screen.getByRole('button'));

    expect(
      screen.getByText('vacancies.table.actions.editJd')
    ).toBeInTheDocument();
  });

  it('navigates to edit-jd page when editJd menu item is clicked without onEditJd prop', async () => {
    const user = userEvent.setup();
    render(<VacancyTableAction {...defaultProps} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('vacancies.table.actions.editJd'));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/dashboard/ats/vacancies/test-vacancy-id/edit-jd',
      { state: { from: '/' } }
    );
  });
});
