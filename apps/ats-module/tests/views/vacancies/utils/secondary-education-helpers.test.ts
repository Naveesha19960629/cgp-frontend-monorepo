import {
  formatDate,
  toSecondaryEducationPayload,
} from '@/views/vacancies/utils/secondary-education-helpers';

const EMPTY_ENTRY = {
  acceptsHomeSchooling: false,
  schools: [],
  schoolLocations: [],
  examinations: [],
  awardingBodies: [],
  fieldsOfStudy: [],
  grade: '',
  startDate: undefined,
  endDate: undefined,
  result: '',
};

describe('toSecondaryEducationPayload', () => {
  it('returns disabled payload when isEnabled is false', () => {
    const result = toSecondaryEducationPayload({
      isEnabled: false,
      dataTakenFromCandidate: false,
      entries: [EMPTY_ENTRY],
    });

    expect(result).toEqual([
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ]);
  });

  it('returns dataTakenFromCandidate payload when flag is true', () => {
    const result = toSecondaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: true,
      entries: [EMPTY_ENTRY],
    });

    expect(result).toEqual([
      { isEnabled: true, dataTakenFromCandidate: true, content: [] },
    ]);
  });

  it('preserves item name/label in each ref so back-navigation shows names not UUIDs', () => {
    const result = toSecondaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entries: [
        {
          ...EMPTY_ENTRY,
          schools: [
            { value: 'school-uuid', label: 'Oxford High', source: 'MASTER' },
          ],
          examinations: [
            { value: 'exam-uuid', label: 'O-Levels', source: 'MASTER' },
          ],
          awardingBodies: [
            { value: 'ab-uuid', label: 'AQA', source: 'PENDING' },
          ],
          fieldsOfStudy: [
            { value: 'fos-uuid', label: 'Science', source: 'MASTER' },
          ],
          schoolLocations: [{ value: 'loc-uuid', label: 'London' }],
        },
      ],
    });

    const content = result[0].content[0];

    expect(content.schools[0]).toEqual({
      id: 'school-uuid',
      source: 'MASTER',
      name: 'Oxford High',
    });
    expect(content.examinations[0]).toEqual({
      id: 'exam-uuid',
      source: 'MASTER',
      name: 'O-Levels',
    });
    expect(content.secondaryAwardingBody[0]).toEqual({
      id: 'ab-uuid',
      source: 'PENDING',
      name: 'AQA',
    });
    expect(content.fieldsOfStudy[0]).toEqual({
      id: 'fos-uuid',
      source: 'MASTER',
      name: 'Science',
    });
    expect(content.schoolLocations[0]).toEqual({
      id: 'loc-uuid',
      source: 'MASTER',
      name: 'London',
    });
  });

  it('filters out items whose value equals their label (pending creatable items not yet resolved)', () => {
    const result = toSecondaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entries: [
        {
          ...EMPTY_ENTRY,
          examinations: [
            { value: 'exam-uuid', label: 'A-Levels', source: 'MASTER' },
            { value: 'Custom Exam', label: 'Custom Exam', source: 'PENDING' },
          ],
        },
      ],
    });

    expect(result[0].content[0].examinations).toHaveLength(1);
    expect(result[0].content[0].examinations[0].id).toBe('exam-uuid');
  });

  it('maps optional dates to empty string when undefined', () => {
    const result = toSecondaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entries: [
        {
          ...EMPTY_ENTRY,
          grade: 'A',
          startDate: undefined,
          endDate: undefined,
        },
      ],
    });

    expect(result[0].content[0].startDate).toBe('');
    expect(result[0].content[0].endDate).toBe('');
  });

  it('passes through dates when provided', () => {
    const result = toSecondaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entries: [
        {
          ...EMPTY_ENTRY,
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: '2022-06-30T00:00:00.000Z',
        },
      ],
    });

    expect(result[0].content[0].startDate).toBe('2020-01-01');
    expect(result[0].content[0].endDate).toBe('2022-06-30');
  });

  it('preserves acceptsHomeSchooling flag', () => {
    const result = toSecondaryEducationPayload({
      isEnabled: true,
      dataTakenFromCandidate: false,
      entries: [{ ...EMPTY_ENTRY, acceptsHomeSchooling: true }],
    });

    expect(result[0].content[0].acceptsHomeSchooling).toBe(true);
  });
});

describe('formatDate', () => {
  it('returns empty string when value is undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns empty string when value is an empty string', () => {
    expect(formatDate('')).toBe('');
  });

  it('formats a date-only string (yyyy-MM-dd) correctly — timezone safe', () => {
    expect(formatDate('2020-01-01')).toBe('1st Jan 2020');
  });

  it('formats a mid-month date-only string correctly', () => {
    expect(formatDate('2022-06-15')).toBe('15th Jun 2022');
  });

  it('formats an ISO date string using the display format', () => {
    expect(formatDate('2020-01-01T00:00:00.000Z')).toBe('1st Jan 2020');
  });

  it('formats a mid-month date correctly', () => {
    expect(formatDate('2022-06-15T00:00:00.000Z')).toBe('15th Jun 2022');
  });
});
