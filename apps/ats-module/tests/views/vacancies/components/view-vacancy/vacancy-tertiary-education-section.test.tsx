import { render, screen } from '@testing-library/react';

import { VacancyTertiaryEducationSection } from '@/views/vacancies/components/view-vacancy/vacancy-tertiary-education-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseEntry = {
  qualificationName: [],
  tertiaryAwardingBody: [],
  tertiaryAwardingBodyLocations: [],
  levelOfQualification: [],
  specialization: [],
  studyMode: [],
  studyPattern: [],
  deliverySchedule: [],
  batch: [],
  department: [],
  faculty: [],
  grade: '',
};

describe('VacancyTertiaryEducationSection', () => {
  it('renders nothing when tertiaryEducation is undefined', () => {
    const { container } = render(<VacancyTertiaryEducationSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'A' }],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
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
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
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
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'First Class' }],
        }}
      />
    );
    expect(screen.getByText('tertiaryEducation.title')).toBeInTheDocument();
  });

  it('displays grade as an info row when present', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'First Class Honours' }],
        }}
      />
    );
    expect(screen.getByText('tertiaryEducation.grade')).toBeInTheDocument();
    expect(screen.getByText('First Class Honours')).toBeInTheDocument();
  });

  it('does not display grade row when grade is empty', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, qualificationName: ['BSc'] }],
        }}
      />
    );
    expect(
      screen.queryByText('tertiaryEducation.grade')
    ).not.toBeInTheDocument();
  });

  it('renders qualificationName tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, qualificationName: ['BSc', 'MSc'] }],
        }}
      />
    );
    expect(screen.getByText('BSc')).toBeInTheDocument();
    expect(screen.getByText('MSc')).toBeInTheDocument();
    expect(
      screen.getByText('tertiaryEducation.qualificationName')
    ).toBeInTheDocument();
  });

  it('renders tertiaryAwardingBody tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, tertiaryAwardingBody: ['University of Colombo'] },
          ],
        }}
      />
    );
    expect(screen.getByText('University of Colombo')).toBeInTheDocument();
    expect(
      screen.getByText('tertiaryEducation.tertiaryAwardingBody')
    ).toBeInTheDocument();
  });

  it('renders tertiaryAwardingBodyLocations tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              tertiaryAwardingBodyLocations: ['Sri Lanka', 'UK'],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('Sri Lanka')).toBeInTheDocument();
    expect(screen.getByText('UK')).toBeInTheDocument();
    expect(
      screen.getByText('tertiaryEducation.tertiaryAwardingBodyLocations')
    ).toBeInTheDocument();
  });

  it('renders levelOfQualification tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, levelOfQualification: ['Undergraduate'] }],
        }}
      />
    );
    expect(screen.getByText('Undergraduate')).toBeInTheDocument();
    expect(
      screen.getByText('tertiaryEducation.levelOfQualification')
    ).toBeInTheDocument();
  });

  it('renders specialization tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, specialization: ['AI', 'ML'] }],
        }}
      />
    );
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('ML')).toBeInTheDocument();
  });

  it('renders studyMode tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, studyMode: ['Full Time'] }],
        }}
      />
    );
    expect(screen.getByText('Full Time')).toBeInTheDocument();
    expect(screen.getByText('tertiaryEducation.studyMode')).toBeInTheDocument();
  });

  it('renders studyPattern tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, studyPattern: ['Semester'] }],
        }}
      />
    );
    expect(screen.getByText('Semester')).toBeInTheDocument();
  });

  it('renders deliverySchedule tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, deliverySchedule: ['Evening'] }],
        }}
      />
    );
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });

  it('renders batch tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, batch: ['2023', '2024'] }],
        }}
      />
    );
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('tertiaryEducation.batch')).toBeInTheDocument();
  });

  it('renders department tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, department: ['Computer Science'] }],
        }}
      />
    );
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(
      screen.getByText('tertiaryEducation.department')
    ).toBeInTheDocument();
  });

  it('renders faculty tags', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, faculty: ['Engineering'] }],
        }}
      />
    );
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('tertiaryEducation.faculty')).toBeInTheDocument();
  });

  it('only renders field rows whose data is non-empty', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              qualificationName: ['BSc'],
              // studyMode intentionally empty
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText('tertiaryEducation.qualificationName')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('tertiaryEducation.studyMode')
    ).not.toBeInTheDocument();
  });

  it('does not render the shaded grid box when all tag arrays are empty', () => {
    const { container } = render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, grade: 'A' }],
        }}
      />
    );
    expect(container.querySelector('.bg-\\[\\#f8fafc\\]')).toBeNull();
  });

  it('renders multiple content entries', () => {
    render(
      <VacancyTertiaryEducationSection
        tertiaryEducation={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, grade: 'First Class' },
            { ...baseEntry, grade: 'Second Class' },
          ],
        }}
      />
    );
    expect(screen.getAllByText('tertiaryEducation.grade')).toHaveLength(2);
    expect(screen.getByText('First Class')).toBeInTheDocument();
    expect(screen.getByText('Second Class')).toBeInTheDocument();
  });

  it('does not crash when all entry fields are empty', () => {
    expect(() =>
      render(
        <VacancyTertiaryEducationSection
          tertiaryEducation={{
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [{ ...baseEntry }],
          }}
        />
      )
    ).not.toThrow();
  });
});
