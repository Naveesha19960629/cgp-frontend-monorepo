import { render, screen } from '@testing-library/react';

import { VacancyVolunteeringSection } from '@/views/vacancies/components/view-vacancy/vacancy-volunteering-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseEntry = {
  organization: [],
  organizationLocations: [],
  positionRole: '',
  cause: [],
  startDate: '',
  endDate: '',
};

describe('VacancyVolunteeringSection', () => {
  it('renders nothing when preferredVolunteering is undefined', () => {
    const { container } = render(
      <VacancyVolunteeringSection preferredVolunteering={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRole: 'Coordinator' }],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
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
      <VacancyVolunteeringSection
        preferredVolunteering={{
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
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRole: 'Coordinator' }],
        }}
      />
    );
    expect(screen.getByText('preferredVolunteering.title')).toBeInTheDocument();
  });

  it('renders the positionRole value in the info row', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRole: 'Coordinator' }],
        }}
      />
    );
    expect(
      screen.getByText('preferredVolunteering.fieldList.position')
    ).toBeInTheDocument();
    expect(screen.getByText('Coordinator')).toBeInTheDocument();
  });

  it('hides the position field entirely when positionRole is empty', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, positionRole: '' }],
        }}
      />
    );
    expect(
      screen.queryByText('preferredVolunteering.fieldList.position')
    ).not.toBeInTheDocument();
  });

  it('formats startDate and endDate as a date range', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
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

  it('shows "N/A" for endDate when only startDate is provided', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, startDate: '2022-03-05', endDate: '' }],
        }}
      />
    );
    expect(screen.getByText('5th Mar 2022 - N/A')).toBeInTheDocument();
  });

  it('shows "N/A" for startDate when only endDate is provided', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, startDate: '', endDate: '2024-11-01' }],
        }}
      />
    );
    expect(screen.getByText('N/A - 1st Nov 2024')).toBeInTheDocument();
  });

  it('renders organization tags', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, organization: ['Red Cross', 'UNICEF'] }],
        }}
      />
    );
    expect(screen.getByText('Red Cross')).toBeInTheDocument();
    expect(screen.getByText('UNICEF')).toBeInTheDocument();
  });

  it('renders organizationLocations tags', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
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

  it('renders cause tags', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, cause: ['Education', 'Environment'] }],
        }}
      />
    );
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Environment')).toBeInTheDocument();
  });

  it('shows the field labels', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              organization: ['Red Cross'],
              organizationLocations: ['Colombo'],
              cause: ['Education'],
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText('preferredVolunteering.fieldList.organization')
    ).toBeInTheDocument();
    expect(
      screen.getByText('preferredVolunteering.fieldList.location')
    ).toBeInTheDocument();
    expect(
      screen.getByText('preferredVolunteering.fieldList.cause')
    ).toBeInTheDocument();
  });

  it('renders multiple content entries', () => {
    render(
      <VacancyVolunteeringSection
        preferredVolunteering={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, positionRole: 'Coordinator' },
            { ...baseEntry, positionRole: 'Volunteer' },
          ],
        }}
      />
    );
    expect(screen.getByText('Coordinator')).toBeInTheDocument();
    expect(screen.getByText('Volunteer')).toBeInTheDocument();
  });

  it('does not crash when all entry fields are empty', () => {
    expect(() =>
      render(
        <VacancyVolunteeringSection
          preferredVolunteering={{
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [{ ...baseEntry }],
          }}
        />
      )
    ).not.toThrow();
  });
});
