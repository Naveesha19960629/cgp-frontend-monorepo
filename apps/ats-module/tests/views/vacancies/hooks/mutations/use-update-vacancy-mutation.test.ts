import { useUpdateVacancyMutation } from '@/views/vacancies/hooks/mutations/use-update-vacancy-mutation';
import type { VacancyForm } from '@/views/vacancies/types';

// ── Types ──────────────────────────────────────────────────────────────────

type MutationArgs = { id: string; form: VacancyForm };

type MockMutation = {
  mutationFn: (arg: MutationArgs) => Promise<unknown>;
  onSuccess: (_data: unknown, variables: MutationArgs) => void;
};

// ── Mock @tanstack/react-query ─────────────────────────────────────────────

const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ── Mock services and utils ────────────────────────────────────────────────

const mockUpdateVacancy = vi.fn();
const mockToCreateVacancyPayload = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  vacancyService: {
    updateVacancy: (...args: unknown[]) => mockUpdateVacancy(...args),
  },
}));

vi.mock('@/views/vacancies/utils', () => ({
  toCreateVacancyPayload: (...args: unknown[]) =>
    mockToCreateVacancyPayload(...args),
}));

describe('useUpdateVacancyMutation', () => {
  const mockForm = { title: 'Test Vacancy' } as VacancyForm;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockToCreateVacancyPayload.mockReturnValue({
      title: 'Mapped Payload',
      status: 'UNPUBLISHED',
      lastActiveStep: 'schedule-vacancy',
      data: {},
    });
    mockUpdateVacancy.mockResolvedValue({
      requestId: 'req-1',
      success: true,
      message: 'Updated',
    });
  });

  it('mutationFn maps form and calls updateVacancy with id + mapped payload', async () => {
    const mutation = useUpdateVacancyMutation() as unknown as MockMutation;

    await mutation.mutationFn({ id: 'vacancy-1', form: mockForm });

    expect(mockToCreateVacancyPayload).toHaveBeenCalledWith(mockForm);
    expect(mockUpdateVacancy).toHaveBeenCalledWith('vacancy-1', {
      title: 'Mapped Payload',
      status: 'UNPUBLISHED',
      lastActiveStep: 'schedule-vacancy',
      data: {},
    });
  });

  it('onSuccess invalidates both vacancies list and vacancy detail queries', () => {
    const mutation = useUpdateVacancyMutation() as unknown as MockMutation;

    mutation.onSuccess({}, { id: 'vacancy-99', form: mockForm });

    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: ['vacancies'],
    });
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: ['vacancy', 'vacancy-99'],
    });
  });
});
