import { renderHook } from '@testing-library/react';

import { useTertiaryEducationForm } from '@/views/vacancies/hooks/use-tertiary-education-form';

describe('useTertiaryEducationForm', () => {
  describe('buildDefaultValues — no initial data', () => {
    it('returns isEnabled=false with empty entry', () => {
      const { result } = renderHook(() => useTertiaryEducationForm());

      const values = result.current.getValues();
      expect(values.isEnabled).toBe(false);
      expect(values.dataTakenFromCandidate).toBe(false);
      expect(values.entry.qualificationName).toEqual([]);
      expect(values.entry.tertiaryAwardingBody).toEqual([]);
      expect(values.entry.tertiaryAwardingBodyLocations).toEqual([]);
      expect(values.entry.levelOfQualification).toEqual([]);
      expect(values.entry.specialization).toEqual([]);
      expect(values.entry.studyMode).toEqual([]);
      expect(values.entry.studyPattern).toEqual([]);
      expect(values.entry.deliverySchedule).toEqual([]);
      expect(values.entry.batch).toEqual([]);
      expect(values.entry.department).toEqual([]);
      expect(values.entry.faculty).toEqual([]);
      expect(values.entry.grade).toBe('');
    });
  });

  describe('buildDefaultValues — restoring from saved data with name preserved', () => {
    it('uses name field as label when name is present (back-navigation shows real names)', () => {
      const { result } = renderHook(() =>
        useTertiaryEducationForm([
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                qualificationName: [
                  {
                    id: 'q-uuid',
                    source: 'MASTER',
                    name: 'BSc Computer Science',
                  },
                ],
                tertiaryAwardingBody: [
                  {
                    id: 'ab-uuid',
                    source: 'MASTER',
                    name: 'University of Moratuwa',
                  },
                ],
                tertiaryAwardingBodyLocations: [
                  { id: 'loc-uuid', source: 'MASTER', name: 'Colombo' },
                ],
                levelOfQualification: [
                  { id: 'l-uuid', source: 'MASTER', name: "Bachelor's" },
                ],
                specialization: [
                  { id: 's-uuid', source: 'PENDING', name: 'Data Science' },
                ],
                studyMode: [
                  { id: 'sm-uuid', source: 'MASTER', name: 'Online' },
                ],
                studyPattern: [
                  { id: 'sp-uuid', source: 'MASTER', name: 'Full-Time' },
                ],
                deliverySchedule: [
                  { id: 'ds-uuid', source: 'MASTER', name: 'Weekday' },
                ],
                batch: [{ id: 'b-uuid', source: 'MASTER', name: 'Batch 2020' }],
                department: [
                  { id: 'd-uuid', source: 'MASTER', name: 'IT Department' },
                ],
                faculty: [
                  {
                    id: 'f-uuid',
                    source: 'PENDING',
                    name: 'Faculty of Engineering',
                  },
                ],
                grade: 'GPA 3.8',
              },
            ],
          },
        ])
      );

      const values = result.current.getValues();

      expect(values.isEnabled).toBe(true);
      expect(values.entry.qualificationName[0]).toMatchObject({
        value: 'q-uuid',
        label: 'BSc Computer Science',
      });
      expect(values.entry.tertiaryAwardingBody[0]).toMatchObject({
        value: 'ab-uuid',
        label: 'University of Moratuwa',
      });
      expect(values.entry.tertiaryAwardingBodyLocations[0]).toMatchObject({
        value: 'loc-uuid',
        label: 'Colombo',
      });
      expect(values.entry.levelOfQualification[0]).toMatchObject({
        value: 'l-uuid',
        label: "Bachelor's",
      });
      expect(values.entry.specialization[0]).toMatchObject({
        value: 's-uuid',
        label: 'Data Science',
      });
      expect(values.entry.studyMode[0]).toMatchObject({
        value: 'sm-uuid',
        label: 'Online',
      });
      expect(values.entry.studyPattern[0]).toMatchObject({
        value: 'sp-uuid',
        label: 'Full-Time',
      });
      expect(values.entry.deliverySchedule[0]).toMatchObject({
        value: 'ds-uuid',
        label: 'Weekday',
      });
      expect(values.entry.batch[0]).toMatchObject({
        value: 'b-uuid',
        label: 'Batch 2020',
      });
      expect(values.entry.department[0]).toMatchObject({
        value: 'd-uuid',
        label: 'IT Department',
      });
      expect(values.entry.faculty[0]).toMatchObject({
        value: 'f-uuid',
        label: 'Faculty of Engineering',
      });
      expect(values.entry.grade).toBe('GPA 3.8');
    });

    it('falls back to id as label when name is absent (data loaded from API without name)', () => {
      const { result } = renderHook(() =>
        useTertiaryEducationForm([
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              {
                qualificationName: [{ id: 'q-uuid', source: 'MASTER' }],
                tertiaryAwardingBody: [{ id: 'ab-uuid', source: 'MASTER' }],
                tertiaryAwardingBodyLocations: [
                  { id: 'loc-uuid', source: 'MASTER' },
                ],
                levelOfQualification: [{ id: 'l-uuid', source: 'MASTER' }],
                specialization: [{ id: 's-uuid', source: 'PENDING' }],
                studyMode: [{ id: 'sm-uuid', source: 'MASTER' }],
                studyPattern: [{ id: 'sp-uuid', source: 'MASTER' }],
                deliverySchedule: [{ id: 'ds-uuid', source: 'MASTER' }],
                batch: [{ id: 'b-uuid', source: 'MASTER' }],
                department: [{ id: 'd-uuid', source: 'MASTER' }],
                faculty: [{ id: 'f-uuid', source: 'PENDING' }],
                grade: '',
              },
            ],
          },
        ])
      );

      const values = result.current.getValues();

      expect(values.entry.qualificationName[0].label).toBe('q-uuid');
      expect(values.entry.tertiaryAwardingBody[0].label).toBe('ab-uuid');
      expect(values.entry.levelOfQualification[0].label).toBe('l-uuid');
      expect(values.entry.specialization[0].label).toBe('s-uuid');
      expect(values.entry.batch[0].label).toBe('b-uuid');
    });

    it('returns empty entry when content array is empty', () => {
      const { result } = renderHook(() =>
        useTertiaryEducationForm([
          { isEnabled: true, dataTakenFromCandidate: false, content: [] },
        ])
      );

      const values = result.current.getValues();

      expect(values.isEnabled).toBe(true);
      expect(values.entry.qualificationName).toEqual([]);
      expect(values.entry.grade).toBe('');
    });

    it('sets dataTakenFromCandidate correctly', () => {
      const { result } = renderHook(() =>
        useTertiaryEducationForm([
          { isEnabled: true, dataTakenFromCandidate: true, content: [] },
        ])
      );

      const values = result.current.getValues();
      expect(values.dataTakenFromCandidate).toBe(true);
    });
  });
});
