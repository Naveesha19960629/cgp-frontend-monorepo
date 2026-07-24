import { render, screen } from '@testing-library/react';

import { VacancyJobRequirementsSection } from '@/views/vacancies/components/view-vacancy/vacancy-job-requirements-section';
import type { VacancyViewModel } from '@/views/vacancies/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseJobRequirement: VacancyViewModel['jobRequirement'] = {
  discipline: [],
  careerPath: [],
  level: [],
  role: [],
  jobTitle: [],
  employmentType: [],
  workSchedule: [],
  engagementModel: [],
  description: '',
};

describe('VacancyJobRequirementsSection', () => {
  it('renders the section title', () => {
    render(
      <VacancyJobRequirementsSection jobRequirement={baseJobRequirement} />
    );
    expect(
      screen.getByText('vacancies.view.sections.jobRequirements')
    ).toBeInTheDocument();
  });

  it('renders the info row labels', () => {
    render(
      <VacancyJobRequirementsSection jobRequirement={baseJobRequirement} />
    );
    expect(screen.getByText('jobRequirements.discipline')).toBeInTheDocument();
    expect(screen.getByText('jobRequirements.careerPath')).toBeInTheDocument();
    expect(screen.getByText('jobRequirements.level')).toBeInTheDocument();
  });

  it('shows a dash for discipline, careerPath and level when they are empty arrays', () => {
    render(
      <VacancyJobRequirementsSection jobRequirement={baseJobRequirement} />
    );
    // three info rows all render '-' when their values are empty
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(3);
  });

  it('renders joined discipline, careerPath and level values', () => {
    render(
      <VacancyJobRequirementsSection
        jobRequirement={{
          ...baseJobRequirement,
          discipline: ['Engineering', 'Design'],
          careerPath: ['Individual Contributor'],
          level: ['Senior'],
        }}
      />
    );
    expect(screen.getByText('Engineering, Design')).toBeInTheDocument();
    expect(screen.getByText('Individual Contributor')).toBeInTheDocument();
    expect(screen.getByText('Senior')).toBeInTheDocument();
  });

  it('shows a dash for the description when it is empty', () => {
    render(
      <VacancyJobRequirementsSection jobRequirement={baseJobRequirement} />
    );
    // Description renders its own dash in addition to the info-row dashes
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(4);
  });

  it('renders the description text when present', () => {
    render(
      <VacancyJobRequirementsSection
        jobRequirement={{
          ...baseJobRequirement,
          description: 'Looking for a strong backend engineer.',
        }}
      />
    );
    expect(
      screen.getByText('Looking for a strong backend engineer.')
    ).toBeInTheDocument();
  });

  it('renders the field labels for role, jobTitle, employmentType, workSchedule and engagementModel', () => {
    render(
      <VacancyJobRequirementsSection jobRequirement={baseJobRequirement} />
    );
    expect(screen.getByText('jobRequirements.role')).toBeInTheDocument();
    expect(screen.getByText('jobRequirements.jobTitle')).toBeInTheDocument();
    expect(
      screen.getByText('jobRequirements.employmentType')
    ).toBeInTheDocument();
    expect(
      screen.getByText('jobRequirements.workSchedule')
    ).toBeInTheDocument();
    expect(
      screen.getByText('jobRequirements.engagementModel')
    ).toBeInTheDocument();
  });

  it('renders tags for role, jobTitle, employmentType, workSchedule and engagementModel when present', () => {
    render(
      <VacancyJobRequirementsSection
        jobRequirement={{
          ...baseJobRequirement,
          role: ['Backend Developer'],
          jobTitle: ['Software Engineer II'],
          employmentType: ['Full-Time'],
          workSchedule: ['Standard Hours'],
          engagementModel: ['Permanent'],
        }}
      />
    );
    expect(screen.getByText('Backend Developer')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer II')).toBeInTheDocument();
    expect(screen.getByText('Full-Time')).toBeInTheDocument();
    expect(screen.getByText('Standard Hours')).toBeInTheDocument();
    expect(screen.getByText('Permanent')).toBeInTheDocument();
  });

  it('shows a dash for each chip field when its array is empty', () => {
    const { container } = render(
      <VacancyJobRequirementsSection jobRequirement={baseJobRequirement} />
    );
    // 5 Tags fields (role, jobTitle, employmentType, workSchedule, engagementModel)
    // each render a '-' when empty, plus 3 info-row dashes and 1 description dash.
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBe(9);
    expect(container.querySelector('.bg-\\[\\#f8fafc\\]')).toBeInTheDocument();
  });

  it('does not crash when multiple values are provided for every field', () => {
    expect(() =>
      render(
        <VacancyJobRequirementsSection
          jobRequirement={{
            discipline: ['Engineering'],
            careerPath: ['Management'],
            level: ['Lead'],
            role: ['Tech Lead', 'Architect'],
            jobTitle: ['Principal Engineer'],
            employmentType: ['Contract'],
            workSchedule: ['Flexible'],
            engagementModel: ['Hybrid'],
            description: 'A great opportunity.',
          }}
        />
      )
    ).not.toThrow();
  });
});
