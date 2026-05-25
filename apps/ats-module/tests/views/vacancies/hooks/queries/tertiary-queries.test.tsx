import { renderHook } from '@testing-library/react';

import {
  useBatchesQuery,
  useBatchesSearch,
} from '@/views/vacancies/hooks/queries/use-batches-query';
import {
  useDeliverySchedulesQuery,
  useDeliverySchedulesSearch,
} from '@/views/vacancies/hooks/queries/use-delivery-schedules-query';
import {
  useDepartmentsQuery,
  useDepartmentsSearch,
} from '@/views/vacancies/hooks/queries/use-departments-query';
import {
  useFacultiesQuery,
  useFacultiesSearch,
} from '@/views/vacancies/hooks/queries/use-faculties-query';
import {
  useLevelOfQualificationsQuery,
  useLevelOfQualificationsSearch,
} from '@/views/vacancies/hooks/queries/use-level-of-qualifications-query';
import {
  useQualificationsQuery,
  useQualificationsSearch,
} from '@/views/vacancies/hooks/queries/use-qualifications-query';
import {
  useSpecializationsQuery,
  useSpecializationsSearch,
} from '@/views/vacancies/hooks/queries/use-specializations-query';
import {
  useStudyModesQuery,
  useStudyModesSearch,
} from '@/views/vacancies/hooks/queries/use-study-modes-query';
import {
  useStudyPatternsQuery,
  useStudyPatternsSearch,
} from '@/views/vacancies/hooks/queries/use-study-patterns-query';
import {
  useTertiaryAwardingBodiesQuery,
  useTertiaryAwardingBodiesSearch,
} from '@/views/vacancies/hooks/queries/use-tertiary-awarding-bodies-query';
import {
  useTertiaryAwardingBodyLocationsQuery,
  useTertiaryAwardingBodyLocationsSearch,
} from '@/views/vacancies/hooks/queries/use-tertiary-awarding-body-locations-query';

// -- Mock @cgp/data-access --------------------------------------------------

const mockUseQuery = vi.fn();
const mockFetchQuery = vi.fn();

vi.mock('@cgp/data-access', () => ({
  useQuery: (options: unknown) => mockUseQuery(options) as unknown,
  useQueryClient: () => ({ fetchQuery: mockFetchQuery }),
}));

// -- Mock services ----------------------------------------------------------

const mockGetQualifications = vi.fn();
const mockGetTertiaryAwardingBodies = vi.fn();
const mockGetTertiaryAwardingBodyLocations = vi.fn();
const mockGetLevelOfQualifications = vi.fn();
const mockGetSpecializations = vi.fn();
const mockGetStudyModes = vi.fn();
const mockGetStudyPatterns = vi.fn();
const mockGetDeliverySchedules = vi.fn();
const mockGetBatches = vi.fn();
const mockGetDepartments = vi.fn();
const mockGetFaculties = vi.fn();

vi.mock('@/views/vacancies/services/tertiary-education.service', () => ({
  tertiaryEducationService: {
    getQualifications: (...args: unknown[]) =>
      mockGetQualifications(...args) as unknown,
    getTertiaryAwardingBodies: (...args: unknown[]) =>
      mockGetTertiaryAwardingBodies(...args) as unknown,
    getTertiaryAwardingBodyLocations: (...args: unknown[]) =>
      mockGetTertiaryAwardingBodyLocations(...args) as unknown,
    getLevelOfQualifications: (...args: unknown[]) =>
      mockGetLevelOfQualifications(...args) as unknown,
    getSpecializations: (...args: unknown[]) =>
      mockGetSpecializations(...args) as unknown,
    getStudyModes: (...args: unknown[]) =>
      mockGetStudyModes(...args) as unknown,
    getStudyPatterns: (...args: unknown[]) =>
      mockGetStudyPatterns(...args) as unknown,
    getDeliverySchedules: (...args: unknown[]) =>
      mockGetDeliverySchedules(...args) as unknown,
    getBatches: (...args: unknown[]) => mockGetBatches(...args) as unknown,
    getDepartments: (...args: unknown[]) =>
      mockGetDepartments(...args) as unknown,
    getFaculties: (...args: unknown[]) => mockGetFaculties(...args) as unknown,
  },
}));

