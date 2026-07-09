import { useVacancyJobDescriptionQuery } from '@/views/vacancies/hooks/queries/use-vacancy-job-description-query';

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options) as unknown,
}));

const mockGetVacancyJobDescription = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  jobDescriptionService: {
    getVacancyJobDescription: (...args: unknown[]) =>
      mockGetVacancyJobDescription(...args) as unknown,
  },
}));

describe('useVacancyJobDescriptionQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('passes the correct queryKey', () => {
    useVacancyJobDescriptionQuery('vacancy-1');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['vacancy-job-description', 'vacancy-1'],
      })
    );
  });

  it('is disabled when the id is blank', () => {
    useVacancyJobDescriptionQuery('');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('is disabled when options.enabled is false, even with a valid id', () => {
    useVacancyJobDescriptionQuery('vacancy-1', { enabled: false });
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('queryFn calls jobDescriptionService.getVacancyJobDescription with the id', async () => {
    mockGetVacancyJobDescription.mockResolvedValue({
      data: { vacancyId: 'vacancy-1', sections: [] },
    });
    useVacancyJobDescriptionQuery('vacancy-1');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetVacancyJobDescription).toHaveBeenCalledWith('vacancy-1');
  });
});
