import { useUpdateDraftVacancyMutation } from '@/views/vacancies/hooks/mutations/use-update-draft-vacancy-mutation';
import type { VacancyForm } from '@/views/vacancies/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type MockMutation<TArg = unknown> = {
  mutationFn: (arg: TArg) => Promise<unknown>;
  onSuccess: (data: unknown, variables: TArg) => void | Promise<void>;
};

type MutationInput = { id: string; form: VacancyForm; status?: string };

// ── Mock @tanstack/react-query ─────────────────────────────────────────────────

const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ── Mock services ──────────────────────────────────────────────────────────────

const mockUpdateDraftVacancy = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  vacancyService: {
    updateDraftVacancy: (...args: unknown[]) =>
      mockUpdateDraftVacancy(...args) as unknown,
  },
}));

// ── Mock toCreateVacancyPayload ────────────────────────────────────────────────

const mockToCreateVacancyPayload = vi.fn(
  (_form: VacancyForm, status?: string) => ({
    title: 'payload',
    status: status ?? 'DRAFT',
    lastActiveStep: 'job-requirements',
    data: {},
  })
);

vi.mock('@/views/vacancies/utils', () => ({
  toCreateVacancyPayload: (...args: unknown[]) =>
    mockToCreateVacancyPayload(...(args as [VacancyForm, string?])),
}));

// ── Shared setup ──────────────────────────────────────────────────────────────

const mockForm = {
  title: 'Test Vacancy',
  status: 'draft',
  lastActiveStep: 'job-requirements',
} as unknown as VacancyForm;

describe('useUpdateDraftVacancyMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockUpdateDraftVacancy.mockResolvedValue({ data: { id: 'vacancy-1' } });
  });

  describe('mutationFn', () => {
    it('calls toCreateVacancyPayload with form and status', async () => {
      const mutation =
        useUpdateDraftVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.mutationFn({
        id: 'vacancy-1',
        form: mockForm,
        status: 'DRAFT',
      });

      expect(mockToCreateVacancyPayload).toHaveBeenCalledWith(
        mockForm,
        'DRAFT'
      );
    });

    it('calls toCreateVacancyPayload with undefined status when not provided', async () => {
      const mutation =
        useUpdateDraftVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.mutationFn({ id: 'vacancy-1', form: mockForm });

      expect(mockToCreateVacancyPayload).toHaveBeenCalledWith(
        mockForm,
        undefined
      );
    });

    it('calls vacancyService.updateDraftVacancy with the id and transformed payload', async () => {
      const expectedPayload = {
        title: 'payload',
        status: 'DRAFT',
        lastActiveStep: 'job-requirements',
        data: {},
      };
      mockToCreateVacancyPayload.mockReturnValueOnce(expectedPayload);

      const mutation =
        useUpdateDraftVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.mutationFn({
        id: 'vacancy-1',
        form: mockForm,
        status: 'DRAFT',
      });

      expect(mockUpdateDraftVacancy).toHaveBeenCalledWith(
        'vacancy-1',
        expectedPayload
      );
    });

    it('passes the correct id when mutating different vacancy ids', async () => {
      const mutation =
        useUpdateDraftVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.mutationFn({
        id: 'vacancy-abc',
        form: mockForm,
        status: 'DRAFT',
      });

      expect(mockUpdateDraftVacancy).toHaveBeenCalledWith(
        'vacancy-abc',
        expect.any(Object)
      );
    });

    it('returns the API response', async () => {
      const mutation =
        useUpdateDraftVacancyMutation() as unknown as MockMutation<MutationInput>;

      const result = await mutation.mutationFn({
        id: 'vacancy-1',
        form: mockForm,
        status: 'DRAFT',
      });

      expect(result).toEqual({ data: { id: 'vacancy-1' } });
    });
  });

  describe('onSuccess', () => {
    it("invalidates the ['vacancies'] query cache", async () => {
      const mutation =
        useUpdateDraftVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.onSuccess(undefined, { id: 'vacancy-1', form: mockForm });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vacancies'],
      });
    });

    it("invalidates the ['vacancy', id] query cache", async () => {
      const mutation =
        useUpdateDraftVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.onSuccess(undefined, {
        id: 'vacancy-abc',
        form: mockForm,
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vacancy', 'vacancy-abc'],
      });
    });

    it("invalidates the ['vacancy-job-description', id] query cache", async () => {
      // Regression test for DQCGP-3651: without this invalidation the Edit JD
      // page kept serving its cached (stale) toggle state after a vacancy
      // edit, since the two queries don't otherwise share a cache key.
      const mutation =
        useUpdateDraftVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.onSuccess(undefined, {
        id: 'vacancy-abc',
        form: mockForm,
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vacancy-job-description', 'vacancy-abc'],
      });
    });
  });
});
