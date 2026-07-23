import { render, screen } from '@testing-library/react';

import { VacancyProfileRequirementsSection } from '@/views/vacancies/components/view-vacancy/vacancy-profile-requirements-section';
import type { VacancyViewModel } from '@/views/vacancies/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseProfileRequirement: VacancyViewModel['profileRequirement'] = {
  isEnabled: true,
  dataTakenFromCandidate: false,
  gender: '',
  maritalStatus: '',
  addresses: [],
};

describe('VacancyProfileRequirementsSection', () => {
  it('renders nothing when profileRequirement is undefined', () => {
    const { container } = render(
      <VacancyProfileRequirementsSection
        profileRequirement={
          undefined as unknown as VacancyViewModel['profileRequirement']
        }
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyProfileRequirementsSection
        profileRequirement={{ ...baseProfileRequirement, isEnabled: false }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the no-details state when dataTakenFromCandidate is true', () => {
    render(
      <VacancyProfileRequirementsSection
        profileRequirement={{
          ...baseProfileRequirement,
          dataTakenFromCandidate: true,
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

  it('renders the section title', () => {
    render(
      <VacancyProfileRequirementsSection
        profileRequirement={baseProfileRequirement}
      />
    );
    expect(screen.getByText('profileRequirements.title')).toBeInTheDocument();
  });

  it('renders the gender and marital status labels with a dash when values are empty', () => {
    render(
      <VacancyProfileRequirementsSection
        profileRequirement={baseProfileRequirement}
      />
    );
    expect(screen.getByText('profileRequirements.gender')).toBeInTheDocument();
    expect(
      screen.getByText('profileRequirements.maritalStatus')
    ).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2);
  });

  it('renders gender and marital status values when present', () => {
    render(
      <VacancyProfileRequirementsSection
        profileRequirement={{
          ...baseProfileRequirement,
          gender: 'Female',
          maritalStatus: 'Single',
        }}
      />
    );
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Single')).toBeInTheDocument();
  });

  it('does not render the addresses grid when addresses is empty', () => {
    const { container } = render(
      <VacancyProfileRequirementsSection
        profileRequirement={baseProfileRequirement}
      />
    );
    expect(container.querySelector('.grid-cols-1')).toBeNull();
  });

  it('renders a single address card with city, state, country and postal code', () => {
    render(
      <VacancyProfileRequirementsSection
        profileRequirement={{
          ...baseProfileRequirement,
          addresses: [
            {
              city: 'Colombo',
              stateProvince: 'Western',
              country: 'Sri Lanka',
              postalCode: '00100',
            },
          ],
        }}
      />
    );
    expect(
      screen.getByText('profileRequirements.addressesTitle 01')
    ).toBeInTheDocument();
    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(screen.getByText('Western')).toBeInTheDocument();
    expect(screen.getByText('Sri Lanka')).toBeInTheDocument();
    expect(screen.getByText('00100')).toBeInTheDocument();
  });

  it('shows a dash for each address field that is empty', () => {
    render(
      <VacancyProfileRequirementsSection
        profileRequirement={{
          ...baseProfileRequirement,
          addresses: [
            { city: '', stateProvince: '', country: '', postalCode: '' },
          ],
        }}
      />
    );
    // 2 dashes from gender/maritalStatus + 4 from the empty address fields
    expect(screen.getAllByText('-')).toHaveLength(6);
  });

  it('renders multiple addresses in reverse order with descending, zero-padded titles', () => {
    render(
      <VacancyProfileRequirementsSection
        profileRequirement={{
          ...baseProfileRequirement,
          addresses: [
            {
              city: 'Colombo',
              stateProvince: 'Western',
              country: 'Sri Lanka',
              postalCode: '00100',
            },
            {
              city: 'Kandy',
              stateProvince: 'Central',
              country: 'Sri Lanka',
              postalCode: '20000',
            },
          ],
        }}
      />
    );
    const titles = screen.getAllByRole('heading', { level: 3 });
    expect(titles[0]).toHaveTextContent(
      'profileRequirements.addressesTitle 02'
    );
    expect(titles[1]).toHaveTextContent(
      'profileRequirements.addressesTitle 01'
    );
    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(screen.getByText('Kandy')).toBeInTheDocument();
  });

  it('does not crash when many addresses are provided', () => {
    expect(() =>
      render(
        <VacancyProfileRequirementsSection
          profileRequirement={{
            ...baseProfileRequirement,
            gender: 'Male',
            maritalStatus: 'Married',
            addresses: [
              {
                city: 'Colombo',
                stateProvince: 'Western',
                country: 'Sri Lanka',
                postalCode: '00100',
              },
              {
                city: 'Galle',
                stateProvince: 'Southern',
                country: 'Sri Lanka',
                postalCode: '80000',
              },
              {
                city: 'Jaffna',
                stateProvince: 'Northern',
                country: 'Sri Lanka',
                postalCode: '40000',
              },
            ],
          }}
        />
      )
    ).not.toThrow();
  });
});
