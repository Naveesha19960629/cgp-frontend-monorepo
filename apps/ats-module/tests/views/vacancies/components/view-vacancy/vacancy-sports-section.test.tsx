import { render, screen } from '@testing-library/react';

import { VacancySportsSection } from '@/views/vacancies/components/view-vacancy/vacancy-sports-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseEntry = {
  nameOfSport: [],
  representedOrganization: [],
  organizationLocations: [],
  levelRepresented: [],
  positionRoleHeld: '',
  startDate: '',
  endDate: '',
};

describe('VacancySportsSection', () => {
  it('renders nothing when preferredSports is undefined', () => {
    const { container } = render(<VacancySportsSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancySportsSection
        preferredSports={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRoleHeld: 'Captain' }],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancySportsSection
        preferredSports={{
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
      <VacancySportsSection
        preferredSports={{
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
      <VacancySportsSection
        preferredSports={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRoleHeld: 'Captain' }],
        }}
      />
    );
    expect(screen.getByText('preferredSports.title')).toBeInTheDocument();
  });

  it('formats startDate and endDate as a date range', () => {
    render(
      <VacancySportsSection
        preferredSports={{
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
      <VacancySportsSection
        preferredSports={{
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
      <VacancySportsSection
        preferredSports={{
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
      <VacancySportsSection
        preferredSports={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRoleHeld: 'Captain' }],
        }}
      />
    );
    expect(
      screen.queryByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
    ).not.toBeInTheDocument();
  });

  it('renders the positionRoleHeld value', () => {
    render(
      <VacancySportsSection
        preferredSports={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRoleHeld: 'Captain' }],
        }}
      />
    );
    expect(screen.getByText('Captain')).toBeInTheDocument();
  });

  it('renders nameOfSport tags', () => {
    render(
      <VacancySportsSection
        preferredSports={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, nameOfSport: ['Cricket', 'Rugby'] }],
        }}
      />
    );
    expect(screen.getByText('Cricket')).toBeInTheDocument();
    expect(screen.getByText('Rugby')).toBeInTheDocument();
  });

  it('renders organizationLocations tags', () => {
    render(
      <VacancySportsSection
        preferredSports={{
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

  it('renders levelRepresented tags', () => {
    render(
      <VacancySportsSection
        preferredSports={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, levelRepresented: ['National', 'Provincial'] },
          ],
        }}
      />
    );
    expect(screen.getByText('National')).toBeInTheDocument();
    expect(screen.getByText('Provincial')).toBeInTheDocument();
  });

  it('renders representedOrganization tags', () => {
    render(
      <VacancySportsSection
        preferredSports={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              representedOrganization: ['Cricket Board', 'Rugby Union'],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('Cricket Board')).toBeInTheDocument();
    expect(screen.getByText('Rugby Union')).toBeInTheDocument();
  });

  it('shows all field labels for the shaded grid', () => {
    render(
      <VacancySportsSection
        preferredSports={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              nameOfSport: ['Cricket'],
              organizationLocations: ['Colombo'],
              levelRepresented: ['National'],
              representedOrganization: ['Cricket Board'],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('preferredSports.fieldList.sport')).toBeInTheDocument();
    expect(
      screen.getByText('preferredSports.fieldList.organizationLocation')
    ).toBeInTheDocument();
    expect(
      screen.getByText('preferredSports.fieldList.levelRepresented')
    ).toBeInTheDocument();
    expect(
      screen.getByText('preferredSports.fieldList.representedOrganization')
    ).toBeInTheDocument();
  });

  it('renders multiple content entries', () => {
    render(
      <VacancySportsSection
        preferredSports={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, positionRoleHeld: 'Captain' },
            { ...baseEntry, positionRoleHeld: 'Vice Captain' },
          ],
        }}
      />
    );
    expect(screen.getByText('Captain')).toBeInTheDocument();
    expect(screen.getByText('Vice Captain')).toBeInTheDocument();
  });

  it('does not crash when all entry fields are empty', () => {
    expect(() =>
      render(
        <VacancySportsSection
          preferredSports={{
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [{ ...baseEntry }],
          }}
        />
      )
    ).not.toThrow();
  });
});
