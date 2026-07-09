import { useCreateVacancyMutation } from '@/views/vacancies/hooks/mutations/use-create-vacancy-mutation';
import type { VacancyForm } from '@/views/vacancies/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type MockMutation<TArg = unknown> = {
  mutationFn: (arg: TArg) => Promise<unknown>;
  onSuccess: () => void | Promise<void>;
};

type MutationInput = { form: VacancyForm; status?: string };

// ── Mock @tanstack/react-query ─────────────────────────────────────────────────

const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ── Mock services ──────────────────────────────────────────────────────────────

const mockCreateVacancy = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  vacancyService: {
    createVacancy: (...args: unknown[]) =>
      mockCreateVacancy(...args) as unknown,
  },
}));

// ── Mock toCreateVacancyPayload ────────────────────────────────────────────────

const mockToCreateVacancyPayload = vi.fn(
  (_form: VacancyForm, status?: string) => ({
    title: 'payload',
    status: status ?? 'UNPUBLISHED',
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

describe('useCreateVacancyMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockCreateVacancy.mockResolvedValue({ data: { id: 'vacancy-1' } });
  });

  describe('mutationFn', () => {
    it('calls toCreateVacancyPayload with form and status', async () => {
      const mutation =
        useCreateVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.mutationFn({ form: mockForm, status: 'DRAFT' });

      expect(mockToCreateVacancyPayload).toHaveBeenCalledWith(
        mockForm,
        'DRAFT',
        undefined
      );
    });

    it('calls toCreateVacancyPayload with undefined status when not provided', async () => {
      const mutation =
        useCreateVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.mutationFn({ form: mockForm });

      expect(mockToCreateVacancyPayload).toHaveBeenCalledWith(
        mockForm,
        undefined,
        undefined
      );
    });

    it('calls vacancyService.createVacancy with the transformed payload', async () => {
      const expectedPayload = {
        title: 'payload',
        status: 'DRAFT',
        lastActiveStep: 'job-requirements',
        data: {},
      };
      mockToCreateVacancyPayload.mockReturnValueOnce(expectedPayload);

      const mutation =
        useCreateVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.mutationFn({ form: mockForm, status: 'DRAFT' });

      expect(mockCreateVacancy).toHaveBeenCalledWith(expectedPayload);
    });

    it('returns the API response', async () => {
      const mutation =
        useCreateVacancyMutation() as unknown as MockMutation<MutationInput>;

      const result = await mutation.mutationFn({
        form: mockForm,
        status: 'DRAFT',
      });

      expect(result).toEqual({ data: { id: 'vacancy-1' } });
    });

    it('passes UNPUBLISHED as the default status via toCreateVacancyPayload when status is omitted', async () => {
      mockToCreateVacancyPayload.mockImplementation(
        (_form: VacancyForm, status?: string) => ({
          title: 'payload',
          status: status ?? 'UNPUBLISHED',
          lastActiveStep: 'job-requirements',
          data: {},
        })
      );

      const mutation =
        useCreateVacancyMutation() as unknown as MockMutation<MutationInput>;
      await mutation.mutationFn({ form: mockForm });

      const callArg = mockCreateVacancy.mock.calls[0]?.[0] as {
        status?: string;
      };
      expect(callArg?.status).toBe('UNPUBLISHED');
    });
  });

  describe('onSuccess', () => {
    it("invalidates the ['vacancies'] query cache", async () => {
      const mutation =
        useCreateVacancyMutation() as unknown as MockMutation<MutationInput>;

      await mutation.onSuccess();

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vacancies'],
      });
    });
  });
});
