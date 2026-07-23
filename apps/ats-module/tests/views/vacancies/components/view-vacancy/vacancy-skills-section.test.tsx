import { render, screen } from '@testing-library/react';

import { VacancySkillsSection } from '@/views/vacancies/components/view-vacancy/vacancy-skills-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancySkillsSection', () => {
  it('renders nothing when preferredSkills is undefined', () => {
    const { container } = render(
      <VacancySkillsSection preferredSkills={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancySkillsSection
        preferredSkills={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: ['React'],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancySkillsSection
        preferredSkills={{
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
      <VacancySkillsSection
        preferredSkills={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [],
        }}
      />
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders the section title and each skill tag when content exists', () => {
    render(
      <VacancySkillsSection
        preferredSkills={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: ['React', 'TypeScript'],
        }}
      />
    );
    expect(screen.getByText('preferredSkills.title')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });
});
