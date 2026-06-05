import { useSportsQuery } from '@/views/vacancies/hooks/queries/use-sports-query';

// -- Mock @tanstack/react-query -------------------------------------------

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options) as unknown,
}));

// -- Mock service ----------------------------------------------------------

const mockGetSports = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  sportService: {
    getSports: (...args: unknown[]) => mockGetSports(...args) as unknown,
  },
}));

describe('useSportsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('passes correct queryKey with search term', () => {
    useSportsQuery('cricket');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['sports', 'cricket'] })
    );
  });

  it('defaults enabled to true', () => {
    useSportsQuery('cricket');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    );
  });

  it('forwards the enabled flag', () => {
    useSportsQuery('cricket', false);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it('queryFn calls sportService.getSports with the search string', async () => {
    mockGetSports.mockResolvedValue({ data: { items: { content: [] } } });
    useSportsQuery('cricket');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetSports).toHaveBeenCalledWith('cricket');
  });
});
