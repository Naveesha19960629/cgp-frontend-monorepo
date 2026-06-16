import { act, renderHook } from '@testing-library/react';

import { useSecondaryEducationForm } from '@/views/vacancies/hooks/use-secondary-education-form';

describe('useSecondaryEducationForm', () => {
  describe('buildDefaultValues — no initial data', () => {
    it('returns isEnabled=false with empty entry', () => {
      const { result } = renderHook(() => useSecondaryEducationForm());

      const values = result.current.getValues();
      expect(values.isEnabled).toBe(false);
      expect(values.dataTakenFromCandidate).toBe(false);
      expect(values.entries[0].schools).toEqual([]);
      expect(values.entries[0].examinations).toEqual([]);
      expect(values.entries[0].startDate).toBeUndefined();
      expect(values.entries[0].endDate).toBeUndefined();
    });
  });

  describe('buildDefaultValues — array shape (name field)', () => {
    it('uses name field as label when name is present (back-navigation shows real names)', () => {
      const { result } = renderHook(() =>
        useSecondaryEducationForm([
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                acceptsHomeSchooling: false,
                schools: [
                  { id: 'school-uuid', source: 'MASTER', name: 'Oxford High' },
                ],
                schoolLocations: [
                  { id: 'loc-uuid', source: 'MASTER', name: 'London' },
                ],
                examinations: [
                  { id: 'exam-uuid', source: 'MASTER', name: 'O-Levels' },
                ],
                secondaryAwardingBody: [
                  { id: 'ab-uuid', source: 'PENDING', name: 'AQA' },
                ],
                fieldsOfStudy: [
                  { id: 'fos-uuid', source: 'MASTER', name: 'Science' },
                ],
                grade: 'A',
                startDate: '2018-09-01T00:00:00.000Z',
                endDate: '2020-06-30T00:00:00.000Z',
                result: 'Passed',
              },
            ],
          },
        ])
      );

      const values = result.current.getValues();

      expect(values.isEnabled).toBe(true);
      expect(values.entries[0].schools[0]).toMatchObject({
        value: 'school-uuid',
        label: 'Oxford High',
      });
      expect(values.entries[0].schoolLocations[0]).toMatchObject({
        value: 'loc-uuid',
        label: 'London',
      });
      expect(values.entries[0].examinations[0]).toMatchObject({
        value: 'exam-uuid',
        label: 'O-Levels',
      });
      expect(values.entries[0].awardingBodies[0]).toMatchObject({
        value: 'ab-uuid',
        label: 'AQA',
      });
      expect(values.entries[0].fieldsOfStudy[0]).toMatchObject({
        value: 'fos-uuid',
        label: 'Science',
      });
      expect(values.entries[0].grade).toBe('A');
      expect(values.entries[0].startDate).toBe('2018-09-01T00:00:00.000Z');
      expect(values.entries[0].endDate).toBe('2020-06-30T00:00:00.000Z');
      expect(values.entries[0].result).toBe('Passed');
    });

    it('falls back to id as label when name is absent (data loaded from API without name)', () => {
      const { result } = renderHook(() =>
        useSecondaryEducationForm([
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                acceptsHomeSchooling: false,
                schools: [{ id: 'school-uuid', source: 'MASTER' }],
                schoolLocations: [{ id: 'loc-uuid', source: 'MASTER' }],
                examinations: [{ id: 'exam-uuid', source: 'MASTER' }],
                secondaryAwardingBody: [{ id: 'ab-uuid', source: 'PENDING' }],
                fieldsOfStudy: [{ id: 'fos-uuid', source: 'MASTER' }],
                grade: '',
                startDate: '',
                endDate: '',
                result: '',
              },
            ],
          },
        ])
      );

      const values = result.current.getValues();

      // Without name, label falls back to the id
      expect(values.entries[0].schools[0].label).toBe('school-uuid');
      expect(values.entries[0].examinations[0].label).toBe('exam-uuid');
      expect(values.entries[0].awardingBodies[0].label).toBe('ab-uuid');
    });

    it('returns empty entry when content array is empty', () => {
      const { result } = renderHook(() =>
        useSecondaryEducationForm([
          { isEnabled: true, dataTakenFromCandidate: false, content: [] },
        ])
      );

      const values = result.current.getValues();

      expect(values.entries[0].schools).toEqual([]);
      expect(values.entries[0].examinations).toEqual([]);
      expect(values.entries[0].startDate).toBeUndefined();
    });

    it('honours dataTakenFromCandidate flag', () => {
      const { result } = renderHook(() =>
        useSecondaryEducationForm([
          { isEnabled: true, dataTakenFromCandidate: true, content: [] },
        ])
      );

      expect(result.current.getValues('dataTakenFromCandidate')).toBe(true);
    });
  });

  describe('buildDefaultValues — API object shape (get-by-id response)', () => {
    it('accepts non-array object shape with secondaryEducation key (edit mode API response)', () => {
      const apiShape = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        secondaryEducation: [
          {
            acceptsHomeSchooling: true,
            grade: 'A',
            startDate: null,
            endDate: null,
            result: 'a',
            schools: [
              {
                source: 'MASTER',
                id: 'a1b2c3d4-0002-0002-0002-000000000003',
                label: 'Visakha Vidyalaya',
              },
            ],
            schoolLocations: [
              {
                source: 'MASTER',
                id: '6b6887cc-c7d2-400a-9bf4-f9b36ef64553',
                label: 'Aachen, North Rhine-Westphalia, Germany',
              },
            ],
            examinations: [
              {
                source: 'MASTER',
                id: 'a1b2c3d4-0003-0003-0003-000000000002',
                label: 'GCE A/L (Local)',
              },
            ],
            secondaryAwardingBody: [],
            fieldsOfStudy: [],
          },
        ],
      };

      const { result } = renderHook(() =>
        useSecondaryEducationForm(apiShape as never)
      );

      const values = result.current.getValues();

      expect(values.isEnabled).toBe(true);
      expect(values.dataTakenFromCandidate).toBe(false);
      expect(values.entries).toHaveLength(1);
      expect(values.entries[0].acceptsHomeSchooling).toBe(true);
      expect(values.entries[0].grade).toBe('A');
      expect(values.entries[0].result).toBe('a');
    });

    it('uses label field from API response when name is absent', () => {
      const apiShape = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        secondaryEducation: [
          {
            acceptsHomeSchooling: false,
            grade: '',
            startDate: null,
            endDate: null,
            result: '',
            schools: [
              {
                source: 'MASTER',
                id: 'school-id',
                label: 'Visakha Vidyalaya',
              },
            ],
            schoolLocations: [
              {
                source: 'MASTER',
                id: 'loc-id',
                label: 'Colombo, Western Province, Sri Lanka',
              },
            ],
            examinations: [
              {
                source: 'MASTER',
                id: 'exam-id',
                label: 'GCE A/L (Local)',
              },
            ],
            secondaryAwardingBody: [
              {
                source: 'MASTER',
                id: 'ab-id',
                label: 'Department of Examinations',
              },
            ],
            fieldsOfStudy: [
              { source: 'MASTER', id: 'fos-id', label: 'Mathematics' },
            ],
          },
        ],
      };

      const { result } = renderHook(() =>
        useSecondaryEducationForm(apiShape as never)
      );

      const values = result.current.getValues();

      expect(values.entries[0].schools[0]).toMatchObject({
        value: 'school-id',
        label: 'Visakha Vidyalaya',
      });
      expect(values.entries[0].schoolLocations[0]).toMatchObject({
        value: 'loc-id',
        label: 'Colombo, Western Province, Sri Lanka',
      });
      expect(values.entries[0].examinations[0]).toMatchObject({
        value: 'exam-id',
        label: 'GCE A/L (Local)',
      });
      expect(values.entries[0].awardingBodies[0]).toMatchObject({
        value: 'ab-id',
        label: 'Department of Examinations',
      });
      expect(values.entries[0].fieldsOfStudy[0]).toMatchObject({
        value: 'fos-id',
        label: 'Mathematics',
      });
    });

    it('coerces null startDate and endDate to undefined so Zod validation passes', () => {
      const apiShape = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        secondaryEducation: [
          {
            acceptsHomeSchooling: false,
            grade: 'A',
            startDate: null,
            endDate: null,
            result: 'Passed',
            schools: [],
            schoolLocations: [],
            examinations: [],
            secondaryAwardingBody: [],
            fieldsOfStudy: [],
          },
        ],
      };

      const { result } = renderHook(() =>
        useSecondaryEducationForm(apiShape as never)
      );

      const values = result.current.getValues();

      expect(values.entries[0].startDate).toBeUndefined();
      expect(values.entries[0].endDate).toBeUndefined();
    });

    it('coerces null grade and result to empty string', () => {
      const apiShape = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        secondaryEducation: [
          {
            acceptsHomeSchooling: false,
            grade: null,
            startDate: null,
            endDate: null,
            result: null,
            schools: [],
            schoolLocations: [],
            examinations: [],
            secondaryAwardingBody: [],
            fieldsOfStudy: [],
          },
        ],
      };

      const { result } = renderHook(() =>
        useSecondaryEducationForm(apiShape as never)
      );

      const values = result.current.getValues();

      expect(values.entries[0].grade).toBe('');
      expect(values.entries[0].result).toBe('');
    });

    it('returns empty entry when secondaryEducation array is empty', () => {
      const apiShape = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        secondaryEducation: [],
      };

      const { result } = renderHook(() =>
        useSecondaryEducationForm(apiShape as never)
      );

      const values = result.current.getValues();

      expect(values.entries).toHaveLength(1);
      expect(values.entries[0].schools).toEqual([]);
      expect(values.entries[0].startDate).toBeUndefined();
    });
  });

  describe('form rehydration — reset when initialData changes', () => {
    it('resets the form when initialData changes from undefined to populated (async edit load)', async () => {
      let initialData: Parameters<typeof useSecondaryEducationForm>[0] =
        undefined;

      const { result, rerender } = renderHook(() =>
        useSecondaryEducationForm(initialData)
      );

      // Initially empty
      expect(result.current.getValues('isEnabled')).toBe(false);

      // Simulate edit data arriving asynchronously
      initialData = [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          content: [
            {
              acceptsHomeSchooling: true,
              schools: [{ id: 's1', source: 'MASTER', name: 'Test School' }],
              schoolLocations: [],
              examinations: [],
              secondaryAwardingBody: [],
              fieldsOfStudy: [],
              grade: 'B',
              startDate: '2019-01-01',
              endDate: '2021-06-30',
              result: 'Merit',
            },
          ],
        },
      ];

      await act(async () => {
        rerender();
      });

      const values = result.current.getValues();
      expect(values.isEnabled).toBe(true);
      expect(values.entries[0].acceptsHomeSchooling).toBe(true);
      expect(values.entries[0].schools[0]).toMatchObject({
        value: 's1',
        label: 'Test School',
      });
      expect(values.entries[0].grade).toBe('B');
      expect(values.entries[0].result).toBe('Merit');
    });
  });
});
