import { renderHook } from '@testing-library/react';

import {
  useExaminationsQuery,
  useExaminationsSearch,
} from '@/views/vacancies/hooks/queries/use-examinations-query';
import {
  useFieldsOfStudyQuery,
  useFieldsOfStudySearch,
} from '@/views/vacancies/hooks/queries/use-fields-of-study-query';
import { useGendersQuery } from '@/views/vacancies/hooks/queries/use-gender-query';
import {
  useSchoolLocationsQuery,
  useSchoolLocationsSearch,
} from '@/views/vacancies/hooks/queries/use-school-locations-query';
import {
  useSchoolsQuery,
  useSchoolsSearch,
} from '@/views/vacancies/hooks/queries/use-schools-query';
import {
  useAwardingBodiesSearch,
  useSecondaryAwardingBodiesQuery,
} from '@/views/vacancies/hooks/queries/use-secondary-awarding-bodies-query';
import { useSocietiesQuery } from '@/views/vacancies/hooks/queries/use-societies-query';

// -- Mock @tanstack/react-query -------------------------------------------

const mockUseQuery = vi.fn();
const mockFetchQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options) as unknown,
  useQueryClient: () => ({ fetchQuery: mockFetchQuery }),
}));

// -- Mock services ----------------------------------------------------------

const mockGetGenders = vi.fn();
const mockGetSchools = vi.fn();
const mockGetSchoolLocations = vi.fn();
const mockGetExaminations = vi.fn();
const mockGetAwardingBodies = vi.fn();
const mockGetFieldsOfStudy = vi.fn();
const mockGetSocieties = vi.fn();

vi.mock('@/views/vacancies/services/gender.service', () => ({
  genderService: {
    getGenders: (...args: unknown[]) => mockGetGenders(...args) as unknown,
  },
}));

vi.mock('@/views/vacancies/services/secondary-education.service', () => ({
  secondaryEducationService: {
    getSchools: (...args: unknown[]) => mockGetSchools(...args) as unknown,
    getSchoolLocations: (...args: unknown[]) =>
      mockGetSchoolLocations(...args) as unknown,
    getExaminations: (...args: unknown[]) =>
      mockGetExaminations(...args) as unknown,
    getAwardingBodies: (...args: unknown[]) =>
      mockGetAwardingBodies(...args) as unknown,
    getFieldsOfStudy: (...args: unknown[]) =>
      mockGetFieldsOfStudy(...args) as unknown,
  },
}));

vi.mock('@/views/vacancies/services/society.service', () => ({
  societyService: {
    getSocieties: (...args: unknown[]) => mockGetSocieties(...args) as unknown,
  },
}));

// -- Helpers ----------------------------------------------------------------

/** Standard paged API envelope */
const apiResponse = <T,>(items: T[]) => ({
  data: { items: { content: items } },
});

