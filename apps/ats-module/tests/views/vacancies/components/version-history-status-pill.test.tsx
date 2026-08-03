import { render, screen } from '@testing-library/react';

import VersionHistoryStatusPill from '@/views/vacancies/components/version-history-status-pill';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VersionHistoryStatusPill', () => {
  it.each([
    ['LIVE', 'vacancies.table.filter.statusOptions.live'],
    ['ONHOLD', 'vacancies.table.filter.statusOptions.onHold'],
    ['UNPUBLISHED', 'vacancies.table.filter.statusOptions.unpublished'],
  ])('renders the translated label for status "%s"', (status, expectedKey) => {
    render(<VersionHistoryStatusPill status={status} />);
    expect(screen.getByText(expectedKey)).toBeInTheDocument();
  });

  it('renders the raw status string for an unknown status', () => {
    render(<VersionHistoryStatusPill status="Archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('merges an optional className onto the pill', () => {
    render(<VersionHistoryStatusPill status="LIVE" className="self-start" />);
    expect(
      screen.getByText('vacancies.table.filter.statusOptions.live')
    ).toHaveClass('self-start');
  });
});
