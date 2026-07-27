import { render, screen } from '@testing-library/react';

import VacancyIdEditPage from '@/views/vacancies/pages/vacancy-id-edit-page';

// Captures the props the page hands to VacancyFormProvider. The provider is
// stubbed to render nothing, so the heavy edit stepper (EditVacancyContent)
// never mounts — this test only verifies the create-vs-edit prop wiring
// (DQCGP-2924: field-level template visibility must be restored on edit).
interface CapturedProviderProps {
  visibleStepKeys?: string[];
  templateFieldVisibility?: Record<string, Record<string, boolean>>;
  templateId?: string;
}
const providerProps = vi.hoisted(() => ({
  current: undefined as CapturedProviderProps | undefined,
}));

const useVacancyByIdQueryMock = vi.hoisted(() => vi.fn());
const useVacancyTemplateByIdQueryMock = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => ({
    keycloak: { authenticated: true },
    initialized: true,
  }),
}));

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: 'vacancy-1' }),
  };
});

vi.mock('@/views/vacancies/hooks', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/hooks')>();
  return {
    ...actual,
    useVacancyByIdQuery: (...args: unknown[]) =>
      useVacancyByIdQueryMock(...args) as unknown,
    useVacancyTemplateByIdQuery: (...args: unknown[]) =>
      useVacancyTemplateByIdQueryMock(...args) as unknown,
  };
});

// Stub the provider (capture props, render nothing) and neutralise the
// step-inference helper so only the template-driven path is under test.
vi.mock(
  '@/views/vacancies/context/vacancy-form-context',
  async importOriginal => {
    const actual =
      await importOriginal<
        typeof import('@/views/vacancies/context/vacancy-form-context')
      >();
    return {
      ...actual,
      getEnabledStepKeys: () => [],
      VacancyFormProvider: (props: CapturedProviderProps) => {
        providerProps.current = props;
        return <div data-testid="provider" />;
      },
    };
  }
);

// Keep the real template mapper; stub only the edit-response mapper used by the
// fallback step inference (irrelevant here, and avoids feeding it a full record).
vi.mock('@/views/vacancies/utils/vacancy-edit-response-helpers', () => ({
  toVacancyFormFromResponse: () => ({}),
}));

function setVacancy(data: Record<string, unknown>, isLoading = false) {
  useVacancyByIdQueryMock.mockReturnValue({
    data: { success: true, data },
    isLoading,
  });
}

describe('VacancyIdEditPage — template field-visibility restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerProps.current = undefined;
    useVacancyTemplateByIdQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
  });

  it('restores field visibility from the source template on edit', () => {
    setVacancy({ vacancyTemplateId: 'tmpl-1' });
    useVacancyTemplateByIdQueryMock.mockReturnValue({
      data: {
        success: true,
        data: {
          requestBody: {
            title: '',
            status: '',
            lastActiveStep: '',
            templateId: 'tmpl-1',
            data: {
              clubsAndSocieties: {
                isEnabled: true,
                dataTakenFromCandidate: false,
                content: {
                  clubSociety: true,
                  organization: false,
                  organizationLocations: true,
                  positionRoleHeld: false,
                  startDate: false,
                  endDate: false,
                },
              },
              skills: {
                isEnabled: true,
                dataTakenFromCandidate: false,
                content: { skillCareerPath: true },
              },
            },
          },
        },
      },
      isLoading: false,
    });

    render(<VacancyIdEditPage />);

    const props = providerProps.current;
    expect(props).toBeDefined();
    // Field-level visibility flags are rebuilt from the template content map.
    expect(props?.templateFieldVisibility?.clubsAndSocieties).toEqual({
      clubSociety: true,
      organization: false,
      organizationLocations: true,
      positionRoleHeld: false,
      startDate: false,
      endDate: false,
    });
    expect(props?.templateFieldVisibility?.skills).toEqual({
      skillCareerPath: true,
    });
    // Authoritative step list comes from the template (mandatory + enabled).
    expect(props?.visibleStepKeys).toEqual(
      expect.arrayContaining([
        'job-requirements',
        'schedule-vacancy',
        'preferred-club-societies',
        'preferred-skills',
      ])
    );
    expect(props?.templateId).toBe('tmpl-1');
  });

  it('does not fetch a template or gate fields for a normal vacancy', () => {
    setVacancy({ vacancyTemplateId: null });

    render(<VacancyIdEditPage />);

    // Template query is disabled for non-template vacancies.
    expect(useVacancyTemplateByIdQueryMock).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ enabled: false })
    );
    const props = providerProps.current;
    expect(props?.templateFieldVisibility).toBeUndefined();
    expect(props?.templateId).toBeUndefined();
  });

  it('holds the provider behind a skeleton until the template resolves', () => {
    setVacancy({ vacancyTemplateId: 'tmpl-1' });
    useVacancyTemplateByIdQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<VacancyIdEditPage />);

    // Provider must not mount (and thus fields must not render) with all-visible
    // defaults while the template is still loading.
    expect(screen.queryByTestId('provider')).not.toBeInTheDocument();
  });
});
