import { useAddBatchMutation } from '@/views/vacancies/hooks/mutations/use-add-batch-mutation';
import { useAddDepartmentMutation } from '@/views/vacancies/hooks/mutations/use-add-department-mutation';
import { useAddFacultyMutation } from '@/views/vacancies/hooks/mutations/use-add-faculty-mutation';
import { useAddLevelOfQualificationMutation } from '@/views/vacancies/hooks/mutations/use-add-level-of-qualification-mutation';
import { useAddQualificationMutation } from '@/views/vacancies/hooks/mutations/use-add-qualification-mutation';
import { useAddSpecializationMutation } from '@/views/vacancies/hooks/mutations/use-add-specialization-mutation';
import { useAddTertiaryAwardingBodyMutation } from '@/views/vacancies/hooks/mutations/use-add-tertiary-awarding-body-mutation';

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

const mockAddQualification = vi.fn();
const mockAddTertiaryAwardingBody = vi.fn();
const mockAddLevelOfQualification = vi.fn();
const mockAddSpecialization = vi.fn();
const mockAddBatch = vi.fn();
const mockAddDepartment = vi.fn();
const mockAddFaculty = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  tertiaryEducationService: {
    addQualification: (...args: unknown[]) =>
      mockAddQualification(...args) as unknown,
    addTertiaryAwardingBody: (...args: unknown[]) =>
      mockAddTertiaryAwardingBody(...args) as unknown,
    addLevelOfQualification: (...args: unknown[]) =>
      mockAddLevelOfQualification(...args) as unknown,
    addSpecialization: (...args: unknown[]) =>
      mockAddSpecialization(...args) as unknown,
    addBatch: (...args: unknown[]) => mockAddBatch(...args) as unknown,
    addDepartment: (...args: unknown[]) =>
      mockAddDepartment(...args) as unknown,
    addFaculty: (...args: unknown[]) => mockAddFaculty(...args) as unknown,
  },
}));

// -- Shared setup -----------------------------------------------------------

