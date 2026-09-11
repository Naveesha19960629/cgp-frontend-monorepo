import { render, screen } from '@testing-library/react';

import { VacancyLanguagesSection } from '@/views/vacancies/components/view-vacancy/vacancy-languages-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyLanguagesSection', () => {
  it('renders nothing when preferredLanguages is undefined', () => {
    const { container } = render(
      <VacancyLanguagesSection preferredLanguages={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyLanguagesSection
        preferredLanguages={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: ['English'],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyLanguagesSection
        preferredLanguages={{
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

  it('shows the section title but no tags when content is empty', () => {
    render(
      <VacancyLanguagesSection
        preferredLanguages={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [],
        }}
      />
    );
    expect(screen.getByText('preferredLanguages.title')).toBeInTheDocument();
    expect(screen.queryByText('-')).not.toBeInTheDocument();
  });

  it('renders the section title and each language tag when content exists', () => {
    render(
      <VacancyLanguagesSection
        preferredLanguages={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['English', 'French'],
        }}
      />
    );
    expect(screen.getByText('preferredLanguages.title')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
  });
});
