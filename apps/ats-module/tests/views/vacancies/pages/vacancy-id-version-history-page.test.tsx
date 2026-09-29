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
  versionNumber: 'V1.0',
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
  versionNumber: 'V2.0',
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
        { selectedVersionNumber: 'V1.0' }
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

  it('shows the shared Spinner on the Download button while the PDF is being generated', async () => {
    // Regression test: the Download button previously showed the same
    // static Download icon whether or not a download was in progress — no
    // loading feedback at all. It now swaps in the app's shared `Spinner`
    // (matching the "use a common loader" request) for the isDownloading
    // window between click and the blob resolving/rejecting.
    let resolveDownload: (blob: Blob) => void = () => {};
    mockBuildVersionHistoryPdfBlob.mockReturnValue(
      new Promise<Blob>(resolve => {
        resolveDownload = resolve;
      })
    );
    const user = userEvent.setup();
    render(<VacancyIdVersionHistoryPage />);
    const downloadButton = screen.getByRole('button', {
      name: 'versionHistory.download',
    });

    await user.click(downloadButton);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(downloadButton).toBeDisabled();

    resolveDownload(new Blob(['pdf'], { type: 'application/pdf' }));

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    expect(downloadButton).not.toBeDisabled();
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

  // DQCGP-3902: "Tracked changes are displayed in all versions" — reported
  // after multiple Update saves on the same vacancy. This is the real
  // 4-version API response from a live repro (vacancy "test bug"), each
  // version carrying its own distinct changes (SECTION_ENABLED/DISABLED for
  // "Hobby" in v2/v3, a STATUS_CHANGED + Schedule Date edit in v4, the
  // VACANCY_CREATED grouped card in v1) — used verbatim as a regression
  // fixture to prove each version's Activity Log shows only its own changes.
  describe('DQCGP-3902: a real 4-version response with distinct per-version changes', () => {
    const bugRepro = {
      vacancyTitle: 'test bug',
      status: 'LIVE',
      createdAt: '2026-09-01T10:17:56.875715',
      createdBy: 'chamathnirmal99@gmail.com',
      lastUpdatedAt: '2026-09-04T14:13:00.225528',
      totalVersions: 4,
      versions: [
        {
          versionNumber: 'V4.0',
          updatedAt: '2026-09-04T14:13:00.225528',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'STATUS_CHANGED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['LIVE'],
                newValue: ['ONHOLD'],
              },
              {
                changeType: 'FIELD_VALUE_UPDATED' as const,
                sectionName: 'Schedule',
                fieldName: 'Scheduled Publish Date',
                oldValue: ['2026-09-03T11:00'],
                newValue: ['2026-09-04T14:13'],
              },
            ],
            system: [
              {
                changeType: 'STATUS_CHANGED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['ONHOLD'],
                newValue: ['LIVE'],
              },
            ],
          },
        },
        {
          versionNumber: 'V3.0',
          updatedAt: '2026-09-04T13:04:50.032911',
          updatedBy: 'chamathnirmal99@gmail.com',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'SECTION_DISABLED' as const,
                sectionName: 'Hobby',
                fieldName: 'Section Status',
                oldValue: ['true'],
                newValue: ['false'],
              },
              {
                changeType: 'FIELD_VALUE_REMOVED' as const,
                sectionName: 'Hobby',
                fieldName: 'Hobby',
                oldValue: ['Chess'],
                newValue: null,
              },
            ],
            system: [],
          },
        },
        {
          versionNumber: 'V2.0',
          updatedAt: '2026-09-04T13:04:10.81687',
          updatedBy: 'chamathnirmal99@gmail.com',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'SECTION_ENABLED' as const,
                sectionName: 'Hobby',
                fieldName: 'Section Status',
                oldValue: ['false'],
                newValue: ['true'],
              },
              {
                changeType: 'FIELD_VALUE_ADDED' as const,
                sectionName: 'Hobby',
                fieldName: 'Hobby',
                oldValue: null,
                newValue: ['Chess'],
              },
            ],
            system: [],
          },
        },
        {
          versionNumber: 'V1.0',
          updatedAt: '2026-09-03T11:00:02.437395',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'VACANCY_CREATED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Title',
                oldValue: null,
                newValue: ['test bug'],
              },
              {
                changeType: 'VACANCY_CREATED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: null,
                newValue: ['UNPUBLISHED'],
              },
              {
                changeType: 'VACANCY_CREATED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Schedule Date',
                oldValue: null,
                newValue: ['2026-09-03T11:00'],
              },
              {
                changeType: 'VACANCY_CREATED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Expiration Date',
                oldValue: null,
                newValue: ['2026-09-15T16:00'],
              },
            ],
            system: [
              {
                changeType: 'STATUS_CHANGED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['UNPUBLISHED'],
                newValue: ['LIVE'],
              },
            ],
          },
        },
      ],
    };

    beforeEach(() => {
      mockUseVacancyVersionHistoryQuery.mockReturnValue({
        data: { success: true, message: 'ok', data: bugRepro },
        isLoading: false,
      });
    });

    const selectVersion = async (
      user: ReturnType<typeof userEvent.setup>,
      versionOrdinal: number
    ) => {
      await user.click(
        screen.getByRole('button', {
          name: new RegExp(`versionLabel:${versionOrdinal}\\b`),
        })
      );
    };

    // `p.wrap-break-word` covers several change types' value/header
    // paragraphs (SectionToggleChange's header, but also plain scalar
    // values like "Chess"/"test bug") — filtering to ones starting with the
    // sectionEnabled/sectionDisabled key isolates just the toggle header,
    // avoiding the substring ambiguity called out in
    // version-history-change-entry.test.tsx ("sectionEnabled" is a
    // text-prefix of its own "...Description" i18n key).
    const sectionToggleHeaders = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('p.wrap-break-word'))
        .map(el => el.textContent)
        .filter(text =>
          /^versionHistory\.changeTypes\.section(Enabled|Disabled) -/.test(
            text ?? ''
          )
        );

    it("shows only v4's own changes (Status + Schedule Date) and nothing from v1-v3", () => {
      render(<VacancyIdVersionHistoryPage />);

      // v4 is selected by default (latest version).
      expect(
        screen.getAllByText('versionHistory.changeTypes.statusUpdated')
      ).toHaveLength(2); // one user entry, one system entry
      expect(
        screen.getByText('versionHistory.changeTypes.scheduleDateChanged')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('versionHistory.changeTypes.vacancyCreated')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Chess')).not.toBeInTheDocument();
    });

    it("shows only v3's own changes (Hobby disabled + Chess removed) when selected — regression for the DQCGP-3902 leak from v4", async () => {
      const user = userEvent.setup();
      const { container } = render(<VacancyIdVersionHistoryPage />);

      await selectVersion(user, 3);

      expect(sectionToggleHeaders(container)).toEqual([
        'versionHistory.changeTypes.sectionDisabled - Hobby',
      ]);
      expect(screen.getByText('Chess')).toBeInTheDocument();
      // v3 has no STATUS_CHANGED/Schedule Date change of its own — any
      // match here would be v4's leaked entry surviving the version switch
      // (the DQCGP-3902 bug: a duplicate React key on v4's two
      // STATUS_CHANGED entries orphaned one of them in the DOM instead of
      // removing it).
      expect(
        screen.queryByText('versionHistory.changeTypes.statusUpdated')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('versionHistory.changeTypes.scheduleDateChanged')
      ).not.toBeInTheDocument();
    });

    it("shows only v2's own changes (Hobby enabled + Chess added) when selected — regression for the DQCGP-3902 leak from v4/v3", async () => {
      const user = userEvent.setup();
      const { container } = render(<VacancyIdVersionHistoryPage />);

      await selectVersion(user, 2);

      expect(sectionToggleHeaders(container)).toEqual([
        'versionHistory.changeTypes.sectionEnabled - Hobby',
      ]);
      expect(screen.getByText('Chess')).toBeInTheDocument();
      expect(
        screen.queryByText('versionHistory.changeTypes.statusUpdated')
      ).not.toBeInTheDocument();
    });

    it("shows only v1's own changes (the grouped Vacancy Created card + its own status entry) when selected — regression for the DQCGP-3902 leak", async () => {
      const user = userEvent.setup();
      const { container } = render(<VacancyIdVersionHistoryPage />);

      await selectVersion(user, 1);

      expect(
        screen.getByText('versionHistory.changeTypes.vacancyCreated')
      ).toBeInTheDocument();
      expect(sectionToggleHeaders(container)).toEqual([]);
      expect(screen.queryByText('Chess')).not.toBeInTheDocument();
      // v1 has exactly one STATUS_CHANGED of its own (system,
      // UNPUBLISHED → LIVE) — a second match here would be v4's leaked
      // "LIVE → ONHOLD" user entry.
      expect(
        screen.getAllByText('versionHistory.changeTypes.statusUpdated')
      ).toHaveLength(1);
      expect(
        screen.queryByText('vacancies.table.filter.statusOptions.onHold')
      ).not.toBeInTheDocument();
    });
  });
});
