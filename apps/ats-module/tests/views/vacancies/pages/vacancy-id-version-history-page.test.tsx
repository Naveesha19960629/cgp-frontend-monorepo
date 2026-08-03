import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyIdVersionHistoryPage from '@/views/vacancies/pages/vacancy-id-version-history-page';

const mockNavigate = vi.fn();
const mockUseVacancyVersionHistoryQuery = vi.fn<() => unknown>();
const mockBuildVersionHistoryPdfBlob = vi.fn();
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-vacancy-id' }),
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useVacancyVersionHistoryQuery: () => mockUseVacancyVersionHistoryQuery(),
}));

vi.mock('@/views/vacancies/utils', async () => {
  const actual = await vi.importActual<
    typeof import('@/views/vacancies/utils')
  >('@/views/vacancies/utils');
  return {
    ...actual,
    buildVersionHistoryPdfBlob: (...args: unknown[]) =>
      mockBuildVersionHistoryPdfBlob(...args) as unknown,
  };
});

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: (...args: unknown[]) => mockSuccessToast(...args) as unknown,
  ErrorToast: (...args: unknown[]) => mockErrorToast(...args) as unknown,
}));

const versionOne = {
  versionNumber: 1,
  updatedAt: '2026-01-01T10:00:00.000',
  updatedBy: 'sahanlmsl@gmail.com',
  profilePicture: null,
  changes: {
    user: [
      {
        changeType: 'VACANCY_CREATED' as const,
        sectionName: 'Vacancy',
        fieldName: 'Title',
        oldValue: null,
        newValue: ['Vice President'],
      },
    ],
    system: [],
  },
};

const versionTwo = {
  versionNumber: 2,
  updatedAt: '2026-07-07T21:40:43.804959',
  updatedBy: 'SYSTEM',
  profilePicture: null,
  changes: {
    user: [],
    system: [
      {
        changeType: 'STATUS_CHANGED' as const,
        sectionName: 'Vacancy',
        fieldName: 'Status',
        oldValue: ['LIVE'],
        newValue: ['ONHOLD'],
      },
    ],
  },
};

const versionHistoryData = {
  vacancyTitle: 'Vice President',
  status: 'ONHOLD',
  createdAt: '2026-01-01T00:00:00.000',
  createdBy: 'sahanlmsl@gmail.com',
  lastUpdatedAt: '2026-07-07T21:40:43.804959',
  totalVersions: 2,
  versions: [versionOne, versionTwo],
};

let mockAnchorClick: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();

  mockUseVacancyVersionHistoryQuery.mockReturnValue({
    data: { success: true, message: 'ok', data: versionHistoryData },
    isLoading: false,
  });
  mockBuildVersionHistoryPdfBlob.mockResolvedValue(
    new Blob(['pdf'], { type: 'application/pdf' })
  );

  mockAnchorClick = vi.fn();
  const realCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(tagName => {
    const element = realCreateElement(tagName);
    if (tagName === 'a') {
      element.click = mockAnchorClick;
    }
    return element;
  });

  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

describe('VacancyIdVersionHistoryPage', () => {
  it('renders the heading and the vacancy title', () => {
    render(<VacancyIdVersionHistoryPage />);

    expect(screen.getByText('versionHistory.heading')).toBeInTheDocument();
    expect(screen.getByText('Vice President')).toBeInTheDocument();
  });

  it('navigates to the vacancies list when the back button is clicked', async () => {
    const user = userEvent.setup();
    render(<VacancyIdVersionHistoryPage />);

    await user.click(screen.getByRole('button', { name: 'common.back' }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/ats/vacancies');
  });

  it('shows a loading state while the version history is being fetched', () => {
    mockUseVacancyVersionHistoryQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    render(<VacancyIdVersionHistoryPage />);

    expect(
      screen.queryByRole('button', { name: /versionLabel/ })
    ).not.toBeInTheDocument();
  });

  it('renders the loading state as a direct flex-grow child of the page, not nested inside the two-column row', () => {
    // Regression test: VacancyLoadingState's own `h-full` sizing only
    // reliably resolves as a plain flex-grow block (matching every other
    // page that renders it, e.g. edit-vacancy-template-page.tsx) — nesting
    // it inside the sidebar/content two-column flex ROW left it uncentered
    // vertically on a real render (flush to the top with dead space below),
    // reported live as "not perfect as other pages".
    mockUseVacancyVersionHistoryQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    render(<VacancyIdVersionHistoryPage />);

    const loadingTitle = screen.getByText('notifications.loading.title');
    const loadingWrapper = loadingTitle.closest('.flex-1');
    expect(loadingWrapper?.parentElement?.tagName).toBe('SECTION');
  });

  it('selects the latest version by default and shows its Activity Log', () => {
    render(<VacancyIdVersionHistoryPage />);

    const latestVersionButton = screen.getByRole('button', {
      name: /versionLabel:2\b/,
    });
    expect(latestVersionButton).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('versionHistory.changeTypes.statusUpdated')
    ).toBeInTheDocument();
  });

  it('switches the Activity Log when a different version is selected', async () => {
    const user = userEvent.setup();
    render(<VacancyIdVersionHistoryPage />);

    await user.click(
      screen.getByRole('button', {
        name: /versionLabel:1\b/,
      })
    );

    expect(
      screen.getByRole('button', {
        name: /versionLabel:1\b/,
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('versionHistory.changeTypes.verbs.created')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('versionHistory.changeTypes.statusUpdated')
    ).not.toBeInTheDocument();
  });

  it('downloads the PDF for only the selected version', async () => {
    const user = userEvent.setup();
    render(<VacancyIdVersionHistoryPage />);

    await user.click(
      screen.getByRole('button', {
        name: /versionLabel:1\b/,
      })
    );
    await user.click(
      screen.getByRole('button', { name: 'versionHistory.download' })
    );

    await waitFor(() => {
      expect(mockBuildVersionHistoryPdfBlob).toHaveBeenCalledWith(
        versionHistoryData,
        { selectedVersionNumber: 1 }
      );
    });
    expect(mockAnchorClick).toHaveBeenCalledTimes(1);
    expect(mockSuccessToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'versionHistory.notifications.success.title',
      })
    );
    expect(mockErrorToast).not.toHaveBeenCalled();
  });

  it('shows an error state when the version-history fetch is unsuccessful', () => {
    mockUseVacancyVersionHistoryQuery.mockReturnValue({
      data: { success: false, message: 'failed', data: null },
      isLoading: false,
    });
    render(<VacancyIdVersionHistoryPage />);

    expect(
      screen.getByText('versionHistory.notifications.error.message')
    ).toBeInTheDocument();
  });

  it('shows an error toast when PDF generation itself throws', async () => {
    mockBuildVersionHistoryPdfBlob.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<VacancyIdVersionHistoryPage />);

    await user.click(
      screen.getByRole('button', { name: 'versionHistory.download' })
    );

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalled();
    });
    expect(mockAnchorClick).not.toHaveBeenCalled();
  });
});
