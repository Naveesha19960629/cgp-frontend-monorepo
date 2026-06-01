import { renderHook } from '@testing-library/react';

import { useJobRequirementsForm } from '@/views/vacancies/hooks/use-job-requirements-form';

// -- Mock react-i18next ---------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// -- Mock vacancy form context --------------------------------------------

type RefItem = { id: string; label: string; source: string };

const defaultJobRequirement = {
  isEnabled: true,
  dataTakenFromCandidate: false,
  discipline: [] as RefItem[],
  careerPath: [] as RefItem[],
  level: [] as RefItem[],
  role: [] as RefItem[],
  jobTitle: [] as RefItem[],
  employmentType: [] as RefItem[],
  workSchedule: [] as RefItem[],
  engagementModel: [] as RefItem[],
  description: '',
};

const mockUseVacancyForm = vi.hoisted(() =>
  vi.fn(() => ({
    form: {
      jobRequirements: [{ ...defaultJobRequirement }],
    },
  }))
);

vi.mock(
  '@/views/vacancies/context/vacancy-form-context',
  async importOriginal => {
    const actual =
      await importOriginal<
        typeof import('@/views/vacancies/context/vacancy-form-context')
      >();
    return {
      ...actual,
      useVacancyForm: mockUseVacancyForm,
    };
  }
);

// -- Tests ----------------------------------------------------------------

describe('useJobRequirementsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('default values — no initial data', () => {
    it('returns isEnabled=true with empty arrays', () => {
      const { result } = renderHook(() => useJobRequirementsForm());
      const values = result.current.getValues();

      expect(values.isEnabled).toBe(true);
      expect(values.dataTakenFromCandidate).toBe(false);
      expect(values.discipline).toEqual([]);
      expect(values.careerPath).toEqual([]);
      expect(values.level).toEqual([]);
      expect(values.role).toEqual([]);
      expect(values.jobTitle).toEqual([]);
      expect(values.employmentType).toEqual([]);
      expect(values.workSchedule).toEqual([]);
      expect(values.engagementModel).toEqual([]);
      expect(values.description).toBe('');
    });
  });

  describe('default values — with saved data', () => {
    it('maps refs to form options with value/label/source', () => {
      mockUseVacancyForm.mockReturnValue({
        form: {
          jobRequirements: [
            {
              isEnabled: true,
              dataTakenFromCandidate: false,
              discipline: [
                { id: 'disc-1', label: 'Engineering', source: 'MASTER' },
              ],
              careerPath: [{ id: 'cp-1', label: 'Software', source: 'MASTER' }],
              level: [{ id: 'l-1', label: 'Senior', source: 'MASTER' }],
              role: [
                { id: 'r-1', label: 'Developer', source: 'MASTER' },
                { id: 'r-2', label: 'Architect', source: 'PENDING' },
              ],
              jobTitle: [
                {
                  id: 'jt-1',
                  label: 'Software Engineer',
                  source: 'MASTER',
                },
              ],
              employmentType: [
                { id: 'et-1', label: 'Full-time', source: 'MASTER' },
              ],
              workSchedule: [
                { id: 'ws-1', label: 'Day Shift', source: 'MASTER' },
              ],
              engagementModel: [
                { id: 'em-1', label: 'Contract', source: 'MASTER' },
              ],
              description: 'Test description',
            },
          ],
        },
      });

      const { result } = renderHook(() => useJobRequirementsForm());
      const values = result.current.getValues();

      expect(values.discipline).toEqual([
        { value: 'disc-1', label: 'Engineering', source: 'MASTER' },
      ]);
      expect(values.careerPath).toEqual([
        { value: 'cp-1', label: 'Software', source: 'MASTER' },
      ]);
      expect(values.level).toEqual([
        { value: 'l-1', label: 'Senior', source: 'MASTER' },
      ]);
      expect(values.role).toHaveLength(2);
      expect(values.role[0]).toMatchObject({
        value: 'r-1',
        label: 'Developer',
      });
      expect(values.role[1]).toMatchObject({
        value: 'r-2',
        label: 'Architect',
        source: 'PENDING',
      });
      expect(values.jobTitle).toEqual([
        {
          value: 'jt-1',
          label: 'Software Engineer',
          source: 'MASTER',
        },
      ]);
      expect(values.employmentType).toEqual([
        { value: 'et-1', label: 'Full-time', source: 'MASTER' },
      ]);
      expect(values.workSchedule).toEqual([
        { value: 'ws-1', label: 'Day Shift', source: 'MASTER' },
      ]);
      expect(values.engagementModel).toEqual([
        { value: 'em-1', label: 'Contract', source: 'MASTER' },
      ]);
      expect(values.description).toBe('Test description');
    });

    it('handles undefined description gracefully', () => {
      mockUseVacancyForm.mockReturnValue({
        form: {
          jobRequirements: [
            {
              ...defaultJobRequirement,
              description: undefined as unknown as string,
            },
          ],
        },
      });

      const { result } = renderHook(() => useJobRequirementsForm());
      expect(result.current.getValues().description).toBe('');
    });
  });
});
