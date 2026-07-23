import { render, screen } from '@testing-library/react';

import { VacancyHonoursAwardsSection } from '@/views/vacancies/components/view-vacancy/vacancy-honours-awards-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseEntry = {
  title: '',
  associatedOrganizations: [],
  organizationLocations: [],
  issuedBy: '',
  issuedFromDate: '',
  issuedToDate: '',
};

describe('VacancyHonoursAwardsSection', () => {
  it('renders nothing when preferredHonoursAwards is undefined', () => {
    const { container } = render(
      <VacancyHonoursAwardsSection preferredHonoursAwards={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, title: 'Best Employee' }],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: true,
          content: [],
        }}
      />
    );
    expect(
      screen.getByText('vacancies.view.noDetails.title')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.view.noDetails.description')
    ).toBeInTheDocument();
  });

  it('shows a dash when section is enabled but content is empty', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [],
        }}
      />
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders the section title when data exists', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, title: 'Best Employee' }],
        }}
      />
    );
    expect(
      screen.getByText('preferredHonoursAwards.title')
    ).toBeInTheDocument();
  });

  it('formats issuedFromDate and issuedToDate as a date range', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              issuedFromDate: '2022-01-02',
              issuedToDate: '2023-06-15',
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText('2nd Jan 2022 - 15th Jun 2023')
    ).toBeInTheDocument();
  });

  it('shows issuedFromDate with a "Present" suffix when issuedToDate is absent', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, issuedFromDate: '2022-03-05', issuedToDate: '' },
          ],
        }}
      />
    );
    expect(screen.getByText('5th Mar 2022 - Present')).toBeInTheDocument();
  });

  it('shows issuedToDate with an "Until" prefix when issuedFromDate is absent', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, issuedFromDate: '', issuedToDate: '2024-11-01' },
          ],
        }}
      />
    );
    expect(screen.getByText('Until 1st Nov 2024')).toBeInTheDocument();
  });

  it('renders an empty date row when both issuedFromDate and issuedToDate are absent', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, title: 'Best Employee' }],
        }}
      />
    );
    expect(
      screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
    ).not.toBeInTheDocument();
  });

  it('renders the title and issuedBy values', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, title: 'Best Employee', issuedBy: 'ACME Corp' },
          ],
        }}
      />
    );
    expect(screen.getByText('Best Employee')).toBeInTheDocument();
    expect(screen.getByText('ACME Corp')).toBeInTheDocument();
  });

  it('renders associatedOrganizations tags', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              associatedOrganizations: ['ACME Corp', 'Globex'],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('ACME Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('renders organizationLocations tags', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              organizationLocations: ['Colombo', 'London'],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('shows the field labels for the shaded grid', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              associatedOrganizations: ['ACME Corp'],
              organizationLocations: ['Colombo'],
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText(
        'preferredHonoursAwards.fieldList.associatedOrganization'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('preferredHonoursAwards.organizationLocation')
    ).toBeInTheDocument();
  });

  it('renders multiple content entries', () => {
    render(
      <VacancyHonoursAwardsSection
        preferredHonoursAwards={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, title: 'Best Employee' },
            { ...baseEntry, title: 'Top Performer' },
          ],
        }}
      />
    );
    expect(screen.getByText('Best Employee')).toBeInTheDocument();
    expect(screen.getByText('Top Performer')).toBeInTheDocument();
  });

  it('does not crash when all entry fields are empty', () => {
    expect(() =>
      render(
        <VacancyHonoursAwardsSection
          preferredHonoursAwards={{
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [{ ...baseEntry }],
          }}
        />
      )
    ).not.toThrow();
  });
});
