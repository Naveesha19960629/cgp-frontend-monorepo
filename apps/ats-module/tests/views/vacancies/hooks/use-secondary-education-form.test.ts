import { renderHook } from '@testing-library/react';

import { useSecondaryEducationForm } from '@/views/vacancies/hooks/use-secondary-education-form';

describe('useSecondaryEducationForm', () => {
  describe('buildDefaultValues — no initial data', () => {
    it('returns isEnabled=false with empty entry', () => {
      const { result } = renderHook(() => useSecondaryEducationForm());

      const values = result.current.getValues();
      expect(values.isEnabled).toBe(false);
      expect(values.dataTakenFromCandidate).toBe(false);
      expect(values.entry.schools).toEqual([]);
      expect(values.entry.examinations).toEqual([]);
      expect(values.entry.startDate).toBeUndefined();
      expect(values.entry.endDate).toBeUndefined();
    });
  });

  describe('buildDefaultValues — restoring from saved data with name preserved', () => {
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
      expect(values.entry.schools[0]).toMatchObject({
        value: 'school-uuid',
        label: 'Oxford High',
      });
      expect(values.entry.schoolLocations[0]).toMatchObject({
        value: 'loc-uuid',
        label: 'London',
      });
      expect(values.entry.examinations[0]).toMatchObject({
        value: 'exam-uuid',
        label: 'O-Levels',
      });
      expect(values.entry.awardingBodies[0]).toMatchObject({
        value: 'ab-uuid',
        label: 'AQA',
      });
      expect(values.entry.fieldsOfStudy[0]).toMatchObject({
        value: 'fos-uuid',
        label: 'Science',
      });
      expect(values.entry.grade).toBe('A');
      expect(values.entry.startDate).toBe('2018-09-01T00:00:00.000Z');
      expect(values.entry.endDate).toBe('2020-06-30T00:00:00.000Z');
      expect(values.entry.result).toBe('Passed');
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
      expect(values.entry.schools[0].label).toBe('school-uuid');
      expect(values.entry.examinations[0].label).toBe('exam-uuid');
      expect(values.entry.awardingBodies[0].label).toBe('ab-uuid');
    });

    it('returns empty entry when content array is empty', () => {
      const { result } = renderHook(() =>
        useSecondaryEducationForm([
          { isEnabled: true, dataTakenFromCandidate: false, content: [] },
        ])
      );

      const values = result.current.getValues();

      expect(values.entry.schools).toEqual([]);
      expect(values.entry.examinations).toEqual([]);
      expect(values.entry.startDate).toBeUndefined();
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
});
