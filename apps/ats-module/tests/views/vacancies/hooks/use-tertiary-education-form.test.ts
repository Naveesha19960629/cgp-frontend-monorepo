import { renderHook } from '@testing-library/react';

import { useTertiaryEducationForm } from '@/views/vacancies/hooks/use-tertiary-education-form';
import type { TertiaryEducation } from '@/views/vacancies/types';

describe('useTertiaryEducationForm', () => {
  describe('buildDefaultValues — no initial data', () => {
    it('returns isEnabled=false with empty entry', () => {
      const { result } = renderHook(() => useTertiaryEducationForm());

      const values = result.current.getValues();
      expect(values.isEnabled).toBe(false);
      expect(values.dataTakenFromCandidate).toBe(false);
      expect(values.entries[0].qualificationName).toEqual([]);
      expect(values.entries[0].tertiaryAwardingBody).toEqual([]);
      expect(values.entries[0].tertiaryAwardingBodyLocations).toEqual([]);
      expect(values.entries[0].levelOfQualification).toEqual([]);
      expect(values.entries[0].specialization).toEqual([]);
      expect(values.entries[0].studyMode).toEqual([]);
      expect(values.entries[0].studyPattern).toEqual([]);
      expect(values.entries[0].deliverySchedule).toEqual([]);
      expect(values.entries[0].batch).toEqual([]);
      expect(values.entries[0].department).toEqual([]);
      expect(values.entries[0].faculty).toEqual([]);
      expect(values.entries[0].grade).toBe('');
    });
  });

  describe('buildDefaultValues — restoring from saved data with name preserved', () => {
    it('uses name field as label when name is present (back-navigation shows real names)', () => {
      const initialData: TertiaryEducation[] = [
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
              studyMode: [{ id: 'sm-uuid', source: 'MASTER', name: 'Online' }],
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
      ];
      const { result } = renderHook(() =>
        useTertiaryEducationForm(initialData)
      );

      const values = result.current.getValues();

      expect(values.isEnabled).toBe(true);
      expect(values.entries[0].qualificationName[0]).toMatchObject({
        value: 'q-uuid',
        label: 'BSc Computer Science',
      });
      expect(values.entries[0].tertiaryAwardingBody[0]).toMatchObject({
        value: 'ab-uuid',
        label: 'University of Moratuwa',
      });
      expect(values.entries[0].tertiaryAwardingBodyLocations[0]).toMatchObject({
        value: 'loc-uuid',
        label: 'Colombo',
      });
      expect(values.entries[0].levelOfQualification[0]).toMatchObject({
        value: 'l-uuid',
        label: "Bachelor's",
      });
      expect(values.entries[0].specialization[0]).toMatchObject({
        value: 's-uuid',
        label: 'Data Science',
      });
      expect(values.entries[0].studyMode[0]).toMatchObject({
        value: 'sm-uuid',
        label: 'Online',
      });
      expect(values.entries[0].studyPattern[0]).toMatchObject({
        value: 'sp-uuid',
        label: 'Full-Time',
      });
      expect(values.entries[0].deliverySchedule[0]).toMatchObject({
        value: 'ds-uuid',
        label: 'Weekday',
      });
      expect(values.entries[0].batch[0]).toMatchObject({
        value: 'b-uuid',
        label: 'Batch 2020',
      });
      expect(values.entries[0].department[0]).toMatchObject({
        value: 'd-uuid',
        label: 'IT Department',
      });
      expect(values.entries[0].faculty[0]).toMatchObject({
        value: 'f-uuid',
        label: 'Faculty of Engineering',
      });
      expect(values.entries[0].grade).toBe('GPA 3.8');
    });

    it('falls back to id as label when name is absent (data loaded from API without name)', () => {
      const initialData: TertiaryEducation[] = [
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
      ];
      const { result } = renderHook(() =>
        useTertiaryEducationForm(initialData)
      );

      const values = result.current.getValues();

      expect(values.entries[0].qualificationName[0].label).toBe('q-uuid');
      expect(values.entries[0].tertiaryAwardingBody[0].label).toBe('ab-uuid');
      expect(values.entries[0].levelOfQualification[0].label).toBe('l-uuid');
      expect(values.entries[0].specialization[0].label).toBe('s-uuid');
      expect(values.entries[0].batch[0].label).toBe('b-uuid');
    });

    it('returns empty entry when content array is empty', () => {
      const initialData: TertiaryEducation[] = [
        { isEnabled: true, dataTakenFromCandidate: false, content: [] },
      ];
      const { result } = renderHook(() =>
        useTertiaryEducationForm(initialData)
      );

      const values = result.current.getValues();

      expect(values.isEnabled).toBe(true);
      expect(values.entries[0].qualificationName).toEqual([]);
      expect(values.entries[0].grade).toBe('');
    });

    it('sets dataTakenFromCandidate correctly', () => {
      const initialData: TertiaryEducation[] = [
        { isEnabled: true, dataTakenFromCandidate: true, content: [] },
      ];
      const { result } = renderHook(() =>
        useTertiaryEducationForm(initialData)
      );

      const values = result.current.getValues();
      expect(values.dataTakenFromCandidate).toBe(true);
    });
  });
});
