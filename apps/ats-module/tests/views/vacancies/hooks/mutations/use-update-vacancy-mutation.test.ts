import { useUpdateVacancyMutation } from '@/views/vacancies/hooks/mutations/use-update-vacancy-mutation';
import type { VacancyForm } from '@/views/vacancies/types';

// ── Types ──────────────────────────────────────────────────────────────────

type MutationArgs = { id: string; form: VacancyForm; existingStatus: string };

type MockMutation = {
  mutationFn: (arg: MutationArgs) => Promise<unknown>;
  onSuccess: (_data: unknown, variables: MutationArgs) => Promise<void>;
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
const mockToUpdateVacancyPayload = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  vacancyService: {
    updateVacancy: (...args: unknown[]) =>
      mockUpdateVacancy(...args) as unknown,
  },
}));

vi.mock('@/views/vacancies/utils', () => ({
  toUpdateVacancyPayload: (...args: unknown[]) =>
    mockToUpdateVacancyPayload(...args) as unknown,
}));

describe('useUpdateVacancyMutation', () => {
  const mockForm = { title: 'Test Vacancy' } as VacancyForm;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockToUpdateVacancyPayload.mockReturnValue({
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

    await mutation.mutationFn({
      id: 'vacancy-1',
      form: mockForm,
      existingStatus: 'LIVE',
    });

    expect(mockToUpdateVacancyPayload).toHaveBeenCalledWith(mockForm, 'LIVE');
    expect(mockUpdateVacancy).toHaveBeenCalledWith('vacancy-1', {
      title: 'Mapped Payload',
      status: 'UNPUBLISHED',
      lastActiveStep: 'schedule-vacancy',
      data: {},
    });
  });

  it('onSuccess invalidates vacancies list, vacancy-by-id, and vacancy-job-description queries', async () => {
    const mutation = useUpdateVacancyMutation() as unknown as MockMutation;

    await mutation.onSuccess(
      {},
      {
        id: 'vacancy-99',
        form: mockForm,
        existingStatus: 'UNPUBLISHED',
      }
    );

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['vacancies'],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['vacancy', 'vacancy-99'],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['vacancy-job-description', 'vacancy-99'],
    });
  });
});
