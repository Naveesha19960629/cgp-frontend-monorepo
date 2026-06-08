import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyTableAction from '@/views/vacancies/components/vacancy-table-action';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyTableAction', () => {
  const onVersionHistory = vi.fn();
  const onMatchCandidate = vi.fn();
  const onCopyLink = vi.fn();
  const onMakeACopy = vi.fn();
  const onEdit = vi.fn();
  const onEditJD = vi.fn();
  const onDelete = vi.fn();

  const defaultProps = {
    vacancy: { id: 'test-vacancy-id' },
    onVersionHistory,
    onMatchCandidate,
    onCopyLink,
    onMakeACopy,
    onEdit,
    onEditJD,
    onDelete,
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders the trigger button with sr-only label', () => {
    render(<VacancyTableAction {...defaultProps} />);
    expect(
      screen.getByText('vacancies.table.actions.openMenu')
    ).toBeInTheDocument();
  });

  it('shows all action menu items when opened', async () => {
    const user = userEvent.setup();
    render(<VacancyTableAction {...defaultProps} />);
    await user.click(screen.getByRole('button'));

    expect(
      screen.getByText('vacancies.table.actions.versionHistory')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.matchCandidate')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.copyLink')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.makeACopy')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.edit')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.editJD')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.actions.delete')
    ).toBeInTheDocument();
  });

  it.each([
    [
      'onVersionHistory',
      'vacancies.table.actions.versionHistory',
      onVersionHistory,
    ],
    [
      'onMatchCandidate',
      'vacancies.table.actions.matchCandidate',
      onMatchCandidate,
    ],
    ['onCopyLink', 'vacancies.table.actions.copyLink', onCopyLink],
    ['onMakeACopy', 'vacancies.table.actions.makeACopy', onMakeACopy],
    ['onEdit', 'vacancies.table.actions.edit', onEdit],
    ['onEditJD', 'vacancies.table.actions.editJD', onEditJD],
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
});
