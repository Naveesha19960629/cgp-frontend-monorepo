import { render, screen } from '@testing-library/react';

import { VacancyProjectRequirementsSection } from '@/views/vacancies/components/view-vacancy/vacancy-project-requirements-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyProjectRequirementsSection', () => {
  it('renders preferred projects section and project details', () => {
    render(
      <VacancyProjectRequirementsSection
        preferredProjects={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              startDate: '2022-01-12',
              endDate: '2023-02-13',
              relatedIndustry: ['IT', 'Finance'],
              organizationLocations: ['Kandy, Sri Lanka'],
              organization: ['University of Kelaniya'],
            },
          ],
        }}
      />
    );

    expect(
      screen.getByText('vacancies.view.sections.projectRequirements')
    ).toBeInTheDocument();
    expect(
      screen.getByText('12th Jan 2022 - 13th Feb 2023')
    ).toBeInTheDocument();

    expect(
      screen.getByText('projectsRequirements.relatedIndustry')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.organizationLocation')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projectsRequirements.organizationName')
    ).toBeInTheDocument();

    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Kandy, Sri Lanka')).toBeInTheDocument();
    expect(screen.getByText('University of Kelaniya')).toBeInTheDocument();
  });

  it('renders no details state when data is taken from candidate', () => {
    render(
      <VacancyProjectRequirementsSection
        preferredProjects={{
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

  it('does not render when section is disabled', () => {
    const { container } = render(
      <VacancyProjectRequirementsSection
        preferredProjects={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [],
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
