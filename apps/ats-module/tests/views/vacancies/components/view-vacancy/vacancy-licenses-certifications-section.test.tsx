import { render, screen } from '@testing-library/react';

import { VacancyLicensesCertificationsSection } from '@/views/vacancies/components/view-vacancy/vacancy-licenses-certifications-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseEntry = {
  nameOfLicenseCert: [],
  issuingOrganization: [],
  organizationLocations: [],
  internationallyAccepted: false,
  issueDate: '',
  expirationDate: '',
};

describe('VacancyLicensesCertificationsSection', () => {
  it('renders nothing when licenseCertificates is undefined', () => {
    const { container } = render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={undefined}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: false,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, nameOfLicenseCert: ['AWS Certified'] }],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
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
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
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
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, nameOfLicenseCert: ['AWS Certified'] }],
        }}
      />
    );
    expect(
      screen.getByText('licenseCertificates.title')
    ).toBeInTheDocument();
  });

  it('formats issueDate and expirationDate as a date range', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              issueDate: '2022-01-02',
              expirationDate: '2023-06-15',
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText('2nd Jan 2022 - 15th Jun 2023')
    ).toBeInTheDocument();
  });

  it('shows "Present" when only issueDate is provided', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, issueDate: '2022-03-05', expirationDate: '' },
          ],
        }}
      />
    );
    expect(screen.getByText('5th Mar 2022 - Present')).toBeInTheDocument();
  });

  it('shows "Until" when only expirationDate is provided', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, issueDate: '', expirationDate: '2024-11-01' },
          ],
        }}
      />
    );
    expect(screen.getByText('Until 1st Nov 2024')).toBeInTheDocument();
  });

  it('renders the internationally accepted row when internationallyAccepted is true', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, internationallyAccepted: true }],
        }}
      />
    );
    expect(
      screen.getByText('licenseCertificates.internationallyAcceptedShort')
    ).toBeInTheDocument();
  });

  it('does not render the internationally accepted row when internationallyAccepted is false', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry, internationallyAccepted: false }],
        }}
      />
    );
    expect(
      screen.queryByText('licenseCertificates.internationallyAcceptedShort')
    ).not.toBeInTheDocument();
  });

  it('renders nameOfLicenseCert tags', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              ...baseEntry,
              nameOfLicenseCert: ['AWS Certified', 'PMP'],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('AWS Certified')).toBeInTheDocument();
    expect(screen.getByText('PMP')).toBeInTheDocument();
  });

  it('renders issuingOrganization tags', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, issuingOrganization: ['Amazon', 'PMI'] },
          ],
        }}
      />
    );
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('PMI')).toBeInTheDocument();
  });

  it('renders organizationLocations tags', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, organizationLocations: ['Colombo', 'London'] },
          ],
        }}
      />
    );
    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('shows the field labels', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [{ ...baseEntry }],
        }}
      />
    );
    expect(
      screen.getByText('licenseCertificates.nameOfLicenseCert')
    ).toBeInTheDocument();
    expect(
      screen.getByText('licenseCertificates.issuingOrganization')
    ).toBeInTheDocument();
    expect(
      screen.getByText('licenseCertificates.organizationLocations')
    ).toBeInTheDocument();
  });

  it('renders multiple content entries', () => {
    render(
      <VacancyLicensesCertificationsSection
        licenseCertificates={{
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            { ...baseEntry, nameOfLicenseCert: ['AWS Certified'] },
            { ...baseEntry, nameOfLicenseCert: ['PMP'] },
          ],
        }}
      />
    );
    expect(screen.getByText('AWS Certified')).toBeInTheDocument();
    expect(screen.getByText('PMP')).toBeInTheDocument();
  });

  it('does not crash when all entry fields are empty', () => {
    expect(() =>
      render(
        <VacancyLicensesCertificationsSection
          licenseCertificates={{
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [{ ...baseEntry }],
          }}
        />
      )
    ).not.toThrow();
  });
});
