import { toTertiaryEducationPayload } from '@/views/vacancies/utils/tertiary-education-helpers';

const EMPTY_ENTRY = {
  qualificationName: [],
  tertiaryAwardingBody: [],
  tertiaryAwardingBodyLocations: [],
  levelOfQualification: [],
  specialization: [],
  studyMode: [],
  studyPattern: [],
  deliverySchedule: [],
  batch: [],
  department: [],
  faculty: [],
  grade: '',
};

describe('toTertiaryEducationPayload', () => {
  it('returns disabled payload when isEnabled is false', () => {
    const result = toTertiaryEducationPayload({
      isEnabled: false,
      dataTakenFromCandidate: false,
      entry: EMPTY_ENTRY,
    });

    expect(result).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('returns dataTakenFromCandidate payload when flag is true', () => {
    const result = toTertiaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: true,
      entry: EMPTY_ENTRY,
    });

    expect(result).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('preserves item name/label in each ref so back-navigation shows names not UUIDs', () => {
    const result = toTertiaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        qualificationName: [
          { id: 'q-uuid', label: 'BSc Computer Science', source: 'MASTER' },
        ],
        tertiaryAwardingBody: [
          { id: 'ab-uuid', label: 'University of Moratuwa', source: 'MASTER' },
        ],
        levelOfQualification: [
          { id: 'l-uuid', label: "Bachelor's", source: 'MASTER' },
        ],
        specialization: [
          { id: 's-uuid', label: 'Data Science', source: 'PENDING' },
        ],
        tertiaryAwardingBodyLocations: [
          { id: 'loc-uuid', label: 'Colombo, Western Province, Sri Lanka' },
        ],
        batch: [{ id: 'b-uuid', label: 'Batch 2020', source: 'MASTER' }],
        department: [
          { id: 'd-uuid', label: 'IT Department', source: 'MASTER' },
        ],
        faculty: [
          { id: 'f-uuid', label: 'Faculty of Engineering', source: 'PENDING' },
        ],
      },
    });

    const content = result[0].content[0];

    expect(content.qualificationName[0]).toEqual({
      id: 'q-uuid',
      source: 'MASTER',
      name: 'BSc Computer Science',
    });
    expect(content.tertiaryAwardingBody[0]).toEqual({
      id: 'ab-uuid',
      source: 'MASTER',
      name: 'University of Moratuwa',
    });
    expect(content.levelOfQualification[0]).toEqual({
      id: 'l-uuid',
      source: 'MASTER',
      name: "Bachelor's",
    });
    expect(content.specialization[0]).toEqual({
      id: 's-uuid',
      source: 'PENDING',
      name: 'Data Science',
    });
    expect(content.tertiaryAwardingBodyLocations[0]).toEqual({
      id: 'loc-uuid',
      source: 'MASTER',
      name: 'Colombo, Western Province, Sri Lanka',
    });
    expect(content.batch[0]).toEqual({
      id: 'b-uuid',
      source: 'MASTER',
      name: 'Batch 2020',
    });
    expect(content.department[0]).toEqual({
      id: 'd-uuid',
      source: 'MASTER',
      name: 'IT Department',
    });
    expect(content.faculty[0]).toEqual({
      id: 'f-uuid',
      source: 'PENDING',
      name: 'Faculty of Engineering',
    });
  });

  it('filters out items that have no id (pending creatable items not yet resolved)', () => {
    const result = toTertiaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        qualificationName: [
          { id: 'q-uuid', label: 'MBA', source: 'MASTER' },
          { id: undefined, label: 'Custom Qualification', source: 'PENDING' },
        ],
      },
    });

    expect(result[0].content[0].qualificationName).toHaveLength(1);
    expect(result[0].content[0].qualificationName[0].id).toBe('q-uuid');
  });

  it('preserves grade string', () => {
    const result = toTertiaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: { ...EMPTY_ENTRY, grade: 'GPA 3.8' },
    });

    expect(result[0].content[0].grade).toBe('GPA 3.8');
  });

  it('maps MASTER-only fields (studyMode, studyPattern, deliverySchedule) correctly', () => {
    const result = toTertiaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entry: {
        ...EMPTY_ENTRY,
        studyMode: [{ id: 'sm-uuid', label: 'Online', source: 'MASTER' }],
        studyPattern: [{ id: 'sp-uuid', label: 'Full-Time', source: 'MASTER' }],
        deliverySchedule: [
          { id: 'ds-uuid', label: 'Weekday', source: 'MASTER' },
        ],
      },
    });

    const content = result[0].content[0];
    expect(content.studyMode[0]).toEqual({
      id: 'sm-uuid',
      source: 'MASTER',
      name: 'Online',
    });
    expect(content.studyPattern[0]).toEqual({
      id: 'sp-uuid',
      source: 'MASTER',
      name: 'Full-Time',
    });
    expect(content.deliverySchedule[0]).toEqual({
      id: 'ds-uuid',
      source: 'MASTER',
      name: 'Weekday',
    });
  });
});
