import { useNotifyApplicantsMutation } from '@/views/vacancies/hooks/mutations/use-notify-applicants-mutation';
import type { NotifyApplicantsPayload } from '@/views/vacancies/types';

// ── Types ──────────────────────────────────────────────────────────────────

type MockMutation = {
  mutationFn: (arg: NotifyApplicantsPayload) => Promise<unknown>;
};

// ── Mock @tanstack/react-query ─────────────────────────────────────────────

const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
}));

// ── Mock services ───────────────────────────────────────────────────────────

const mockNotifyApplicants = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  notificationService: {
    notifyApplicants: (...args: unknown[]) =>
      mockNotifyApplicants(...args) as unknown,
  },
}));

describe('useNotifyApplicantsMutation', () => {
  const payload: NotifyApplicantsPayload = {
    vacancyId: 'vacancy-1',
    changedSections: ['preferredSkills'],
    changedFields: ['preferredSkills.skills[0].skillName'],
    publishDateTime: '2099-12-25T10:00:00 AM',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockNotifyApplicants.mockResolvedValue({
      requestId: 'req-1',
      success: true,
      message: 'Notified',
    });
  });

  it('mutationFn calls notificationService.notifyApplicants with the payload', async () => {
    const mutation = useNotifyApplicantsMutation() as unknown as MockMutation;

    await mutation.mutationFn(payload);

    expect(mockNotifyApplicants).toHaveBeenCalledWith(payload);
  });
});