describe('secondary education query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  // -- useGendersQuery --------------------------------------------------------

  describe('useGendersQuery', () => {
    it('passes correct queryKey', () => {
      useGendersQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['genders'] })
      );
    });

    it('queryFn calls genderService.getGenders', async () => {
      mockGetGenders.mockResolvedValue({ data: {} });
      useGendersQuery();
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetGenders).toHaveBeenCalledTimes(1);
    });
  });

  // -- useSchoolsQuery --------------------------------------------------------

  describe('useSchoolsQuery', () => {
    it('passes correct queryKey with search term', () => {
      useSchoolsQuery('oxford');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['schools', 'oxford'] })
      );
    });

    it('defaults search to empty string', () => {
      useSchoolsQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['schools', ''] })
      );
    });

    it('queryFn calls getSchools with the search string', async () => {
      mockGetSchools.mockResolvedValue(apiResponse([]));
      useSchoolsQuery('oxford');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetSchools).toHaveBeenCalledWith('oxford');
    });
  });

  // -- useSchoolsSearch -------------------------------------------------------

  describe('useSchoolsSearch', () => {
    it('maps fetchQuery result to { value, label, source } options', async () => {
      mockFetchQuery.mockResolvedValue(
        apiResponse([
          { id: 'school-1', label: 'Oxford High', source: 'MASTER' },
        ])
      );
      const { result } = renderHook(() => useSchoolsSearch());
      const items = await result.current('oxford');
      expect(items).toEqual([
        { value: 'school-1', label: 'Oxford High', source: 'MASTER' },
      ]);
    });

    it('passes the search string to getSchools via fetchQuery', async () => {
      mockFetchQuery.mockResolvedValue(apiResponse([]));
      const { result } = renderHook(() => useSchoolsSearch());
      await result.current('cambridge');
      const { queryFn } = mockFetchQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetSchools).toHaveBeenCalledWith('cambridge');
    });
  });

  // -- useSchoolLocationsQuery ------------------------------------------------

  describe('useSchoolLocationsQuery', () => {
    it('passes correct queryKey with search term', () => {
      useSchoolLocationsQuery('london');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['school-locations', 'london'] })
      );
    });

    it('queryFn calls getSchoolLocations with the search string', async () => {
      mockGetSchoolLocations.mockResolvedValue(apiResponse([]));
      useSchoolLocationsQuery('london');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetSchoolLocations).toHaveBeenCalledWith('london');
    });
  });

  // -- useSchoolLocationsSearch -----------------------------------------------

  describe('useSchoolLocationsSearch', () => {
    it('maps fetchQuery result to { value, label } options (no source field)', async () => {
      mockFetchQuery.mockResolvedValue(
        apiResponse([{ id: 'loc-1', label: 'London', countryCode: 'GB' }])
      );
      const { result } = renderHook(() => useSchoolLocationsSearch());
      const items = await result.current('london');
      expect(items).toEqual([{ value: 'loc-1', label: 'London' }]);
      expect(items[0]).not.toHaveProperty('source');
    });
  });

  // -- useExaminationsQuery ---------------------------------------------------

  describe('useExaminationsQuery', () => {
    it('passes correct queryKey with search term', () => {
      useExaminationsQuery('o-level');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['examinations', 'o-level'] })
      );
    });

    it('defaults search to empty string', () => {
      useExaminationsQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['examinations', ''] })
      );
    });

    it('queryFn calls getExaminations with the search string', async () => {
      mockGetExaminations.mockResolvedValue(apiResponse([]));
      useExaminationsQuery('a-level');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetExaminations).toHaveBeenCalledWith('a-level');
    });
  });

  // -- useExaminationsSearch --------------------------------------------------

  describe('useExaminationsSearch', () => {
    it('maps fetchQuery result to { value, label, source } options', async () => {
      mockFetchQuery.mockResolvedValue(
        apiResponse([{ id: 'exam-1', label: 'A-Levels', source: 'MASTER' }])
      );
      const { result } = renderHook(() => useExaminationsSearch());
      const items = await result.current('a-level');
      expect(items).toEqual([
        { value: 'exam-1', label: 'A-Levels', source: 'MASTER' },
      ]);
    });
  });

  // -- useSecondaryAwardingBodiesQuery ----------------------------------------

  describe('useSecondaryAwardingBodiesQuery', () => {
    it('passes correct queryKey with search term', () => {
      useSecondaryAwardingBodiesQuery('aqa');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['secondary-awarding-bodies', 'aqa'],
        })
      );
    });

    it('queryFn calls getAwardingBodies with the search string', async () => {
      mockGetAwardingBodies.mockResolvedValue(apiResponse([]));
      useSecondaryAwardingBodiesQuery('edexcel');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetAwardingBodies).toHaveBeenCalledWith('edexcel');
    });
  });

  // -- useAwardingBodiesSearch ------------------------------------------------

  describe('useAwardingBodiesSearch', () => {
    it('maps fetchQuery result to { value, label, source } options', async () => {
      mockFetchQuery.mockResolvedValue(
        apiResponse([{ id: 'ab-1', label: 'AQA', source: 'MASTER' }])
      );
      const { result } = renderHook(() => useAwardingBodiesSearch());
      const items = await result.current('aqa');
      expect(items).toEqual([
        { value: 'ab-1', label: 'AQA', source: 'MASTER' },
      ]);
    });
  });

  // -- useFieldsOfStudyQuery --------------------------------------------------

  describe('useFieldsOfStudyQuery', () => {
    it('passes correct queryKey with search term', () => {
      useFieldsOfStudyQuery('science');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['field-of-studies', 'science'] })
      );
    });

    it('queryFn calls getFieldsOfStudy with the search string', async () => {
      mockGetFieldsOfStudy.mockResolvedValue(apiResponse([]));
      useFieldsOfStudyQuery('maths');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetFieldsOfStudy).toHaveBeenCalledWith('maths');
    });
  });

  // -- useFieldsOfStudySearch -------------------------------------------------

  describe('useFieldsOfStudySearch', () => {
    it('maps fetchQuery result to { value, label, source } options', async () => {
      mockFetchQuery.mockResolvedValue(
        apiResponse([{ id: 'fos-1', label: 'Mathematics', source: 'PENDING' }])
      );
      const { result } = renderHook(() => useFieldsOfStudySearch());
      const items = await result.current('maths');
      expect(items).toEqual([
        { value: 'fos-1', label: 'Mathematics', source: 'PENDING' },
      ]);
    });
  });

  // -- useSocietiesQuery ------------------------------------------------------

  describe('useSocietiesQuery', () => {
    it('passes correct queryKey with search term', () => {
      useSocietiesQuery('rotaract');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['societies', 'rotaract'] })
      );
    });

    it('defaults search to empty string', () => {
      useSocietiesQuery('', true);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['societies', ''] })
      );
    });

    it('queryFn calls societyService.getSocieties with the search string', async () => {
      mockGetSocieties.mockResolvedValue(apiResponse([]));
      useSocietiesQuery('club');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetSocieties).toHaveBeenCalledWith('club');
    });

    it('respects enabled parameter', () => {
      useSocietiesQuery('test', false);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      );
    });

    it('defaults enabled to true', () => {
      useSocietiesQuery('test');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      );
    });
  });
}); // end: secondary education query hooks
