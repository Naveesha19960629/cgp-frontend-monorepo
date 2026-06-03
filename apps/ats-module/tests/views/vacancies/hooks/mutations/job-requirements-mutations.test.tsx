import { useAddCareerPathMutation } from '@/views/vacancies/hooks/mutations/use-add-career-path-mutation';
import { useAddDisciplineMutation } from '@/views/vacancies/hooks/mutations/use-add-discipline-mutation';
import { useAddJobTitleMutation } from '@/views/vacancies/hooks/mutations/use-add-job-title-mutation';
import { useAddRoleMutation } from '@/views/vacancies/hooks/mutations/use-add-role-mutation';
import type {
  CreateCareerPathPayload,
  CreateRolePayload,
} from '@/views/vacancies/types';

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

const mockAddDiscipline = vi.fn();
const mockAddCareerPath = vi.fn();
const mockAddRole = vi.fn();
const mockAddJobTitle = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  disciplineService: {
    addDiscipline: (...args: unknown[]) =>
      mockAddDiscipline(...args) as unknown,
  },
  careerPathService: {
    addCareerPath: (...args: unknown[]) =>
      mockAddCareerPath(...args) as unknown,
  },
  roleService: {
    addRole: (...args: unknown[]) => mockAddRole(...args) as unknown,
  },
  jobTitleService: {
    addJobTitle: (...args: unknown[]) => mockAddJobTitle(...args) as unknown,
  },
}));

// -- Shared setup -----------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMutation.mockImplementation((options: unknown) => options);
  mockInvalidateQueries.mockResolvedValue(undefined);
  mockAddDiscipline.mockResolvedValue({ data: { pendingId: 'new-id' } });
  mockAddCareerPath.mockResolvedValue({ data: { pendingId: 'new-id' } });
  mockAddRole.mockResolvedValue({ data: { pendingId: 'new-id' } });
  mockAddJobTitle.mockResolvedValue({ data: { pendingId: 'new-id' } });
});

// -- useAddDisciplineMutation -----------------------------------------------

describe('useAddDisciplineMutation', () => {
  it('mutationFn calls addDiscipline with the display value', async () => {
    const mutation =
      useAddDisciplineMutation() as unknown as MockMutation<string>;
    await mutation.mutationFn('Engineering');
    expect(mockAddDiscipline).toHaveBeenCalledWith('Engineering');
  });

  it('mutationFn returns the API response', async () => {
    const mutation =
      useAddDisciplineMutation() as unknown as MockMutation<string>;
    const result = await mutation.mutationFn('Engineering');
    expect(result).toEqual({ data: { pendingId: 'new-id' } });
  });

  it("onSuccess invalidates the ['disciplines'] query cache", async () => {
    const mutation =
      useAddDisciplineMutation() as unknown as MockMutation<string>;
    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['disciplines'],
    });
  });
});

// -- useAddCareerPathMutation -----------------------------------------------

describe('useAddCareerPathMutation', () => {
  it('mutationFn calls addCareerPath with the payload', async () => {
    const payload: CreateCareerPathPayload = {
      displayValue: 'New Career Path',
      discipline: { id: 'disc-1', source: 'MASTER' },
    };
    const mutation =
      useAddCareerPathMutation() as unknown as MockMutation<CreateCareerPathPayload>;
    await mutation.mutationFn(payload);
    expect(mockAddCareerPath).toHaveBeenCalledWith(payload);
  });

  it("onSuccess invalidates the ['career-paths'] query cache", async () => {
    const mutation =
      useAddCareerPathMutation() as unknown as MockMutation<CreateCareerPathPayload>;
    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['career-paths'],
    });
  });
});

// -- useAddRoleMutation -----------------------------------------------------

describe('useAddRoleMutation', () => {
  it('mutationFn calls addRole with the payload', async () => {
    const payload: CreateRolePayload = {
      displayValue: 'New Role',
      careerPath: { id: 'cp-1', source: 'MASTER' },
    };
    const mutation =
      useAddRoleMutation() as unknown as MockMutation<CreateRolePayload>;
    await mutation.mutationFn(payload);
    expect(mockAddRole).toHaveBeenCalledWith(payload);
  });

  it("onSuccess invalidates the ['job-roles'] query cache", async () => {
    const mutation =
      useAddRoleMutation() as unknown as MockMutation<CreateRolePayload>;
    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['job-roles'],
    });
  });
});

// -- useAddJobTitleMutation -------------------------------------------------

describe('useAddJobTitleMutation', () => {
  it('mutationFn calls addJobTitle with the display value', async () => {
    const mutation =
      useAddJobTitleMutation() as unknown as MockMutation<string>;
    await mutation.mutationFn('Software Engineer');
    expect(mockAddJobTitle).toHaveBeenCalledWith('Software Engineer');
  });

  it('mutationFn returns the API response', async () => {
    const mutation =
      useAddJobTitleMutation() as unknown as MockMutation<string>;
    const result = await mutation.mutationFn('Software Engineer');
    expect(result).toEqual({ data: { pendingId: 'new-id' } });
  });

  it("onSuccess invalidates the ['job-titles'] query cache", async () => {
    const mutation =
      useAddJobTitleMutation() as unknown as MockMutation<string>;
    await mutation.onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['job-titles'],
    });
  });
});
