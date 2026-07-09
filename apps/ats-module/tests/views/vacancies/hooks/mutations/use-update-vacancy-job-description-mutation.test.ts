import { useUpdateVacancyJobDescriptionMutation } from '@/views/vacancies/hooks/mutations/use-update-vacancy-job-description-mutation';
import type { UpdateVacancyJobDescriptionRequest } from '@/views/vacancies/types';

type MutationArgs = {
  vacancyId: string;
  payload: UpdateVacancyJobDescriptionRequest;
};

type MockMutation = {
  mutationFn: (arg: MutationArgs) => Promise<unknown>;
  onSuccess: (_data: unknown, variables: MutationArgs) => Promise<void>;
};

const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

const mockUpdateVacancyJobDescription = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  jobDescriptionService: {
    updateVacancyJobDescription: (...args: unknown[]) =>
      mockUpdateVacancyJobDescription(...args) as unknown,
  },
}));

describe('useUpdateVacancyJobDescriptionMutation', () => {
  const payload: UpdateVacancyJobDescriptionRequest = {
    fields: [
      {
        sectionKey: 'PROFILE_REQUIREMENT',
        fieldKey: 'GENDER',
        isVisible: false,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockUpdateVacancyJobDescription.mockResolvedValue({
      requestId: 'req-1',
      success: true,
      message: 'Job description has been successfully updated.',
      data: { vacancyId: 'vacancy-1', sections: [] },
    });
  });

  it('mutationFn calls jobDescriptionService.updateVacancyJobDescription with id + payload', async () => {
    const mutation =
      useUpdateVacancyJobDescriptionMutation() as unknown as MockMutation;

    await mutation.mutationFn({ vacancyId: 'vacancy-1', payload });

    expect(mockUpdateVacancyJobDescription).toHaveBeenCalledWith(
      'vacancy-1',
      payload
    );
  });

  it('onSuccess invalidates the vacancy-job-description query for that vacancy', async () => {
    const mutation =
      useUpdateVacancyJobDescriptionMutation() as unknown as MockMutation;

    await mutation.onSuccess({}, { vacancyId: 'vacancy-99', payload });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['vacancy-job-description', 'vacancy-99'],
    });
  });
});
