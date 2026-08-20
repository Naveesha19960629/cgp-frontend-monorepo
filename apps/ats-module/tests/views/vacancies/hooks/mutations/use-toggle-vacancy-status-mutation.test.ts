import { useToggleVacancyStatusMutation } from '@/views/vacancies/hooks/mutations/use-toggle-vacancy-status-mutation';
import type { VacancyToggleAction } from '@/views/vacancies/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type MockMutation<TArg = unknown> = {
  mutationFn: (arg: TArg) => Promise<unknown>;
  onSuccess: (data: unknown, variables: TArg) => void | Promise<void>;
};

type MutationInput = { id: string; action: VacancyToggleAction };

// ── Mock @tanstack/react-query ─────────────────────────────────────────────────

const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ── Mock services ──────────────────────────────────────────────────────────────

const mockToggleVacancyActiveStatus = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  vacancyService: {
    toggleVacancyActiveStatus: (...args: unknown[]) =>
      mockToggleVacancyActiveStatus(...args) as unknown,
  },
}));

describe('useToggleVacancyStatusMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockToggleVacancyActiveStatus.mockResolvedValue({
      data: { status: 'ON_HOLD' },
    });
  });

  describe('mutationFn', () => {
    it('calls vacancyService.toggleVacancyActiveStatus with the id and action', async () => {
      const mutation =
        useToggleVacancyStatusMutation() as unknown as MockMutation<MutationInput>;

      await mutation.mutationFn({ id: 'vacancy-1', action: 'DEACTIVATE' });

      expect(mockToggleVacancyActiveStatus).toHaveBeenCalledWith(
        'vacancy-1',
        'DEACTIVATE'
      );
    });

    it('passes the ACTIVATE action through unchanged', async () => {
      const mutation =
        useToggleVacancyStatusMutation() as unknown as MockMutation<MutationInput>;

      await mutation.mutationFn({ id: 'vacancy-abc', action: 'ACTIVATE' });

      expect(mockToggleVacancyActiveStatus).toHaveBeenCalledWith(
        'vacancy-abc',
        'ACTIVATE'
      );
    });

    it('returns the API response', async () => {
      const mutation =
        useToggleVacancyStatusMutation() as unknown as MockMutation<MutationInput>;

      const result = await mutation.mutationFn({
        id: 'vacancy-1',
        action: 'DEACTIVATE',
      });

      expect(result).toEqual({ data: { status: 'ON_HOLD' } });
    });
  });

  describe('onSuccess', () => {
    it("invalidates the ['vacancies'] query cache", async () => {
      const mutation =
        useToggleVacancyStatusMutation() as unknown as MockMutation<MutationInput>;

      await mutation.onSuccess(undefined, {
        id: 'vacancy-1',
        action: 'DEACTIVATE',
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vacancies'],
      });
    });

    // Regression: toggling status from the table used to leave the cached
    // ['vacancy', id] detail entry untouched, so the Edit page's status badge
    // kept rendering the pre-toggle status until a full page reload.
    it("invalidates the ['vacancy', id] detail cache the Edit page reads from", async () => {
      const mutation =
        useToggleVacancyStatusMutation() as unknown as MockMutation<MutationInput>;

      await mutation.onSuccess(undefined, {
        id: 'vacancy-abc',
        action: 'DEACTIVATE',
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vacancy', 'vacancy-abc'],
      });
    });

    it('invalidates the detail cache for the ACTIVATE direction too', async () => {
      const mutation =
        useToggleVacancyStatusMutation() as unknown as MockMutation<MutationInput>;

      await mutation.onSuccess(undefined, {
        id: 'vacancy-xyz',
        action: 'ACTIVATE',
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vacancy', 'vacancy-xyz'],
      });
    });
  });
});
