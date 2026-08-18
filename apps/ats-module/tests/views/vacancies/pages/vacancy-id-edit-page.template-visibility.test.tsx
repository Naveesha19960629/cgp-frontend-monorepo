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
const useVacancyTemplateSnapshotQueryMock = vi.hoisted(() => vi.fn());

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
    useVacancyTemplateSnapshotQuery: (...args: unknown[]) =>
      useVacancyTemplateSnapshotQueryMock(...args) as unknown,
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

/** A GET /vacancy-templates/{id}-shaped body; the snapshot endpoint matches it. */
function templateUseResponse(data: Record<string, unknown>) {
  return {
    success: true,
    data: {
      requestBody: {
        title: '',
        status: '',
        lastActiveStep: '',
        templateId: 'tmpl-1',
        data,
      },
    },
  };
}

const CLUBS_AND_SKILLS = {
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
};

describe('VacancyIdEditPage — template field-visibility restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerProps.current = undefined;
    useVacancyTemplateByIdQueryMock.mockReturnValue({
      data: undefined,
      isFetched: true,
    });
    useVacancyTemplateSnapshotQueryMock.mockReturnValue({
      data: undefined,
      isFetched: true,
    });
  });

  it('restores field visibility from the template snapshot on edit', () => {
    setVacancy({ vacancyTemplateId: 'tmpl-1' });
    useVacancyTemplateSnapshotQueryMock.mockReturnValue({
      data: templateUseResponse(CLUBS_AND_SKILLS),
      isFetched: true,
    });

    render(<VacancyIdEditPage />);

    const props = providerProps.current;
    expect(props).toBeDefined();
    // Field-level visibility flags are rebuilt from the snapshot content map.
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
    // Authoritative step list comes from the snapshot (mandatory + enabled).
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

  it('reads the snapshot keyed by vacancy id, not by template id', () => {
    setVacancy({ vacancyTemplateId: 'tmpl-1' });

    render(<VacancyIdEditPage />);

    expect(useVacancyTemplateSnapshotQueryMock).toHaveBeenCalledWith(
      'vacancy-1',
      expect.objectContaining({ enabled: true })
    );
  });

  it('never reads the live template when a snapshot exists (AC 8: template edits must not leak into existing vacancies)', () => {
    setVacancy({ vacancyTemplateId: 'tmpl-1' });
    useVacancyTemplateSnapshotQueryMock.mockReturnValue({
      data: templateUseResponse(CLUBS_AND_SKILLS),
      isFetched: true,
    });
    // The live template has since been edited to drop clubs and add languages.
    useVacancyTemplateByIdQueryMock.mockReturnValue({
      data: templateUseResponse({
        languages: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: { language: true },
        },
      }),
      isFetched: true,
    });

    render(<VacancyIdEditPage />);

    // The live-template query stays disabled...
    expect(useVacancyTemplateByIdQueryMock).toHaveBeenCalledWith(
      'tmpl-1',
      expect.objectContaining({ enabled: false })
    );
    // ...and the drifted definition does not reach the form.
    const props = providerProps.current;
    expect(props?.templateFieldVisibility?.languages).toBeUndefined();
    expect(props?.templateFieldVisibility?.clubsAndSocieties).toBeDefined();
    expect(props?.visibleStepKeys).not.toContain('preferred-languages');
  });

  it('falls back to the live template when no snapshot exists (pre-snapshot vacancies)', () => {
    setVacancy({ vacancyTemplateId: 'tmpl-1' });
    // 404 → settled with no data.
    useVacancyTemplateSnapshotQueryMock.mockReturnValue({
      data: undefined,
      isFetched: true,
    });
    useVacancyTemplateByIdQueryMock.mockReturnValue({
      data: templateUseResponse(CLUBS_AND_SKILLS),
      isFetched: true,
    });

    render(<VacancyIdEditPage />);

    // Fallback query is enabled only in this case.
    expect(useVacancyTemplateByIdQueryMock).toHaveBeenCalledWith(
      'tmpl-1',
      expect.objectContaining({ enabled: true })
    );
    const props = providerProps.current;
    expect(props?.templateFieldVisibility?.skills).toEqual({
      skillCareerPath: true,
    });
    expect(props?.visibleStepKeys).toEqual(
      expect.arrayContaining(['preferred-club-societies', 'preferred-skills'])
    );
  });

  it('does not fetch a template or gate fields for a normal vacancy', () => {
    setVacancy({ vacancyTemplateId: null });

    render(<VacancyIdEditPage />);

    // Both template queries are disabled for non-template vacancies.
    expect(useVacancyTemplateSnapshotQueryMock).toHaveBeenCalledWith(
      'vacancy-1',
      expect.objectContaining({ enabled: false })
    );
    expect(useVacancyTemplateByIdQueryMock).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ enabled: false })
    );
    const props = providerProps.current;
    expect(props?.templateFieldVisibility).toBeUndefined();
    expect(props?.templateId).toBeUndefined();
  });

  it('holds the provider behind a skeleton until the snapshot resolves', () => {
    setVacancy({ vacancyTemplateId: 'tmpl-1' });
    useVacancyTemplateSnapshotQueryMock.mockReturnValue({
      data: undefined,
      isFetched: false,
    });

    render(<VacancyIdEditPage />);

    // Provider must not mount (and thus fields must not render) with all-visible
    // defaults while the template definition is still loading.
    expect(screen.queryByTestId('provider')).not.toBeInTheDocument();
  });

  it('holds the provider behind a skeleton while the live-template fallback resolves', () => {
    setVacancy({ vacancyTemplateId: 'tmpl-1' });
    useVacancyTemplateSnapshotQueryMock.mockReturnValue({
      data: undefined,
      isFetched: true,
    });
    useVacancyTemplateByIdQueryMock.mockReturnValue({
      data: undefined,
      isFetched: false,
    });

    render(<VacancyIdEditPage />);

    expect(screen.queryByTestId('provider')).not.toBeInTheDocument();
  });
});
