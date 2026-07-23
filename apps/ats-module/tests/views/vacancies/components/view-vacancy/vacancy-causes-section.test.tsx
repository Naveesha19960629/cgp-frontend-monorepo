import { render, screen } from '@testing-library/react';

import { VacancyCausesSection } from '@/views/vacancies/components/view-vacancy/vacancy-causes-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyCausesSection', () => {
  it('renders nothing when preferredCauses is undefined', () => {
    const { container } = render(
      <VacancyCausesSection preferredCauses={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyCausesSection
        preferredCauses={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: ['Environment'],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyCausesSection
        preferredCauses={{
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
      <VacancyCausesSection
        preferredCauses={{
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
      <VacancyCausesSection
        preferredCauses={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['Environment'],
        }}
      />
    );
    expect(screen.getByText('preferredCauses.title')).toBeInTheDocument();
  });

  it('renders each content item as a tag', () => {
    render(
      <VacancyCausesSection
        preferredCauses={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['Environment', 'Animal Welfare'],
        }}
      />
    );
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Animal Welfare')).toBeInTheDocument();
  });
});
