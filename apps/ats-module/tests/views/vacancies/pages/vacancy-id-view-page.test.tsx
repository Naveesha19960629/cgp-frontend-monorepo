import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyIdViewPage from '@/views/vacancies/pages/vacancy-id-view-page';

const mockNavigate = vi.fn();
const mockUseVacancyByIdQuery = vi.fn<() => unknown>();
let mockLocationState: unknown = null;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => ({
    keycloak: { authenticated: true },
    initialized: true,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-vacancy-id' }),
  useLocation: () => ({ state: mockLocationState }),
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useVacancyByIdQuery: () => mockUseVacancyByIdQuery(),
}));

// The section components pull in a lot of unrelated rendering logic; this
// page test only cares about the Back navigation wiring, so every section is
// stubbed out to keep the render focused (VacancyView/VacancyStatusBadge stay
// real since they're what onBack/title/status actually render through).
vi.mock('@/views/vacancies/components', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/components')>();
  const noop = () => null;
  return {
    ...actual,
    VacancyCausesSection: noop,
    VacancyClubsSocietiesSection: noop,
    VacancyCustomizableFormSection: noop,
    VacancyHobbiesSection: noop,
    VacancyHonoursAwardsSection: noop,
    VacancyIndustriesSection: noop,
    VacancyJobRequirementsSection: noop,
    VacancyLanguagesSection: noop,
    VacancyLicensesCertificationsSection: noop,
    VacancyPatentsSection: noop,
    VacancyProfileRequirementsSection: noop,
    VacancyProjectRequirementsSection: noop,
    VacancyPublicationsSection: noop,
    VacancyScheduledVacancySection: noop,
    VacancySecondaryEducationSection: noop,
    VacancySkillsSection: noop,
    VacancySportsSection: noop,
    VacancyTertiaryEducationSection: noop,
    VacancyVolunteeringSection: noop,
  };
});

describe('VacancyIdViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
    mockUseVacancyByIdQuery.mockReturnValue({
      data: { success: true, message: 'ok', data: { title: 'Sample Role' } },
      isLoading: false,
      error: null,
    });
  });

  it('renders the vacancy title', () => {
    render(<VacancyIdViewPage />);
    expect(screen.getByText('Sample Role')).toBeInTheDocument();
  });

  // CR-19: recruiter's search/filter criteria on View Vacancies must survive
  // a round trip into a vacancy and back. vacancies-page.tsx now passes the
  // list URL (path + query string) it navigated from as router state
  // (`{ from }`); the Back button here must return to exactly that URL so
  // the list restores its params from the URL alone, rather than always
  // resetting to the bare /vacancies path.
  it('navigates back to the retained list URL when arriving with search/filter state', async () => {
    mockLocationState = {
      from: '/dashboard/ats/vacancies?search=engineer&status=LIVE',
    };
    const user = userEvent.setup();
    render(<VacancyIdViewPage />);

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/dashboard/ats/vacancies?search=engineer&status=LIVE'
    );
  });

  it('falls back to the plain vacancies list path when no retained state is present (e.g. a direct link)', async () => {
    mockLocationState = null;
    const user = userEvent.setup();
    render(<VacancyIdViewPage />);

    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/ats/vacancies');
  });
});
