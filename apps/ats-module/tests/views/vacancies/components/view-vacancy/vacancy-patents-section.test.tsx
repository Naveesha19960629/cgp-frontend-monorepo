import { render, screen } from '@testing-library/react';

import { VacancyPatentsSection } from '@/views/vacancies/components/view-vacancy/vacancy-patents-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseEntry = {
  relatedIndustry: [],
  statuses: [],
  fromDate: '',
  toDate: '',
};

describe('VacancyPatentsSection', () => {
  it('renders nothing when preferredPatents is undefined', () => {
    const { container } = render(<VacancyPatentsSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, statuses: ['Patent Issued'] }],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
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
      <VacancyPatentsSection
        preferredPatents={{
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
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, statuses: ['Patent Issued'] }],
        }}
      />
    );
    expect(screen.getByText('preferredPatents.title')).toBeInTheDocument();
  });

  it('formats fromDate and toDate as a date range', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, fromDate: '2022-01-02', toDate: '2023-06-15' },
          ],
        }}
      />
    );
    expect(
      screen.getByText('2nd Jan 2022 - 15th Jun 2023')
    ).toBeInTheDocument();
  });

  it('shows "N/A" for toDate when only fromDate is provided', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, fromDate: '2022-03-05', toDate: '' }],
        }}
      />
    );
    expect(screen.getByText('5th Mar 2022 - N/A')).toBeInTheDocument();
  });

  it('shows "N/A" for fromDate when only toDate is provided', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, fromDate: '', toDate: '2024-11-01' }],
        }}
      />
    );
    expect(screen.getByText('N/A - 1st Nov 2024')).toBeInTheDocument();
  });

  it('does not render the date row when both fromDate and toDate are absent', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, statuses: ['Patent Pending'] }],
        }}
      />
    );
    expect(screen.queryByText(/N\/A/)).not.toBeInTheDocument();
  });

  it('renders status tags', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, statuses: ['Patent Pending', 'Patent Issued'] },
          ],
        }}
      />
    );
    expect(screen.getByText('Patent Pending')).toBeInTheDocument();
    expect(screen.getByText('Patent Issued')).toBeInTheDocument();
  });

  it('renders relatedIndustry tags', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              relatedIndustry: ['Technology', 'Healthcare'],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
  });

  it('shows the relatedIndustry field label when relatedIndustry is non-empty', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, relatedIndustry: ['Technology'] }],
        }}
      />
    );
    expect(
      screen.getByText('preferredPatents.relatedIndustry')
    ).toBeInTheDocument();
  });

  it('shows the status field label when statuses is non-empty', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, statuses: ['Patent Issued'] }],
        }}
      />
    );
    expect(screen.getByText('preferredPatents.status')).toBeInTheDocument();
  });

  it('does not render the shaded grid box when both tag arrays are empty', () => {
    const { container } = render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, fromDate: '2022-01-01' }],
        }}
      />
    );
    expect(container.querySelector('.bg-\\[\\#f8fafc\\]')).toBeNull();
  });

  it('renders multiple content entries', () => {
    render(
      <VacancyPatentsSection
        preferredPatents={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, statuses: ['Patent Issued'] },
            { ...baseEntry, statuses: ['Patent Pending'] },
          ],
        }}
      />
    );
    expect(screen.getByText('Patent Issued')).toBeInTheDocument();
    expect(screen.getByText('Patent Pending')).toBeInTheDocument();
  });

  it('does not crash when all entry fields are empty', () => {
    expect(() =>
      render(
        <VacancyPatentsSection
          preferredPatents={{
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [{ ...baseEntry }],
          }}
        />
      )
    ).not.toThrow();
  });
});
