import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EditVacancyTemplatePage from '@/views/vacancies/pages/edit-vacancy-template-page';

const navigate = vi.fn();
const mockUpdateTemplateMutate = vi.fn();
const mockFormReset = vi.fn();
const mockOnSuccess = vi.fn();

const baseValues = {
  templateName: '',
  sections: {},
  customizableForm: false,
};

// Shape returned by the real toTemplateFormStateFromResponse — never
// includes templateName, which the page sources separately from the
// template's own `templateName` field.
const templateFormState = {
  sections: {},
  customizableForm: false,
};

let formValues = { ...baseValues };
let isDirty = false;
let queryState: {
  data?: {
    data: { templateName: string; refNumber: string; requestBody: unknown };
  };
  isLoading: boolean;
  isError: boolean;
} = { isLoading: true, isError: false };

function createMockForm() {
  return {
    watch: () => formValues,
    formState: {
      isDirty,
      dirtyFields: { templateName: false },
      errors: {},
    },
    reset: mockFormReset,
    getValues: () => formValues,
    setValue: vi.fn(),
  };
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => ({ id: 'template-1' }),
}));

vi.mock('@/views/vacancies/hooks', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/hooks')>();
  return {
    ...actual,
    useVacancyTemplateForm: () => ({
      form: createMockForm(),
      setDataTakenFromCandidate: vi.fn(),
    }),
    useVacancyTemplateByIdQuery: () => queryState,
    useUpdateTemplateMutation: () => ({
      mutate: mockUpdateTemplateMutate,
      isPending: false,
    }),
    useTemplateSaveToastHandlers: () => ({
      onSuccess: mockOnSuccess,
      onError: vi.fn(),
    }),
  };
});

vi.mock(
  '@/views/vacancies/utils/vacancy-template-payload-helpers',
  async importOriginal => {
    const actual =
      await importOriginal<
        typeof import('@/views/vacancies/utils/vacancy-template-payload-helpers')
      >();
    return {
      ...actual,
      toTemplateFormStateFromResponse: () => templateFormState,
    };
  }
);

vi.mock('@/views/vacancies/components/template-form-body', () => ({
  default: () => <div data-testid="template-form-body" />,
}));

vi.mock('@/views/vacancies/components/template-cancel-dialog', () => ({
  default: ({
    open,
    onConfirm,
  }: {
    open: boolean;
    onConfirm: () => void;
  }): ReactNode =>
    open ? (
      <div data-testid="template-cancel-dialog">
        <button onClick={onConfirm}>confirm-cancel</button>
      </div>
    ) : null,
}));

describe('EditVacancyTemplatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formValues = { ...baseValues };
    isDirty = false;
    queryState = { isLoading: true, isError: false };
  });

  it('shows the loading state while the template is being fetched', () => {
    queryState = { isLoading: true, isError: false };
    render(<EditVacancyTemplatePage />);

    expect(screen.queryByTestId('template-form-body')).not.toBeInTheDocument();
    expect(
      screen.queryByText('editTemplate.loadError')
    ).not.toBeInTheDocument();
  });

  it('shows an error message when the template fails to load', () => {
    queryState = { isLoading: false, isError: true };
    render(<EditVacancyTemplatePage />);

    expect(screen.getByText('editTemplate.loadError')).toBeInTheDocument();
  });

  it('renders the form body once the template loads successfully', () => {
    queryState = {
      isLoading: false,
      isError: false,
      data: {
        data: {
          templateName: 'Loaded Template',
          refNumber: 'REF-1',
          requestBody: {},
        },
      },
    };
    render(<EditVacancyTemplatePage />);

    expect(screen.getByTestId('template-form-body')).toBeInTheDocument();
    expect(screen.getByText('REF-1')).toBeInTheDocument();
  });

  it('rehydrates the form from the loaded template exactly once', () => {
    queryState = {
      isLoading: false,
      isError: false,
      data: {
        data: {
          templateName: 'Loaded Template',
          refNumber: 'REF-1',
          requestBody: {},
        },
      },
    };
    render(<EditVacancyTemplatePage />);

    expect(mockFormReset).toHaveBeenCalledWith({
      templateName: 'Loaded Template',
      ...templateFormState,
    });
    expect(mockFormReset).toHaveBeenCalledTimes(1);
  });

  it('disables the Update button while the form has no selection', () => {
    queryState = {
      isLoading: false,
      isError: false,
      data: {
        data: { templateName: '', refNumber: '', requestBody: {} },
      },
    };
    render(<EditVacancyTemplatePage />);

    expect(
      screen.getByRole('button', { name: 'editTemplate.update' })
    ).toBeDisabled();
  });

  it('calls updateTemplate.mutate with the id, form state and toast handlers on Update', async () => {
    formValues = {
      ...baseValues,
      templateName: 'My Template',
      customizableForm: true,
    };
    queryState = {
      isLoading: false,
      isError: false,
      data: {
        data: {
          templateName: 'My Template',
          refNumber: 'REF-1',
          requestBody: {},
        },
      },
    };
    const user = userEvent.setup();
    render(<EditVacancyTemplatePage />);

    await user.click(
      screen.getByRole('button', { name: 'editTemplate.update' })
    );

    expect(mockUpdateTemplateMutate).toHaveBeenCalledWith(
      { id: 'template-1', state: formValues, templateName: 'My Template' },
      { onSuccess: mockOnSuccess, onError: expect.any(Function) as unknown }
    );
  });

  it('navigates straight to the templates list on Cancel when the form is pristine', async () => {
    isDirty = false;
    const user = userEvent.setup();
    render(<EditVacancyTemplatePage />);

    await user.click(
      screen.getByRole('button', { name: 'editTemplate.cancel' })
    );

    expect(navigate).toHaveBeenCalledWith('/dashboard/ats/templates');
  });

  it('shows the cancel confirmation dialog on Cancel when the form is dirty', async () => {
    isDirty = true;
    const user = userEvent.setup();
    render(<EditVacancyTemplatePage />);

    await user.click(
      screen.getByRole('button', { name: 'editTemplate.cancel' })
    );

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId('template-cancel-dialog')).toBeInTheDocument();

    await user.click(screen.getByText('confirm-cancel'));
    expect(navigate).toHaveBeenCalledWith('/dashboard/ats/templates');
  });
});
