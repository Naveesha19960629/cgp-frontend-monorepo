import { render, screen } from '@testing-library/react';

import { VacancyClubsSocietiesSection } from '@/views/vacancies/components/view-vacancy/vacancy-clubs-societies-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseEntry = {
  clubSociety: [],
  organization: [],
  organizationLocations: [],
  positionRoleHeld: '',
  startDate: '',
  endDate: '',
};

describe('VacancyClubsSocietiesSection', () => {
  it('renders nothing when preferredClubSocieties is undefined', () => {
    const { container } = render(<VacancyClubsSocietiesSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRoleHeld: 'President' }],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
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
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
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
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRoleHeld: 'President' }],
        }}
      />
    );
    expect(
      screen.getByText('preferredClubSocieties.title')
    ).toBeInTheDocument();
  });

  it('formats startDate and endDate as a date range', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, startDate: '2022-01-02', endDate: '2023-06-15' },
          ],
        }}
      />
    );
    expect(
      screen.getByText('2nd Jan 2022 - 15th Jun 2023')
    ).toBeInTheDocument();
  });

  it('shows startDate with a "Present" suffix when endDate is absent', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, startDate: '2022-03-05', endDate: '' }],
        }}
      />
    );
    expect(screen.getByText('5th Mar 2022 - Present')).toBeInTheDocument();
  });

  it('shows endDate with an "Until" prefix when startDate is absent', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, startDate: '', endDate: '2024-11-01' }],
        }}
      />
    );
    expect(screen.getByText('Until 1st Nov 2024')).toBeInTheDocument();
  });

  it('renders an empty date row when both startDate and endDate are absent', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRoleHeld: 'President' }],
        }}
      />
    );
    expect(
      screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
    ).not.toBeInTheDocument();
  });

  it('renders the positionRoleHeld value', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRoleHeld: 'President' }],
        }}
      />
    );
    expect(screen.getByText('President')).toBeInTheDocument();
  });

  it('renders clubSociety tags', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, clubSociety: ['Chess Club', 'Debate Society'] },
          ],
        }}
      />
    );
    expect(screen.getByText('Chess Club')).toBeInTheDocument();
    expect(screen.getByText('Debate Society')).toBeInTheDocument();
  });

  it('renders organizationLocations tags', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, organizationLocations: ['Colombo', 'London'] },
          ],
        }}
      />
    );
    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('renders organization tags', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, organization: ['ACME Corp', 'Globex'] },
          ],
        }}
      />
    );
    expect(screen.getByText('ACME Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('shows all field labels for the shaded grid', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              clubSociety: ['Chess Club'],
              organizationLocations: ['Colombo'],
              organization: ['ACME Corp'],
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText('preferredClubSocieties.fieldList.clubSociety')
    ).toBeInTheDocument();
    expect(
      screen.getByText('preferredClubSocieties.fieldList.organizationLocation')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'preferredClubSocieties.fieldList.representedOrganization'
      )
    ).toBeInTheDocument();
  });

  it('renders multiple content entries', () => {
    render(
      <VacancyClubsSocietiesSection
        preferredClubSocieties={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, positionRoleHeld: 'President' },
            { ...baseEntry, positionRoleHeld: 'Secretary' },
          ],
        }}
      />
    );
    expect(screen.getByText('President')).toBeInTheDocument();
    expect(screen.getByText('Secretary')).toBeInTheDocument();
  });

  it('does not crash when all entry fields are empty', () => {
    expect(() =>
      render(
        <VacancyClubsSocietiesSection
          preferredClubSocieties={{
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [{ ...baseEntry }],
          }}
        />
      )
    ).not.toThrow();
  });
});
