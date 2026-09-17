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

  it.each(['ONHOLD', 'On Hold'])(
    'matches the on_hold config for the "%s" status spelling',
    status => {
      render(<VacancyStatusBadge status={status} />);
      const badge = screen.getByTestId('vacancy-on_hold');
      expect(badge).toHaveTextContent(
        'vacancies.table.filter.statusOptions.onHold'
      );
      expect(badge).toHaveClass('bg-[#dbeafe]');
    }
  );

  it('appends the applicant count as "(N Applied)"', () => {
    render(<VacancyStatusBadge status="LIVE" applicantCount={3} />);
    expect(screen.getByTestId('vacancy-live')).toHaveTextContent(
      'vacancies.table.filter.statusOptions.live (3 vacancies.stepBadge.applied)'
    );
  });

  it('renders "Live (0 Applied)" when a live vacancy has no applicants', () => {
    render(<VacancyStatusBadge status="LIVE" applicantCount={0} />);
    expect(screen.getByTestId('vacancy-live')).toHaveTextContent(
      'vacancies.table.filter.statusOptions.live (0 vacancies.stepBadge.applied)'
    );
  });

  it('appends the (frozen) applicant count for on_hold statuses', () => {
    render(<VacancyStatusBadge status="ONHOLD" applicantCount={3} />);
    expect(screen.getByTestId('vacancy-on_hold')).toHaveTextContent(
      'vacancies.table.filter.statusOptions.onHold (3 vacancies.stepBadge.applied)'
    );
  });

  it('appends the (frozen) applicant count for expired statuses', () => {
    render(<VacancyStatusBadge status="EXPIRED" applicantCount={5} />);
    expect(screen.getByTestId('vacancy-expired')).toHaveTextContent(
      'vacancies.table.filter.statusOptions.expired (5 vacancies.stepBadge.applied)'
    );
  });

  it('omits the applicant count for draft', () => {
    render(<VacancyStatusBadge status="DRAFT" applicantCount={3} />);
    expect(screen.getByTestId('vacancy-draft')).toHaveTextContent(
      'vacancies.table.filter.statusOptions.draft'
    );
    expect(screen.getByTestId('vacancy-draft')).not.toHaveTextContent('3');
  });

  it('omits the applicant count for unpublished', () => {
    render(<VacancyStatusBadge status="UNPUBLISHED" applicantCount={3} />);
    expect(screen.getByTestId('vacancy-unpublished')).toHaveTextContent(
      'vacancies.table.filter.statusOptions.unpublished'
    );
    expect(screen.getByTestId('vacancy-unpublished')).not.toHaveTextContent(
      '3'
    );
  });
});