// -- Helpers ----------------------------------------------------------------

/** Standard paged API envelope */
const apiResponse = <T,>(items: T[]) => ({
  data: { items: { content: items } },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
});

// -- useQualificationsQuery ------------------------------------------------

describe('useQualificationsQuery', () => {
  it('passes correct queryKey with search term', () => {
    useQualificationsQuery('bsc');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['qualifications', 'bsc'] })
    );
  });

  it('defaults search to empty string', () => {
    useQualificationsQuery();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['qualifications', ''] })
    );
  });

  it('queryFn calls getQualifications with the search string', async () => {
    mockGetQualifications.mockResolvedValue(apiResponse([]));
    useQualificationsQuery('mba');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetQualifications).toHaveBeenCalledWith('mba');
  });
});

// -- useQualificationsSearch -----------------------------------------------

describe('useQualificationsSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([{ id: 'q-1', label: 'BSc CS', source: 'MASTER' }])
    );
    const { result } = renderHook(() => useQualificationsSearch());
    const items = await result.current('bsc');
    expect(items).toEqual([{ id: 'q-1', label: 'BSc CS', source: 'MASTER' }]);
  });

  it('passes the search string to getQualifications via fetchQuery', async () => {
    mockFetchQuery.mockResolvedValue(apiResponse([]));
    const { result } = renderHook(() => useQualificationsSearch());
    await result.current('mba');
    const { queryFn } = mockFetchQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetQualifications).toHaveBeenCalledWith('mba');
  });
});

// -- useTertiaryAwardingBodiesQuery ----------------------------------------

describe('useTertiaryAwardingBodiesQuery', () => {
  it('passes correct queryKey with search term', () => {
    useTertiaryAwardingBodiesQuery('moratuwa');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['tertiary-awarding-bodies', 'moratuwa'],
      })
    );
  });

  it('queryFn calls getTertiaryAwardingBodies with the search string', async () => {
    mockGetTertiaryAwardingBodies.mockResolvedValue(apiResponse([]));
    useTertiaryAwardingBodiesQuery('colombo');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetTertiaryAwardingBodies).toHaveBeenCalledWith('colombo');
  });
});

// -- useTertiaryAwardingBodiesSearch ---------------------------------------

describe('useTertiaryAwardingBodiesSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([
        { id: 'ab-1', label: 'University of Moratuwa', source: 'MASTER' },
      ])
    );
    const { result } = renderHook(() => useTertiaryAwardingBodiesSearch());
    const items = await result.current('moratuwa');
    expect(items).toEqual([
      { id: 'ab-1', label: 'University of Moratuwa', source: 'MASTER' },
    ]);
  });
});

// -- useTertiaryAwardingBodyLocationsQuery ---------------------------------

describe('useTertiaryAwardingBodyLocationsQuery', () => {
  it('passes correct queryKey with search term', () => {
    useTertiaryAwardingBodyLocationsQuery('colombo');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['tertiary-awarding-body-locations', 'colombo'],
      })
    );
  });

  it('queryFn calls getTertiaryAwardingBodyLocations with the search string', async () => {
    mockGetTertiaryAwardingBodyLocations.mockResolvedValue(apiResponse([]));
    useTertiaryAwardingBodyLocationsQuery('kandy');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetTertiaryAwardingBodyLocations).toHaveBeenCalledWith('kandy');
  });
});

// -- useTertiaryAwardingBodyLocationsSearch --------------------------------

