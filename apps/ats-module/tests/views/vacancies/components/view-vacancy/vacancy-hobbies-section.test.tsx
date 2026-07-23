import { render, screen } from '@testing-library/react';

import { VacancyHobbiesSection } from '@/views/vacancies/components/view-vacancy/vacancy-hobbies-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyHobbiesSection', () => {
  it('renders nothing when preferredHobbies is undefined', () => {
    const { container } = render(
      <VacancyHobbiesSection preferredHobbies={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyHobbiesSection
        preferredHobbies={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: ['Reading'],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyHobbiesSection
        preferredHobbies={{
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
      <VacancyHobbiesSection
        preferredHobbies={{
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
      <VacancyHobbiesSection
        preferredHobbies={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['Reading'],
        }}
      />
    );
    expect(screen.getByText('preferredHobbies.title')).toBeInTheDocument();
  });

  it('renders each content item as a tag', () => {
    render(
      <VacancyHobbiesSection
        preferredHobbies={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['Reading', 'Painting'],
        }}
      />
    );
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Painting')).toBeInTheDocument();
  });
});
