import { render, screen } from '@testing-library/react';

import { VacancyScheduledVacancySection } from '@/views/vacancies/components/view-vacancy/vacancy-scheduled-vacancy-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('VacancyScheduledVacancySection', () => {
  it('renders scheduled vacancy details', () => {
    render(
      <VacancyScheduledVacancySection
        scheduledVacancy={{
          schedulePublishAt: '2023-02-12T21:00:00',
          expirationAt: '2023-02-13T21:00:00',
          vacancyLink: 'example.com/job-posting',
        }}
      />
    );

    expect(
      screen.getByText('vacancies.view.sections.scheduledVacancy')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.view.scheduledVacancy.publishDateTime')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.view.scheduledVacancy.expirationDateTime')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.view.scheduledVacancy.vacancyLink')
    ).toBeInTheDocument();

    expect(screen.getByText('12th Feb 2023 | 09 : 00 PM')).toBeInTheDocument();
    expect(screen.getByText('13th Feb 2023 | 09 : 00 PM')).toBeInTheDocument();
    expect(screen.getByText('example.com/job-posting')).toBeInTheDocument();
  });

  it('does not render when no scheduled vacancy data exists', () => {
    const { container } = render(<VacancyScheduledVacancySection />);

    expect(container).toBeEmptyDOMElement();
  });
});
