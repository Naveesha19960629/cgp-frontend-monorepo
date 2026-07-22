import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NewVacancyTemplatePage from '@/views/vacancies/pages/new-vacancy-template-page';

const navigate = vi.fn();
const mockCreateTemplateMutate = vi.fn();
const mockFormReset = vi.fn();
const mockOnConfirm = vi.fn();

const baseValues = {
  templateName: '',
  sections: {},
  customizableForm: false,
};

let formValues = { ...baseValues };
let isDirty = false;
let nextNameResponse: { templateName: string; refNumber: string } | undefined;

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
    useNextTemplateNameQuery: () => ({
      data: nextNameResponse ? { data: nextNameResponse } : undefined,
    }),
    useCreateTemplateMutation: () => ({
      mutate: mockCreateTemplateMutate,
      isPending: false,
    }),
    useTemplateSaveToastHandlers: () => ({
      onSuccess: mockOnConfirm,
      onError: vi.fn(),
    }),
  };
});

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

describe('NewVacancyTemplatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formValues = { ...baseValues };
    isDirty = false;
    nextNameResponse = undefined;
  });

  it('renders the heading and the form body', () => {
    render(<NewVacancyTemplatePage />);

    expect(screen.getByText('createTemplate.heading')).toBeInTheDocument();
    expect(screen.getByTestId('template-form-body')).toBeInTheDocument();
  });

  it('disables the Create button while the form has no selection', () => {
    render(<NewVacancyTemplatePage />);

    expect(
      screen.getByRole('button', { name: 'createTemplate.create' })
    ).toBeDisabled();
  });

  it('enables the Create button once a name and a selection are present', () => {
    formValues = {
      ...baseValues,
      templateName: 'My Template',
      customizableForm: true,
    };
    render(<NewVacancyTemplatePage />);

    expect(
      screen.getByRole('button', { name: 'createTemplate.create' })
    ).not.toBeDisabled();
  });

  it('calls createTemplate.mutate with the form state and toast handlers on Create', async () => {
    formValues = {
      ...baseValues,
      templateName: 'My Template',
      customizableForm: true,
    };
    const user = userEvent.setup();
    render(<NewVacancyTemplatePage />);

    await user.click(
      screen.getByRole('button', { name: 'createTemplate.create' })
    );

    expect(mockCreateTemplateMutate).toHaveBeenCalledWith(
      { state: formValues, templateName: 'My Template', refNumber: '' },
      { onSuccess: mockOnConfirm, onError: expect.any(Function) as unknown }
    );
  });

  it('navigates straight to the templates list on Cancel when the form is pristine', async () => {
    isDirty = false;
    const user = userEvent.setup();
    render(<NewVacancyTemplatePage />);

    await user.click(
      screen.getByRole('button', { name: 'createTemplate.cancel' })
    );

    expect(navigate).toHaveBeenCalledWith('/dashboard/ats/templates');
    expect(
      screen.queryByTestId('template-cancel-dialog')
    ).not.toBeInTheDocument();
  });

  it('shows the cancel confirmation dialog on Cancel when the form is dirty', async () => {
    isDirty = true;
    const user = userEvent.setup();
    render(<NewVacancyTemplatePage />);

    await user.click(
      screen.getByRole('button', { name: 'createTemplate.cancel' })
    );

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId('template-cancel-dialog')).toBeInTheDocument();

    await user.click(screen.getByText('confirm-cancel'));
    expect(navigate).toHaveBeenCalledWith('/dashboard/ats/templates');
  });

  it('pre-fills the template name once the auto-generated name loads', () => {
    nextNameResponse = { templateName: 'Auto Name', refNumber: 'REF-9' };
    render(<NewVacancyTemplatePage />);

    expect(mockFormReset).toHaveBeenCalledWith({
      ...baseValues,
      templateName: 'Auto Name',
    });
  });
});
