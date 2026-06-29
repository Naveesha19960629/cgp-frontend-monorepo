import { useVacancyFilterOptionsQuery } from '@/views/vacancies/hooks/queries/use-vacancy-filter-options-query';

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options) as unknown,
}));

const mockGetFilterOptions = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  vacancyService: {
    getFilterOptions: (...args: unknown[]) =>
      mockGetFilterOptions(...args) as unknown,
  },
}));

describe('useVacancyFilterOptionsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('passes correct queryKey with search term', () => {
    useVacancyFilterOptionsQuery('engineer');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['vacancy-filter-options', 'engineer'],
      })
    );
  });

  it('uses empty string queryKey when no search is provided', () => {
    useVacancyFilterOptionsQuery();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['vacancy-filter-options', ''],
      })
    );
  });

  it('queryFn calls vacancyService.getFilterOptions with search string when non-empty', async () => {
    mockGetFilterOptions.mockResolvedValue({
      data: { careerPaths: [], disciplines: [], statuses: [] },
    });
    useVacancyFilterOptionsQuery('engineer');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetFilterOptions).toHaveBeenCalledWith('engineer');
  });

  it('queryFn calls vacancyService.getFilterOptions with undefined when search is empty', async () => {
    mockGetFilterOptions.mockResolvedValue({
      data: { careerPaths: [], disciplines: [], statuses: [] },
    });
    useVacancyFilterOptionsQuery('');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetFilterOptions).toHaveBeenCalledWith(undefined);
  });

  it('returns the useQuery result', () => {
    const mockResult = {
      data: { data: { careerPaths: [], disciplines: [], statuses: [] } },
      isLoading: false,
    };
    mockUseQuery.mockReturnValue(mockResult);
    const result = useVacancyFilterOptionsQuery('test');
    expect(result).toBe(mockResult);
  });
});
