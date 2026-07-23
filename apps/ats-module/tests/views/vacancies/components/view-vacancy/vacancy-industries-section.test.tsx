import { render, screen } from '@testing-library/react';

import { VacancyIndustriesSection } from '@/views/vacancies/components/view-vacancy/vacancy-industries-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyIndustriesSection', () => {
  it('renders nothing when preferredIndustries is undefined', () => {
    const { container } = render(
      <VacancyIndustriesSection preferredIndustries={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyIndustriesSection
        preferredIndustries={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: ['Technology'],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyIndustriesSection
        preferredIndustries={{
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
      <VacancyIndustriesSection
        preferredIndustries={{
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
      <VacancyIndustriesSection
        preferredIndustries={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['Technology'],
        }}
      />
    );
    expect(screen.getByText('preferredIndustries.title')).toBeInTheDocument();
  });

  it('renders each content item as a tag', () => {
    render(
      <VacancyIndustriesSection
        preferredIndustries={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['Technology', 'Healthcare'],
        }}
      />
    );
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
  });
});
