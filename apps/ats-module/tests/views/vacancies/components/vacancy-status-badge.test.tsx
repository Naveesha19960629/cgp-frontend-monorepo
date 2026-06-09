import { render, screen } from '@testing-library/react';

import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyStatusBadge', () => {
  it.each([
    ['Draft', 'vacancies.table.filter.statusOptions.draft'],
    ['Unpublished', 'vacancies.table.filter.statusOptions.unpublished'],
    ['Live', 'vacancies.table.filter.statusOptions.live'],
    ['Expired', 'vacancies.table.filter.statusOptions.expired'],
    ['On_Hold', 'vacancies.table.filter.statusOptions.onHold'],
  ])('renders translated label for status "%s"', (status, expectedKey) => {
    render(<VacancyStatusBadge status={status} />);
    expect(screen.getByText(expectedKey)).toBeInTheDocument();
  });

  it('renders the raw status string for an unknown status', () => {
    render(<VacancyStatusBadge status="Archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('is case-insensitive when matching known statuses', () => {
    render(<VacancyStatusBadge status="LIVE" />);
    expect(
      screen.getByText('vacancies.table.filter.statusOptions.live')
    ).toBeInTheDocument();
  });
});
