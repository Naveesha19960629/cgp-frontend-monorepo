import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyIdEditJdPage from '@/views/vacancies/pages/vacancy-id-edit-jd-page';

const mockNavigate = vi.fn();
const mockUseVacancyJobDescriptionQuery = vi.fn<() => unknown>();
const mockUseEditJobDescriptionForm = vi.fn<() => unknown>();
const mockUseUpdateVacancyJobDescriptionMutation = vi.fn<() => unknown>();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-vacancy-id' }),
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useVacancyJobDescriptionQuery: () => mockUseVacancyJobDescriptionQuery(),
  useEditJobDescriptionForm: () => mockUseEditJobDescriptionForm(),
  useUpdateVacancyJobDescriptionMutation: () =>
    mockUseUpdateVacancyJobDescriptionMutation(),
}));

// Stub heavy child components not under test
vi.mock('@/views/vacancies/components/field-toggle', () => ({
  default: () => <div data-testid="field-toggle" />,
}));

vi.mock('@/views/vacancies/components/section-card', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section-card">{children}</div>
  ),
}));

// Render a lightweight test double for the cancel dialog so we can assert
// open/close and button clicks without pulling in Radix portal internals.
vi.mock('@/views/vacancies/components', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/components')>();
  return {
    ...actual,
    VacancyEditCancelDialog: ({
      open,
      onOpenChange,
      onConfirm,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onConfirm: () => void;
    }) =>
      open ? (
        <div role="dialog" aria-label="vacancyEditCancelDialog.title">
          <p>vacancyEditCancelDialog.title</p>
          <button onClick={() => onOpenChange(false)}>
            vacancyEditCancelDialog.noButton
          </button>
          <button onClick={onConfirm}>vacancyEditCancelDialog.yesButton</button>
        </div>
      ) : null,
  };
});

const mockForm = {
  watch: vi.fn(() => ({})),
  getValues: vi.fn(() => ({})),
};

const makeFormReturn = (isDirty = false) => ({
  form: mockForm,
  toggleField: vi.fn(),
  getAllFields: vi.fn(() => []),
  isDirty,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Default: query loading — keeps section grid out of the way
  mockUseVacancyJobDescriptionQuery.mockReturnValue({
    isLoading: true,
    data: undefined,
    error: null,
  });
  mockUseEditJobDescriptionForm.mockReturnValue(makeFormReturn(false));
  mockUseUpdateVacancyJobDescriptionMutation.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  });
});

describe('VacancyIdEditJdPage — cancel button behaviour', () => {
  it('navigates immediately when Cancel is clicked and form has no unsaved changes', async () => {
    const user = userEvent.setup();
    mockUseEditJobDescriptionForm.mockReturnValue(makeFormReturn(false));

    render(<VacancyIdEditJdPage />);
    await user.click(screen.getByText('editJobDescription.cancel'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/ats/vacancies');
    expect(
      screen.queryByRole('dialog', { name: 'vacancyEditCancelDialog.title' })
    ).not.toBeInTheDocument();
  });

  it('opens the confirmation dialog when Cancel is clicked and form has unsaved changes', async () => {
    const user = userEvent.setup();
    mockUseEditJobDescriptionForm.mockReturnValue(makeFormReturn(true));

    render(<VacancyIdEditJdPage />);
    await user.click(screen.getByText('editJobDescription.cancel'));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: 'vacancyEditCancelDialog.title' })
    ).toBeInTheDocument();
  });

  it('opens the confirmation dialog when the back chevron is clicked and form has unsaved changes', async () => {
    const user = userEvent.setup();
    mockUseEditJobDescriptionForm.mockReturnValue(makeFormReturn(true));

    render(<VacancyIdEditJdPage />);
    await user.click(screen.getByRole('button', { name: 'common.back' }));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: 'vacancyEditCancelDialog.title' })
    ).toBeInTheDocument();
  });

  it('closes the dialog and stays on the page when "No" is clicked', async () => {
    const user = userEvent.setup();
    mockUseEditJobDescriptionForm.mockReturnValue(makeFormReturn(true));

    render(<VacancyIdEditJdPage />);
    await user.click(screen.getByText('editJobDescription.cancel'));
    await user.click(screen.getByText('vacancyEditCancelDialog.noButton'));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('dialog', { name: 'vacancyEditCancelDialog.title' })
    ).not.toBeInTheDocument();
  });

  it('navigates to vacancies list when "Yes" is clicked', async () => {
    const user = userEvent.setup();
    mockUseEditJobDescriptionForm.mockReturnValue(makeFormReturn(true));

    render(<VacancyIdEditJdPage />);
    await user.click(screen.getByText('editJobDescription.cancel'));
    await user.click(screen.getByText('vacancyEditCancelDialog.yesButton'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/ats/vacancies');
  });
});

describe('VacancyIdEditJdPage — footer button styling', () => {
  it('applies the Figma-specified colors and sizing to the Cancel and Update buttons', () => {
    // Regression test: Cancel previously used the ui-kit `secondary` variant
    // (oklch(0.97 0 0) bg / oklch(0.205 0 0) text ≈ #f5f5f5 / #171717) and
    // Update used the generic brand-primary token (#0f5351) at h-12/w-44 —
    // all visibly diverged from Figma node 4229:245390 (#e5e5e5 bg /
    // #525252 text, 193x56, 8px radius) and node 4229:245391 (#075056 bg,
    // white text, same size/radius).
    render(<VacancyIdEditJdPage />);

    const cancelButton = screen.getByRole('button', {
      name: 'editJobDescription.cancel',
    });
    const updateButton = screen.getByRole('button', {
      name: 'editJobDescription.update',
    });

    expect(cancelButton).toHaveClass('bg-[#e5e5e5]', 'text-[#525252]');
    expect(updateButton).toHaveClass('bg-[#075056]', 'text-white');

    for (const button of [cancelButton, updateButton]) {
      expect(button).toHaveClass('h-14', 'w-48.25', 'rounded-lg');
    }
  });
});
