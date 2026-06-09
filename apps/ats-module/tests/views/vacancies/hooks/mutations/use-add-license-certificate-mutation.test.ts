import { useAddLicenseCertificateMutation } from '@/views/vacancies/hooks/mutations/use-add-license-certificate-mutation';

// ── Types ──────────────────────────────────────────────────────────────────

type MockMutation<TArg = unknown> = {
  mutationFn: (arg: TArg) => Promise<unknown>;
  onSuccess: () => void | Promise<void>;
};

// ── Mock @tanstack/react-query ─────────────────────────────────────────────

const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ── Mock services ──────────────────────────────────────────────────────────

const mockAddLicenseCertificate = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  licenseCertificatesService: {
    addLicenseCertificate: (...args: unknown[]) =>
      mockAddLicenseCertificate(...args) as unknown,
  },
}));

// ── useAddLicenseCertificateMutation ───────────────────────────────────────

describe('useAddLicenseCertificateMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockAddLicenseCertificate.mockResolvedValue({
      requestId: 'req-1',
      success: true,
      message: 'Created',
      data: { type: 'PENDING', items: { content: null } },
    });
  });

  it('mutationFn calls addLicenseCertificate with the given params', async () => {
    const mutation =
      useAddLicenseCertificateMutation() as unknown as MockMutation<{
        type: 'LICENSE' | 'CERTIFICATION';
        displayValue: string;
      }>;

    await mutation.mutationFn({
      type: 'CERTIFICATION',
      displayValue: 'AWS Developer',
    });

    expect(mockAddLicenseCertificate).toHaveBeenCalledWith({
      type: 'CERTIFICATION',
      displayValue: 'AWS Developer',
    });
  });

  it('mutationFn returns the API response', async () => {
    const mutation =
      useAddLicenseCertificateMutation() as unknown as MockMutation<{
        type: 'LICENSE' | 'CERTIFICATION';
        displayValue: string;
      }>;

    const result = await mutation.mutationFn({
      type: 'LICENSE',
      displayValue: 'Forklift Operator',
    });

    expect(result).toEqual({
      requestId: 'req-1',
      success: true,
      message: 'Created',
      data: { type: 'PENDING', items: { content: null } },
    });
  });

  it("onSuccess invalidates the ['licenses-and-certificates'] query cache", async () => {
    const mutation =
      useAddLicenseCertificateMutation() as unknown as MockMutation;

    await mutation.onSuccess();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['licenses-and-certificates'],
    });
  });
});