describe('useTertiaryAwardingBodyLocationsSearch', () => {
  it('maps fetchQuery result to { id, label } options (no source field)', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([{ id: 'loc-1', label: 'Colombo', countryCode: 'LK' }])
    );
    const { result } = renderHook(() =>
      useTertiaryAwardingBodyLocationsSearch()
    );
    const items = await result.current('colombo');
    expect(items).toEqual([{ id: 'loc-1', label: 'Colombo' }]);
    expect(items[0]).not.toHaveProperty('source');
  });
});

// -- useLevelOfQualificationsQuery ----------------------------------------

describe('useLevelOfQualificationsQuery', () => {
  it('passes correct queryKey with search term', () => {
    useLevelOfQualificationsQuery('bachelor');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['level-of-qualifications', 'bachelor'],
      })
    );
  });

  it('queryFn calls getLevelOfQualifications with the search string', async () => {
    mockGetLevelOfQualifications.mockResolvedValue(apiResponse([]));
    useLevelOfQualificationsQuery('master');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetLevelOfQualifications).toHaveBeenCalledWith('master');
  });
});

// -- useLevelOfQualificationsSearch ---------------------------------------

describe('useLevelOfQualificationsSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([{ id: 'l-1', label: "Bachelor's", source: 'MASTER' }])
    );
    const { result } = renderHook(() => useLevelOfQualificationsSearch());
    const items = await result.current('bachelor');
    expect(items).toEqual([
      { id: 'l-1', label: "Bachelor's", source: 'MASTER' },
    ]);
  });
});

// -- useSpecializationsQuery ----------------------------------------------

describe('useSpecializationsQuery', () => {
  it('passes correct queryKey with search term', () => {
    useSpecializationsQuery('data');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['specializations', 'data'] })
    );
  });

  it('queryFn calls getSpecializations with the search string', async () => {
    mockGetSpecializations.mockResolvedValue(apiResponse([]));
    useSpecializationsQuery('ai');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetSpecializations).toHaveBeenCalledWith('ai');
  });
});

// -- useSpecializationsSearch ---------------------------------------------

describe('useSpecializationsSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([{ id: 's-1', label: 'Data Science', source: 'PENDING' }])
    );
    const { result } = renderHook(() => useSpecializationsSearch());
    const items = await result.current('data');
    expect(items).toEqual([
      { id: 's-1', label: 'Data Science', source: 'PENDING' },
    ]);
  });
});

// -- useStudyModesQuery ---------------------------------------------------

describe('useStudyModesQuery', () => {
  it('passes static queryKey (no search param — MASTER-only)', () => {
    useStudyModesQuery();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['study-modes'] })
    );
  });

  it('queryFn calls getStudyModes', async () => {
    mockGetStudyModes.mockResolvedValue(apiResponse([]));
    useStudyModesQuery();
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetStudyModes).toHaveBeenCalledTimes(1);
  });
});

// -- useStudyModesSearch --------------------------------------------------

describe('useStudyModesSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([{ id: 'sm-1', label: 'Online', source: 'MASTER' }])
    );
    const { result } = renderHook(() => useStudyModesSearch());
    const items = await result.current('online');
    expect(items).toEqual([{ id: 'sm-1', label: 'Online', source: 'MASTER' }]);
  });
});

// -- useStudyPatternsQuery ------------------------------------------------

describe('useStudyPatternsQuery', () => {
  it('passes static queryKey (no search param — MASTER-only)', () => {
    useStudyPatternsQuery();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['study-patterns'] })
    );
  });

  it('queryFn calls getStudyPatterns', async () => {
    mockGetStudyPatterns.mockResolvedValue(apiResponse([]));
    useStudyPatternsQuery();
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetStudyPatterns).toHaveBeenCalledTimes(1);
  });
});

// -- useStudyPatternsSearch -----------------------------------------------

describe('useStudyPatternsSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([{ id: 'sp-1', label: 'Full-Time', source: 'MASTER' }])
    );
    const { result } = renderHook(() => useStudyPatternsSearch());
    const items = await result.current('full');
    expect(items).toEqual([
      { id: 'sp-1', label: 'Full-Time', source: 'MASTER' },
    ]);
  });
});

