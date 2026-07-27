import { render, screen } from '@testing-library/react';

import { VacancyPublicationsSection } from '@/views/vacancies/components/view-vacancy/vacancy-publications-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseEntry = {
  acceptedPublisherName: '',
  publishedDateFrom: '',
  publishedDateTo: '',
};

describe('VacancyPublicationsSection', () => {
  it('renders nothing when preferredPublications is undefined', () => {
    const { container } = render(
      <VacancyPublicationsSection preferredPublications={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyPublicationsSection
        preferredPublications={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, acceptedPublisherName: 'Nature' }],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyPublicationsSection
        preferredPublications={{
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
      <VacancyPublicationsSection
        preferredPublications={{
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
      <VacancyPublicationsSection
        preferredPublications={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, acceptedPublisherName: 'Nature' }],
        }}
      />
    );
    expect(screen.getByText('preferredPublications.title')).toBeInTheDocument();
  });

  it('renders the publisher field label and value', () => {
    render(
      <VacancyPublicationsSection
        preferredPublications={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, acceptedPublisherName: 'Nature' }],
        }}
      />
    );
    expect(
      screen.getByText('preferredPublications.fieldList.publisher')
    ).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
  });

  it('shows a dash for the publisher value when it is empty', () => {
    render(
      <VacancyPublicationsSection
        preferredPublications={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry }],
        }}
      />
    );
    expect(
      screen.getByText('preferredPublications.fieldList.publisher')
    ).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('formats publishedDateFrom and publishedDateTo as a date range', () => {
    render(
      <VacancyPublicationsSection
        preferredPublications={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              publishedDateFrom: '2022-01-02',
              publishedDateTo: '2023-06-15',
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText('2nd Jan 2022 - 15th Jun 2023')
    ).toBeInTheDocument();
  });

  it('shows "- Present" when only publishedDateFrom is set', () => {
    render(
      <VacancyPublicationsSection
        preferredPublications={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, publishedDateFrom: '2022-03-05' }],
        }}
      />
    );
    expect(screen.getByText('5th Mar 2022 - Present')).toBeInTheDocument();
  });

  it('shows "Until ..." when only publishedDateTo is set', () => {
    render(
      <VacancyPublicationsSection
        preferredPublications={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, publishedDateTo: '2024-11-01' }],
        }}
      />
    );
    expect(screen.getByText('Until 1st Nov 2024')).toBeInTheDocument();
  });

  it('renders multiple content entries', () => {
    render(
      <VacancyPublicationsSection
        preferredPublications={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, acceptedPublisherName: 'Nature' },
            { ...baseEntry, acceptedPublisherName: 'Science' },
          ],
        }}
      />
    );
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('does not crash when all entry fields are empty', () => {
    expect(() =>
      render(
        <VacancyPublicationsSection
          preferredPublications={{
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [{ ...baseEntry }],
          }}
        />
      )
    ).not.toThrow();
  });
});
