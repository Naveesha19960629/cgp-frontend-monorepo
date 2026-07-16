import { useSaveVacancyAsTemplateMutation } from '@/views/vacancies/hooks/mutations/use-save-vacancy-as-template-mutation';
import type { SaveVacancyAsTemplatePayload } from '@/views/vacancies/types';

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

const mockSaveVacancyAsTemplate = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  vacancyTemplateService: {
    saveVacancyAsTemplate: (...args: unknown[]) =>
      mockSaveVacancyAsTemplate(...args) as unknown,
  },
}));

describe('useSaveVacancyAsTemplateMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockSaveVacancyAsTemplate.mockResolvedValue({
      requestId: 'req-1',
      success: true,
      message: 'ok',
      data: 'template-1',
    });
  });

  describe('mutationFn', () => {
    it('calls vacancyTemplateService.saveVacancyAsTemplate with the payload', async () => {
      const payload: SaveVacancyAsTemplatePayload = {
        vacancyId: 'vacancy-1',
        templateName: 'Template 4',
      };
      const mutation =
        useSaveVacancyAsTemplateMutation() as unknown as MockMutation<SaveVacancyAsTemplatePayload>;

      await mutation.mutationFn(payload);

      expect(mockSaveVacancyAsTemplate).toHaveBeenCalledWith(payload);
    });

    it('returns the API response', async () => {
      const mutation =
        useSaveVacancyAsTemplateMutation() as unknown as MockMutation<SaveVacancyAsTemplatePayload>;

      const result = await mutation.mutationFn({
        vacancyId: 'vacancy-1',
        templateName: 'Template 4',
      });

      expect(result).toEqual({
        requestId: 'req-1',
        success: true,
        message: 'ok',
        data: 'template-1',
      });
    });
  });

  describe('onSuccess', () => {
    it("invalidates the ['vacancy-templates'] query cache", async () => {
      const mutation =
        useSaveVacancyAsTemplateMutation() as unknown as MockMutation<SaveVacancyAsTemplatePayload>;

      await mutation.onSuccess();

      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['vacancy-templates'],
      });
    });
  });
});
