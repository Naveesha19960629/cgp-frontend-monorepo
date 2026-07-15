import { useDeleteTemplateMutation } from '@/views/vacancies/hooks/mutations/use-delete-template-mutation';

// ── Types ──────────────────────────────────────────────────────────────────────

type MockMutation<TArg = unknown> = {
  mutationFn: (arg: TArg) => Promise<unknown>;
  onSuccess: () => void | Promise<void>;
};

// ── Mock @tanstack/react-query ─────────────────────────────────────────────────

const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ── Mock services ──────────────────────────────────────────────────────────────

const mockDeleteTemplate = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  vacancyTemplateService: {
    deleteTemplate: (...args: unknown[]) =>
      mockDeleteTemplate(...args) as unknown,
  },
}));

describe('useDeleteTemplateMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockDeleteTemplate.mockResolvedValue({ data: 'template-1' });
  });

  describe('mutationFn', () => {
    it('calls vacancyTemplateService.deleteTemplate with the template id', async () => {
      const mutation =
        useDeleteTemplateMutation() as unknown as MockMutation<string>;

      await mutation.mutationFn('template-1');

      expect(mockDeleteTemplate).toHaveBeenCalledWith('template-1');
    });

    it('returns the API response', async () => {
      const mutation =
        useDeleteTemplateMutation() as unknown as MockMutation<string>;

      const result = await mutation.mutationFn('template-1');

      expect(result).toEqual({ data: 'template-1' });
    });
  });

  describe('onSuccess', () => {
    it("invalidates the ['vacancy-templates'] query cache", async () => {
      const mutation =
        useDeleteTemplateMutation() as unknown as MockMutation<string>;

      await mutation.onSuccess();

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vacancy-templates'],
      });
    });
  });
});