// -- useDeliverySchedulesQuery --------------------------------------------

describe('useDeliverySchedulesQuery', () => {
  it('passes static queryKey (no search param — MASTER-only)', () => {
    useDeliverySchedulesQuery();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['delivery-schedules'] })
    );
  });

  it('queryFn calls getDeliverySchedules', async () => {
    mockGetDeliverySchedules.mockResolvedValue(apiResponse([]));
    useDeliverySchedulesQuery();
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetDeliverySchedules).toHaveBeenCalledTimes(1);
  });
});

// -- useDeliverySchedulesSearch -------------------------------------------

describe('useDeliverySchedulesSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([{ id: 'ds-1', label: 'Weekday', source: 'MASTER' }])
    );
    const { result } = renderHook(() => useDeliverySchedulesSearch());
    const items = await result.current('week');
    expect(items).toEqual([{ id: 'ds-1', label: 'Weekday', source: 'MASTER' }]);
  });
});

// -- useBatchesQuery ------------------------------------------------------

describe('useBatchesQuery', () => {
  it('passes correct queryKey with search term', () => {
    useBatchesQuery('2024');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['batches', '2024'] })
    );
  });

  it('queryFn calls getBatches with the search string', async () => {
    mockGetBatches.mockResolvedValue(apiResponse([]));
    useBatchesQuery('2023');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetBatches).toHaveBeenCalledWith('2023');
  });
});

// -- useBatchesSearch -----------------------------------------------------

describe('useBatchesSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([{ id: 'b-1', label: 'Batch 2024', source: 'MASTER' }])
    );
    const { result } = renderHook(() => useBatchesSearch());
    const items = await result.current('2024');
    expect(items).toEqual([
      { id: 'b-1', label: 'Batch 2024', source: 'MASTER' },
    ]);
  });
});

// -- useDepartmentsQuery --------------------------------------------------

describe('useDepartmentsQuery', () => {
  it('passes correct queryKey with search term', () => {
    useDepartmentsQuery('it');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['departments', 'it'] })
    );
  });

  it('queryFn calls getDepartments with the search string', async () => {
    mockGetDepartments.mockResolvedValue(apiResponse([]));
    useDepartmentsQuery('finance');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetDepartments).toHaveBeenCalledWith('finance');
  });
});

// -- useDepartmentsSearch -------------------------------------------------

describe('useDepartmentsSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([{ id: 'd-1', label: 'IT Department', source: 'MASTER' }])
    );
    const { result } = renderHook(() => useDepartmentsSearch());
    const items = await result.current('it');
    expect(items).toEqual([
      { id: 'd-1', label: 'IT Department', source: 'MASTER' },
    ]);
  });
});

// -- useFacultiesQuery ----------------------------------------------------

describe('useFacultiesQuery', () => {
  it('passes correct queryKey with search term', () => {
    useFacultiesQuery('engineering');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['faculties', 'engineering'] })
    );
  });

  it('queryFn calls getFaculties with the search string', async () => {
    mockGetFaculties.mockResolvedValue(apiResponse([]));
    useFacultiesQuery('arts');
    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await queryFn();
    expect(mockGetFaculties).toHaveBeenCalledWith('arts');
  });
});

// -- useFacultiesSearch ---------------------------------------------------

describe('useFacultiesSearch', () => {
  it('maps fetchQuery result to { id, label, source } options', async () => {
    mockFetchQuery.mockResolvedValue(
      apiResponse([
        { id: 'f-1', label: 'Faculty of Engineering', source: 'PENDING' },
      ])
    );
    const { result } = renderHook(() => useFacultiesSearch());
    const items = await result.current('engineering');
    expect(items).toEqual([
      { id: 'f-1', label: 'Faculty of Engineering', source: 'PENDING' },
    ]);
  });
});
