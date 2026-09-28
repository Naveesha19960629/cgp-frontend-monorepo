import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacanciesPage from '@/views/vacancies/pages/vacancies-page';
import type { CreateColumnsOptions } from '@/views/vacancies/types';

const navigate = vi.fn();
const useVacanciesQueryMock = vi.fn();
const useVacancyTableParamsMock = vi.fn();
const useDeleteVacancyMutationMock = vi.fn();
const useDuplicateVacancyMutationMock = vi.fn();
const useToggleVacancyStatusMutationMock = vi.fn();
const useNextTemplateNameQueryMock = vi.fn();
const useSaveVacancyAsTemplateMutationMock = vi.fn();
const createVacancyColumnsMock = vi.fn((_options: CreateColumnsOptions) => []);
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

const defaultParams = {
  page: 0,
  size: 12,
  sortBy: '',
  sortOrder: null,
  search: '',
  careerPath: '',
  discipline: '',
  status: '',
};

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

let mockLocation = { pathname: '/dashboard/ats/vacancies', search: '' };

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
    useLocation: () => mockLocation,
  };
});

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: (...args: unknown[]) => mockSuccessToast(...args) as unknown,
  ErrorToast: (...args: unknown[]) => mockErrorToast(...args) as unknown,
}));

vi.mock('@/views/vacancies', async importOriginal => {
  const actual = await importOriginal<typeof import('@/views/vacancies')>();
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useVacanciesQuery: () => useVacanciesQueryMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useVacancyTableParams: () => useVacancyTableParamsMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useDeleteVacancyMutation: () => useDeleteVacancyMutationMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useDuplicateVacancyMutation: () => useDuplicateVacancyMutationMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useToggleVacancyStatusMutation: () => useToggleVacancyStatusMutationMock(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    useNextTemplateNameQuery: () => useNextTemplateNameQueryMock(),
    useSaveVacancyAsTemplateMutation: () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      useSaveVacancyAsTemplateMutationMock(),
    VacancyDataTable: () => <div data-testid="vacancy-data-table" />,
    VacancyFilteringSection: () => (
      <div data-testid="vacancy-filtering-section" />
    ),
    VacancyTableEmptyState: () => (
      <div data-testid="vacancy-table-empty-state" />
    ),
    VacancyTablePagination: () => (
      <div data-testid="vacancy-table-pagination" />
    ),
    createVacancyColumns: (options: CreateColumnsOptions) =>
      createVacancyColumnsMock(options) as [],
  };
});