describe('tertiary education mutation hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockAddQualification.mockResolvedValue({ data: { pendingId: 'new-id' } });
    mockAddTertiaryAwardingBody.mockResolvedValue({
      data: { pendingId: 'new-id' },
    });
    mockAddLevelOfQualification.mockResolvedValue({
      data: { pendingId: 'new-id' },
    });
    mockAddSpecialization.mockResolvedValue({ data: { pendingId: 'new-id' } });
    mockAddBatch.mockResolvedValue({ data: { pendingId: 'new-id' } });
    mockAddDepartment.mockResolvedValue({ data: { pendingId: 'new-id' } });
    mockAddFaculty.mockResolvedValue({ data: { pendingId: 'new-id' } });
  });

  // -- useAddQualificationMutation --------------------------------------------

  describe('useAddQualificationMutation', () => {
    it('mutationFn calls addQualification with the display value', async () => {
      const mutation =
        useAddQualificationMutation() as unknown as MockMutation<string>;
      await mutation.mutationFn('BSc Computer Science');
      expect(mockAddQualification).toHaveBeenCalledWith('BSc Computer Science');
    });

    it('mutationFn returns the API response', async () => {
      const mutation =
        useAddQualificationMutation() as unknown as MockMutation<string>;
      const result = await mutation.mutationFn('MBA');
      expect(result).toEqual({ data: { pendingId: 'new-id' } });
    });

    it("onSuccess invalidates the ['qualifications'] query cache", async () => {
      const mutation =
        useAddQualificationMutation() as unknown as MockMutation<string>;
      await mutation.onSuccess();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['qualifications'],
      });
    });
  });

  // -- useAddTertiaryAwardingBodyMutation ------------------------------------

  describe('useAddTertiaryAwardingBodyMutation', () => {
    it('mutationFn calls addTertiaryAwardingBody with params', async () => {
      const mutation =
        useAddTertiaryAwardingBodyMutation() as unknown as MockMutation<{
          displayValue: string;
          locationId?: string;
          url?: string;
        }>;
      await mutation.mutationFn({ displayValue: 'University of Moratuwa' });
      expect(mockAddTertiaryAwardingBody).toHaveBeenCalledWith({
        displayValue: 'University of Moratuwa',
      });
    });

    it('mutationFn passes locationId and url when provided', async () => {
      const mutation =
        useAddTertiaryAwardingBodyMutation() as unknown as MockMutation<{
          displayValue: string;
          locationId?: string;
          url?: string;
        }>;
      await mutation.mutationFn({
        displayValue: 'MIT',
        locationId: 'loc-1',
        url: 'https://mit.edu',
      });
      expect(mockAddTertiaryAwardingBody).toHaveBeenCalledWith({
        displayValue: 'MIT',
        locationId: 'loc-1',
        url: 'https://mit.edu',
      });
    });

    it("onSuccess invalidates the ['tertiary-awarding-bodies'] query cache", async () => {
      const mutation =
        useAddTertiaryAwardingBodyMutation() as unknown as MockMutation<{
          displayValue: string;
        }>;
      await mutation.onSuccess();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['tertiary-awarding-bodies'],
      });
    });
  });

  // -- useAddLevelOfQualificationMutation ------------------------------------

  describe('useAddLevelOfQualificationMutation', () => {
    it('mutationFn calls addLevelOfQualification with the display value', async () => {
      const mutation =
        useAddLevelOfQualificationMutation() as unknown as MockMutation<string>;
      await mutation.mutationFn("Bachelor's");
      expect(mockAddLevelOfQualification).toHaveBeenCalledWith("Bachelor's");
    });

    it("onSuccess invalidates the ['level-of-qualifications'] query cache", async () => {
      const mutation =
        useAddLevelOfQualificationMutation() as unknown as MockMutation<string>;
      await mutation.onSuccess();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['level-of-qualifications'],
      });
    });
  });

  // -- useAddSpecializationMutation ------------------------------------------

  describe('useAddSpecializationMutation', () => {
    it('mutationFn calls addSpecialization with the display value', async () => {
      const mutation =
        useAddSpecializationMutation() as unknown as MockMutation<string>;
      await mutation.mutationFn('Data Science');
      expect(mockAddSpecialization).toHaveBeenCalledWith('Data Science');
    });

    it("onSuccess invalidates the ['specializations'] query cache", async () => {
      const mutation =
        useAddSpecializationMutation() as unknown as MockMutation<string>;
      await mutation.onSuccess();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['specializations'],
      });
    });
  });

  // -- useAddBatchMutation ---------------------------------------------------

  describe('useAddBatchMutation', () => {
    it('mutationFn calls addBatch with the display value', async () => {
      const mutation = useAddBatchMutation() as unknown as MockMutation<string>;
      await mutation.mutationFn('Batch 2024');
      expect(mockAddBatch).toHaveBeenCalledWith('Batch 2024');
    });

    it("onSuccess invalidates the ['batches'] query cache", async () => {
      const mutation = useAddBatchMutation() as unknown as MockMutation<string>;
      await mutation.onSuccess();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['batches'],
      });
    });
  });

  // -- useAddDepartmentMutation ----------------------------------------------

  describe('useAddDepartmentMutation', () => {
    it('mutationFn calls addDepartment with the display value', async () => {
      const mutation =
        useAddDepartmentMutation() as unknown as MockMutation<string>;
      await mutation.mutationFn('IT Department');
      expect(mockAddDepartment).toHaveBeenCalledWith('IT Department');
    });

    it("onSuccess invalidates the ['departments'] query cache", async () => {
      const mutation =
        useAddDepartmentMutation() as unknown as MockMutation<string>;
      await mutation.onSuccess();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['departments'],
      });
    });
  });

  // -- useAddFacultyMutation -------------------------------------------------

  describe('useAddFacultyMutation', () => {
    it('mutationFn calls addFaculty with the display value', async () => {
      const mutation =
        useAddFacultyMutation() as unknown as MockMutation<string>;
      await mutation.mutationFn('Faculty of Engineering');
      expect(mockAddFaculty).toHaveBeenCalledWith('Faculty of Engineering');
    });

    it("onSuccess invalidates the ['faculties'] query cache", async () => {
      const mutation =
        useAddFacultyMutation() as unknown as MockMutation<string>;
      await mutation.onSuccess();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['faculties'],
      });
    });
  });
}); // end: tertiary education mutation hooks
