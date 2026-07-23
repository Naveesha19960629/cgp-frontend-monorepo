import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import NewVacancyFromTemplatePage from '@/views/vacancies/pages/new-vacancy-from-template-page';

const setForm = vi.fn();
const setCurrentStepIndex = vi.fn();

let templateIdParam: string | undefined = 'template-1';
let isInitialStep = true;
let queryState: {
  data?: {
    success: boolean;
    message?: string;
    data?: { requestBody?: unknown };
  };
  isLoading: boolean;
  error: unknown;
} = { isLoading: false, error: null };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ templateId: templateIdParam }),
}));

vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => ({
    keycloak: { authenticated: true },
    initialized: true,
  }),
}));

vi.mock('@/views/vacancies/hooks', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/hooks')>();
  return {
    ...actual,
    useVacancyTemplateByIdQuery: () => queryState,
  };
});

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  DEFAULT_FORM: {
    title: '',
    status: 'draft',
    lastActiveStep: 'job-requirements',
  },
  VacancyFormProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="form-provider">{children}</div>
  ),
  useVacancyForm: () => ({
    isInitialStep,
    setForm,
    setCurrentStepIndex,
  }),
}));

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    VacancyTitleStep: () => <div>Mock Title Step</div>,
    VacancyCreateStepperForm: () => <div>Mock Vacancy Stepper</div>,
  };
});

describe('NewVacancyFromTemplatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    templateIdParam = 'template-1';
    isInitialStep = true;
    queryState = { isLoading: false, error: null };
  });

  it('shows an invalid id error when there is no templateId param', () => {
    templateIdParam = undefined;
    render(<NewVacancyFromTemplatePage />);

    expect(screen.getByText('vacancies.edit.invalidId')).toBeInTheDocument();
    expect(screen.getByText('common.error.title')).toBeInTheDocument();
  });

  it('shows the loading skeleton while the template is being fetched', () => {
    queryState = { isLoading: true, error: null };
    render(<NewVacancyFromTemplatePage />);

    expect(screen.queryByText('common.error.title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('form-provider')).not.toBeInTheDocument();
  });

  it('shows the fallback error message when the query errors', () => {
    queryState = { isLoading: false, error: new Error('boom') };
    render(<NewVacancyFromTemplatePage />);

    expect(
      screen.getByText('templates.useTemplate.failedToLoadTemplate')
    ).toBeInTheDocument();
  });

  it('shows the response message when the load is unsuccessful', () => {
    queryState = {
      isLoading: false,
      error: null,
      data: { success: false, message: 'Custom failure message' },
    };
    render(<NewVacancyFromTemplatePage />);

    expect(screen.getByText('Custom failure message')).toBeInTheDocument();
  });

  it('shows the fallback error message when requestBody is missing', () => {
    queryState = {
      isLoading: false,
      error: null,
      data: { success: true, data: {} },
    };
    render(<NewVacancyFromTemplatePage />);

    expect(
      screen.getByText('templates.useTemplate.failedToLoadTemplate')
    ).toBeInTheDocument();
  });

  it('renders the wizard and hydrates the form once the template loads successfully', () => {
    queryState = {
      isLoading: false,
      error: null,
      data: { success: true, data: { requestBody: { data: {} } } },
    };
    render(<NewVacancyFromTemplatePage />);

    expect(screen.getByTestId('form-provider')).toBeInTheDocument();
    expect(screen.getByText('Mock Title Step')).toBeInTheDocument();
    expect(setForm).toHaveBeenCalledTimes(1);
    expect(setCurrentStepIndex).toHaveBeenCalledWith(0);
  });

  it('renders the stepper form once past the initial step', () => {
    isInitialStep = false;
    queryState = {
      isLoading: false,
      error: null,
      data: { success: true, data: { requestBody: { data: {} } } },
    };
    render(<NewVacancyFromTemplatePage />);

    expect(screen.getByText('Mock Vacancy Stepper')).toBeInTheDocument();
    expect(screen.queryByText('Mock Title Step')).not.toBeInTheDocument();
  });
});
