import { useAddAwardingBodyMutation } from '@/views/vacancies/hooks/mutations/use-add-awarding-body-mutation';
import { useAddExaminationMutation } from '@/views/vacancies/hooks/mutations/use-add-examination-mutation';
import { useAddFieldOfStudyMutation } from '@/views/vacancies/hooks/mutations/use-add-field-of-study-mutation';
import { useAddSchoolMutation } from '@/views/vacancies/hooks/mutations/use-add-school-mutation';
import { useCreateSocietyMutation } from '@/views/vacancies/hooks/mutations/use-create-society-mutation';

// -- Types ------------------------------------------------------------------

type MockMutation<TArg = unknown> = {
  mutationFn: (arg: TArg) => Promise<unknown>;
  onSuccess: () => void | Promise<void>;
};

// -- Mock @tanstack/react-query -------------------------------------------

const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: unknown) => mockUseMutation(options) as unknown,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// -- Mock services ----------------------------------------------------------

const mockAddExamination = vi.fn();
const mockAddAwardingBody = vi.fn();
const mockAddFieldOfStudy = vi.fn();
const mockAddSchool = vi.fn();
const mockCreateSociety = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  secondaryEducationService: {
    addExamination: (...args: unknown[]) =>
      mockAddExamination(...args) as unknown,
    addAwardingBody: (...args: unknown[]) =>
      mockAddAwardingBody(...args) as unknown,
    addFieldOfStudy: (...args: unknown[]) =>
      mockAddFieldOfStudy(...args) as unknown,
    addSchool: (...args: unknown[]) => mockAddSchool(...args) as unknown,
  },
  societyService: {
    createSociety: (...args: unknown[]) =>
      mockCreateSociety(...args) as unknown,
  },
}));

// -- Shared setup -----------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMutation.mockImplementation((options: unknown) => options);
  mockInvalidateQueries.mockResolvedValue(undefined);
  mockAddExamination.mockResolvedValue({ data: { pendingId: 'new-id' } });
  mockAddAwardingBody.mockResolvedValue({ data: { pendingId: 'new-id' } });
  mockAddFieldOfStudy.mockResolvedValue({ data: { pendingId: 'new-id' } });
  mockAddSchool.mockResolvedValue({ data: { pendingId: 'new-id' } });
  mockCreateSociety.mockResolvedValue({
    id: 'soc-id',
    name: 'Test Society',
    source: 'PENDING',
  });
});

// -- useAddExaminationMutation ----------------------------------------------

describe('useAddExaminationMutation', () => {
  it('mutationFn calls addExamination with the display value', async () => {
    const mutation =
      useAddExaminationMutation() as unknown as MockMutation<string>;
    await mutation.mutationFn('O-Levels');
    expect(mockAddExamination).toHaveBeenCalledWith('O-Levels');
  });

  it('mutationFn returns the API response', async () => {
    const mutation =
      useAddExaminationMutation() as unknown as MockMutation<string>;
    const result = await mutation.mutationFn('A-Levels');
    expect(result).toEqual({ data: { pendingId: 'new-id' } });
  });

  it("onSuccess invalidates the ['examinations'] query cache", async () => {
    const mutation =
      useAddExaminationMutation() as unknown as MockMutation<string>;
    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['examinations'],
    });
  });
});

// -- useAddAwardingBodyMutation ---------------------------------------------

describe('useAddAwardingBodyMutation', () => {
  it('mutationFn calls addAwardingBody with the display value', async () => {
    const mutation =
      useAddAwardingBodyMutation() as unknown as MockMutation<string>;
    await mutation.mutationFn('AQA');
    expect(mockAddAwardingBody).toHaveBeenCalledWith('AQA');
  });

  it("onSuccess invalidates the ['secondary-awarding-bodies'] query cache", async () => {
    const mutation =
      useAddAwardingBodyMutation() as unknown as MockMutation<string>;
    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['secondary-awarding-bodies'],
    });
  });
});

// -- useAddFieldOfStudyMutation ---------------------------------------------

describe('useAddFieldOfStudyMutation', () => {
  it('mutationFn calls addFieldOfStudy with the display value', async () => {
    const mutation =
      useAddFieldOfStudyMutation() as unknown as MockMutation<string>;
    await mutation.mutationFn('Computer Science');
    expect(mockAddFieldOfStudy).toHaveBeenCalledWith('Computer Science');
  });

  it("onSuccess invalidates the ['field-of-studies'] query cache", async () => {
    const mutation =
      useAddFieldOfStudyMutation() as unknown as MockMutation<string>;
    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['field-of-studies'],
    });
  });
});

// -- useAddSchoolMutation ---------------------------------------------------

describe('useAddSchoolMutation', () => {
  it('mutationFn calls addSchool with all provided params', async () => {
    const mutation = useAddSchoolMutation() as unknown as MockMutation<{
      displayValue: string;
      locationId?: string;
      url?: string;
    }>;
    await mutation.mutationFn({
      displayValue: 'Oxford High',
      locationId: 'loc-uuid',
      url: 'https://oxford.edu',
    });
    expect(mockAddSchool).toHaveBeenCalledWith({
      displayValue: 'Oxford High',
      locationId: 'loc-uuid',
      url: 'https://oxford.edu',
    });
  });

  it('mutationFn works with only displayValue (optional fields omitted)', async () => {
    const mutation = useAddSchoolMutation() as unknown as MockMutation<{
      displayValue: string;
      locationId?: string;
      url?: string;
    }>;
    await mutation.mutationFn({ displayValue: 'Home Academy' });
    expect(mockAddSchool).toHaveBeenCalledWith({
      displayValue: 'Home Academy',
    });
  });

  it("onSuccess invalidates the ['schools'] query cache", async () => {
    const mutation = useAddSchoolMutation() as unknown as MockMutation<{
      displayValue: string;
    }>;
    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['schools'],
    });
  });
});

// -- useCreateSocietyMutation -----------------------------------------------

describe('useCreateSocietyMutation', () => {
  it('mutationFn calls societyService.createSociety with the display value', async () => {
    const mutation =
      useCreateSocietyMutation() as unknown as MockMutation<string>;
    await mutation.mutationFn('Rotaract Club');
    expect(mockCreateSociety).toHaveBeenCalledWith('Rotaract Club');
  });

  it('mutationFn returns the API response', async () => {
    const mutation =
      useCreateSocietyMutation() as unknown as MockMutation<string>;
    const result = await mutation.mutationFn('Swimming Team');
    expect(result).toEqual({
      id: 'soc-id',
      name: 'Test Society',
      source: 'PENDING',
    });
  });

  it("onSuccess invalidates the ['societies'] query cache", async () => {
    const mutation =
      useCreateSocietyMutation() as unknown as MockMutation<string>;
    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['societies'],
    });
  });

  it('handles society names with special characters', async () => {
    const mutation =
      useCreateSocietyMutation() as unknown as MockMutation<string>;
    await mutation.mutationFn('Society & Club - 2024');
    expect(mockCreateSociety).toHaveBeenCalledWith('Society & Club - 2024');
  });
});
