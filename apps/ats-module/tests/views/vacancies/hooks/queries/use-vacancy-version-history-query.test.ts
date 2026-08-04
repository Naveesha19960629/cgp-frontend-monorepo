import { useVacancyVersionHistoryQuery } from '@/views/vacancies/hooks/queries/use-vacancy-version-history-query';

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options) as unknown,
}));

const mockGetVacancyVersionHistory = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  versionHistoryService: {
    getVacancyVersionHistory: (...args: unknown[]) =>
      mockGetVacancyVersionHistory(...args) as unknown,
  },
}));

describe('useVacancyVersionHistoryQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('passes the correct queryKey', () => {
    useVacancyVersionHistoryQuery('vacancy-1');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['vacancy-version-history', 'vacancy-1'],
      })
    );
  });

  it('is enabled by default with a valid id, since the page renders the list eagerly', () => {
    useVacancyVersionHistoryQuery('vacancy-1');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    );
  });

  it('is disabled when the id is blank, even with the default enabled option', () => {
    useVacancyVersionHistoryQuery('');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('is disabled when options.enabled: false is passed explicitly', () => {
    useVacancyVersionHistoryQuery('vacancy-1', { enabled: false });
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('queryFn calls versionHistoryService.getVacancyVersionHistory with the id', async () => {
    mockGetVacancyVersionHistory.mockResolvedValue({
      data: { vacancyTitle: 'Vice President', versions: [] },
    });
    useVacancyVersionHistoryQuery('vacancy-1');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetVacancyVersionHistory).toHaveBeenCalledWith('vacancy-1');
  });
});