describe('VacanciesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { pathname: '/dashboard/ats/vacancies', search: '' };
    useVacanciesQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    useVacancyTableParamsMock.mockReturnValue([defaultParams, vi.fn()]);
    useDeleteVacancyMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    useDuplicateVacancyMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    useToggleVacancyStatusMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    useNextTemplateNameQueryMock.mockReturnValue({
      data: { data: { templateName: 'Template 4', refNumber: 'REF-4' } },
    });
    useSaveVacancyAsTemplateMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('shows a blocking overlay while a vacancy is being duplicated', () => {
    useDuplicateVacancyMutationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    render(<VacanciesPage />);

    expect(
      screen.getByText('vacancies.duplicateVacancy.inProgress')
    ).toBeInTheDocument();
    // Overlay div and its Spinner both expose role="status"
    expect(screen.getAllByRole('status')).not.toHaveLength(0);
  });

  it('does not render the duplicate overlay when no duplication is pending', () => {
    render(<VacanciesPage />);

    expect(
      screen.queryByText('vacancies.duplicateVacancy.inProgress')
    ).not.toBeInTheDocument();
  });

  it('renders page heading and create vacancy button when data exists', () => {
    useVacanciesQueryMock.mockReturnValue({
      isLoading: false,
      data: { data: { content: [{ id: '1' }], totalPages: 1 } },
    });

    render(<VacanciesPage />);

    expect(screen.getByText('vacancies.title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'vacancies.createVacancyButton' })
    ).toBeInTheDocument();
  });

  it('hides create vacancy button and filters when no data and no active filters', () => {
    render(<VacanciesPage />);

    expect(screen.getByText('vacancies.title')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'vacancies.createVacancyButton' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('vacancy-filtering-section')
    ).not.toBeInTheDocument();
  });

  it('navigates to create vacancy route when create button is clicked', async () => {
    const user = userEvent.setup();

    useVacanciesQueryMock.mockReturnValue({
      isLoading: false,
      data: { data: { content: [{ id: '1' }], totalPages: 1 } },
    });

    render(<VacanciesPage />);

    await user.click(
      screen.getByRole('button', { name: 'vacancies.createVacancyButton' })
    );

    expect(navigate).toHaveBeenCalledWith('/dashboard/ats/vacancies/new');
  });

  // CR-19: opening a vacancy from the (possibly filtered) list must carry
  // the current list URL along as router state, so the vacancy view page's
  // Back button can return the recruiter to the exact same search/filter
  // results instead of a bare, unfiltered /vacancies.
  it('passes the current list URL as router state to the onView column action', () => {
    mockLocation = {
      pathname: '/dashboard/ats/vacancies',
      search: '?search=engineer&status=LIVE',
    };
    useVacanciesQueryMock.mockReturnValue({
      isLoading: false,
      data: { data: { content: [{ id: '1' }], totalPages: 1 } },
    });

    render(<VacanciesPage />);

    const { onView } = createVacancyColumnsMock.mock
      .calls[0][0] as CreateColumnsOptions;
    onView('vacancy-1');

    expect(navigate).toHaveBeenCalledWith(
      '/dashboard/ats/vacancies/vacancy-1/view',
      {
        state: { from: '/dashboard/ats/vacancies?search=engineer&status=LIVE' },
      }
    );
  });

  it('shows empty state when not loading and no vacancies exist', () => {
    useVacanciesQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    render(<VacanciesPage />);

    expect(screen.getByTestId('vacancy-table-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('vacancy-data-table')).not.toBeInTheDocument();
  });

  it('shows data table when vacancies data has content', () => {
    useVacanciesQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          content: [{ id: '1' }],
          totalPages: 1,
        },
      },
    });

    render(<VacanciesPage />);

    expect(screen.getByTestId('vacancy-data-table')).toBeInTheDocument();
    expect(
      screen.queryByTestId('vacancy-table-empty-state')
    ).not.toBeInTheDocument();
  });

  describe('Save as Template dialog', () => {
    const triggerSaveAsTemplate = (vacancyId = 'vacancy-1') => {
      const options = createVacancyColumnsMock.mock.calls[0][0];
      act(() => options.onSaveAsTemplate(vacancyId));
    };

    it('opens the dialog pre-filled with the system-generated template name', () => {
      render(<VacanciesPage />);

      triggerSaveAsTemplate();

      expect(
        screen.getByRole('heading', {
          name: 'vacancySaveAsTemplateDialog.title',
        })
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('Template 4')).toBeInTheDocument();
    });

    it('shows a skeleton instead of the input while the next template name is loading', () => {
      useNextTemplateNameQueryMock.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<VacanciesPage />);
      triggerSaveAsTemplate();

      expect(screen.queryByDisplayValue('Template 4')).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(
          'vacancySaveAsTemplateDialog.namePlaceholder'
        )
      ).not.toBeInTheDocument();
    });

    it('does not show the dialog before Save as Template is triggered', () => {
      render(<VacanciesPage />);

      // The dialog's title/description are always mounted (for a11y), so
      // assert on the portal-rendered dialog content instead.
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls the mutation with the vacancy id and trimmed name, then shows a success toast', async () => {
      const user = userEvent.setup();
      const mutate = vi.fn(
        (_payload: unknown, opts: { onSuccess: () => void }) => opts.onSuccess()
      );
      useSaveVacancyAsTemplateMutationMock.mockReturnValue({
        mutate,
        isPending: false,
      });

      render(<VacanciesPage />);
      triggerSaveAsTemplate('vacancy-1');

      const input = screen.getByDisplayValue('Template 4');
      await user.clear(input);
      await user.type(input, '  My Custom Template  ');

      await user.click(
        screen.getByRole('button', {
          name: 'vacancySaveAsTemplateDialog.yesButton',
        })
      );

      expect(mutate).toHaveBeenCalledWith(
        { vacancyId: 'vacancy-1', templateName: 'My Custom Template' },
        expect.objectContaining({
          onSuccess: expect.any(Function) as unknown,
          onError: expect.any(Function) as unknown,
        })
      );
      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'vacancies.saveAsTemplate.notifications.successTitle',
        description: 'vacancies.saveAsTemplate.notifications.successMessage',
      });
      // Dialog closes after a successful save.
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows an error toast when the mutation fails', async () => {
      const user = userEvent.setup();
      const mutate = vi.fn((_payload: unknown, opts: { onError: () => void }) =>
        opts.onError()
      );
      useSaveVacancyAsTemplateMutationMock.mockReturnValue({
        mutate,
        isPending: false,
      });

      render(<VacanciesPage />);
      triggerSaveAsTemplate('vacancy-1');

      await user.click(
        screen.getByRole('button', {
          name: 'vacancySaveAsTemplateDialog.yesButton',
        })
      );

      expect(mockErrorToast).toHaveBeenCalledWith({
        title: 'vacancies.saveAsTemplate.notifications.errorTitle',
        description: 'vacancies.saveAsTemplate.notifications.errorMessage',
      });
      // Dialog stays open on failure so the recruiter can retry.
      expect(
        screen.getByRole('heading', {
          name: 'vacancySaveAsTemplateDialog.title',
        })
      ).toBeInTheDocument();
    });

    it('closes the dialog without saving when No is clicked', async () => {
      const user = userEvent.setup();
      const mutate = vi.fn();
      useSaveVacancyAsTemplateMutationMock.mockReturnValue({
        mutate,
        isPending: false,
      });

      render(<VacanciesPage />);
      triggerSaveAsTemplate();

      await user.click(
        screen.getByRole('button', {
          name: 'vacancySaveAsTemplateDialog.noButton',
        })
      );

      expect(mutate).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('disables the confirm button while saving is in progress', () => {
      useSaveVacancyAsTemplateMutationMock.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      });

      render(<VacanciesPage />);
      triggerSaveAsTemplate();

      // DialogContent renders [No, Yes, built-in close (X)] in that order —
      // the confirm button is the second of the three.
      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons[1];
      expect(confirmButton).toBeDisabled();
    });

    describe('copy vacancy link', () => {
      const getOnCopyLink = () => {
        const options = createVacancyColumnsMock.mock.calls.at(-1)?.[0] as {
          onCopyLink: (vacancyLink: string) => void;
        };
        return options.onCopyLink;
      };

      it('copies the vacancy link and shows a success toast', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText },
          configurable: true,
        });

        render(<VacanciesPage />);
        getOnCopyLink()(
          'http://localhost:5173/jobs/85f9b624-ee93-46d0-b8d6-5cea49a8597a'
        );

        await waitFor(() => expect(mockSuccessToast).toHaveBeenCalled());
        expect(writeText).toHaveBeenCalledWith(
          'http://localhost:5173/jobs/85f9b624-ee93-46d0-b8d6-5cea49a8597a'
        );
        expect(mockSuccessToast).toHaveBeenCalledWith({
          title: 'vacancies.copyLink.notifications.successTitle',
          description: 'vacancies.copyLink.notifications.successMessage',
        });
      });

      it('shows an error toast when the clipboard write fails', async () => {
        const writeText = vi.fn().mockRejectedValue(new Error('denied'));
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText },
          configurable: true,
        });

        render(<VacanciesPage />);
        getOnCopyLink()('http://localhost:5173/jobs/abc');

        await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
        expect(mockErrorToast).toHaveBeenCalledWith({
          title: 'vacancies.copyLink.notifications.errorTitle',
          description: 'vacancies.copyLink.notifications.errorMessage',
        });
      });

      it('shows an error toast without touching the clipboard when vacancyLink is empty', () => {
        const writeText = vi.fn();
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText },
          configurable: true,
        });

        render(<VacanciesPage />);
        getOnCopyLink()('');

        expect(writeText).not.toHaveBeenCalled();
        expect(mockErrorToast).toHaveBeenCalledWith({
          title: 'vacancies.copyLink.notifications.errorTitle',
          description: 'vacancies.copyLink.notifications.errorMessage',
        });
      });
    });
  });
});
