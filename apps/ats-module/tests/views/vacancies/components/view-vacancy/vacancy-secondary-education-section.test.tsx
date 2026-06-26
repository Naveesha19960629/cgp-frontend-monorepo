import { render, screen } from '@testing-library/react';

import { VacancySecondaryEducationSection } from '@/views/vacancies/components/view-vacancy/vacancy-secondary-education-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseEntry = {
  acceptsHomeSchooling: false,
  schools: [],
  schoolLocations: [],
  examinations: [],
  secondaryAwardingBody: [],
  fieldsOfStudy: [],
  grade: '',
  startDate: '',
  endDate: '',
  result: '',
};

describe('VacancySecondaryEducationSection', () => {
  it('renders nothing when secondaryEducation is undefined', () => {
    const { container } = render(<VacancySecondaryEducationSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'A' }],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows informational no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
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
      <VacancySecondaryEducationSection
        secondaryEducation={{
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
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'Z Score: 1.22' }],
        }}
      />
    );
    expect(
      screen.getByText('secondaryEducation.sectionTitle')
    ).toBeInTheDocument();
  });

  it('displays grade as an info row when present', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'Z Score: 1.22' }],
        }}
      />
    );
    expect(screen.getByText('secondaryEducation.grade')).toBeInTheDocument();
    expect(screen.getByText('Z Score: 1.22')).toBeInTheDocument();
  });

  it('does not display grade row when grade is empty', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, result: 'Mathematics: A' }],
        }}
      />
    );
    expect(
      screen.queryByText('secondaryEducation.grade')
    ).not.toBeInTheDocument();
  });

  it('formats start and end dates in do MMM yyyy format', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, startDate: '2022-01-02', endDate: '2023-02-12' },
          ],
        }}
      />
    );
    expect(
      screen.getByText('2nd Jan 2022 - 12th Feb 2023')
    ).toBeInTheDocument();
  });

  it('formats only startDate when endDate is absent', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, startDate: '2022-01-12' }],
        }}
      />
    );
    expect(screen.getByText('12th Jan 2022 - Present')).toBeInTheDocument();
  });

  it('does not render the date row when both startDate and endDate are absent', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'A' }],
        }}
      />
    );
    expect(screen.queryByText(/Present/)).not.toBeInTheDocument();
  });

  it('displays results as an info row when present', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, result: 'Mathematics: A, Physics: B' }],
        }}
      />
    );
    expect(screen.getByText('secondaryEducation.results')).toBeInTheDocument();
    expect(screen.getByText('Mathematics: A, Physics: B')).toBeInTheDocument();
  });

  it('does not display results row when result is empty', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'A' }],
        }}
      />
    );
    expect(
      screen.queryByText('secondaryEducation.results')
    ).not.toBeInTheDocument();
  });

  it('shows accepts home schooling text when acceptsHomeSchooling is true', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, acceptsHomeSchooling: true }],
        }}
      />
    );
    expect(
      screen.getByText('secondaryEducation.acceptsHomeSchooling')
    ).toBeInTheDocument();
  });

  it('does not show accepts home schooling text when acceptsHomeSchooling is false', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'A' }],
        }}
      />
    );
    expect(
      screen.queryByText('secondaryEducation.acceptsHomeSchooling')
    ).not.toBeInTheDocument();
  });

  it('renders multi-value schools as individual badge chips', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              schools: ['Royal College Colombo', 'Kingswood College Kandy'],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('Royal College Colombo')).toBeInTheDocument();
    expect(screen.getByText('Kingswood College Kandy')).toBeInTheDocument();
  });

  it('renders examinations and awarding bodies as badge chips', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              examinations: ['GCE A/L', 'GCE O/L'],
              secondaryAwardingBody: ['Edexcel GCSE'],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('GCE A/L')).toBeInTheDocument();
    expect(screen.getByText('GCE O/L')).toBeInTheDocument();
    expect(screen.getByText('Edexcel GCSE')).toBeInTheDocument();
  });

  it('only renders field rows whose data is non-empty', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              schools: ['Royal College Colombo'],
              // schoolLocations intentionally empty
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText('secondaryEducation.schoolName')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('secondaryEducation.schoolLocation')
    ).not.toBeInTheDocument();
  });

  it('does not render the shaded grid box when all tag arrays are empty', () => {
    const { container } = render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'A' }],
        }}
      />
    );
    // The shaded box has bg-[#f8fafc] class; it must not appear
    expect(container.querySelector('.bg-\\[\\#f8fafc\\]')).toBeNull();
  });

  it('renders multiple content entries', () => {
    render(
      <VacancySecondaryEducationSection
        secondaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, grade: 'A' },
            { ...baseEntry, grade: 'B' },
          ],
        }}
      />
    );
    expect(screen.getAllByText('secondaryEducation.grade')).toHaveLength(2);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('does not crash when all entry fields are empty strings and empty arrays', () => {
    expect(() =>
      render(
        <VacancySecondaryEducationSection
          secondaryEducation={{
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [{ ...baseEntry }],
          }}
        />
      )
    ).not.toThrow();
  });
});
