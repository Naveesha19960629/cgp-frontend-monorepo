import type { VacancyVersionHistoryChange } from '@/views/vacancies/types';
import {
  buildVacancyCreationSummary,
  getSingleScalar,
  isDataTakenFromCandidateChange,
  isObjectArray,
  normalizeStatusKey,
  parseBooleanFlag,
  resolveChangeVariant,
  resolveScalarChangeLabelKey,
  shouldRenderAsGrid,
  toGridItem,
  toGridItems,
} from '@/views/vacancies/utils/version-history-helpers';

describe('normalizeStatusKey', () => {
  it('maps the API "onhold" enum to the "on_hold" config key', () => {
    expect(normalizeStatusKey('ONHOLD')).toBe('on_hold');
  });

  it('lowercases everything else as-is', () => {
    expect(normalizeStatusKey('LIVE')).toBe('live');
  });
});

describe('parseBooleanFlag', () => {
  it('reads the literal string "true" (SECTION_ENABLED\'s real value shape) as true', () => {
    expect(parseBooleanFlag('true')).toBe(true);
  });

  it('reads "false" as false', () => {
    expect(parseBooleanFlag('false')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(parseBooleanFlag('True')).toBe(true);
    expect(parseBooleanFlag('FALSE')).toBe(false);
  });

  it('treats null/anything else as false', () => {
    expect(parseBooleanFlag(null)).toBe(false);
    expect(parseBooleanFlag('')).toBe(false);
    expect(parseBooleanFlag('yes')).toBe(false);
  });
});

describe('buildVacancyCreationSummary', () => {
  const titleChange: VacancyVersionHistoryChange = {
    changeType: 'VACANCY_CREATED',
    sectionName: 'Vacancy',
    fieldName: 'Title',
    oldValue: null,
    newValue: ['Senior Java Developer'],
  };
  const statusChange: VacancyVersionHistoryChange = {
    changeType: 'VACANCY_CREATED',
    sectionName: 'Vacancy',
    fieldName: 'Status',
    oldValue: null,
    newValue: ['DRAFT'],
  };
  const scheduleChange: VacancyVersionHistoryChange = {
    changeType: 'VACANCY_CREATED',
    sectionName: 'Vacancy',
    fieldName: 'Schedule Date',
    oldValue: null,
    newValue: ['2026-10-13T05:00:00'],
  };
  const expirationChange: VacancyVersionHistoryChange = {
    changeType: 'VACANCY_CREATED',
    sectionName: 'Vacancy',
    fieldName: 'Expiration Date',
    oldValue: null,
    newValue: ['2026-11-13T05:00:00'],
  };

  it('groups Title + Status + Schedule Date + Expiration Date into one summary (Figma node 4229:230488, "Scheduled for publishing")', () => {
    expect(
      buildVacancyCreationSummary([
        titleChange,
        statusChange,
        scheduleChange,
        expirationChange,
      ])
    ).toEqual({
      title: 'Senior Java Developer',
      status: 'DRAFT',
      scheduleDate: '2026-10-13T05:00:00',
      expirationDate: '2026-11-13T05:00:00',
    });
  });

  it('groups just Title + Status with null dates when no schedule/expiration entry exists (Figma node 4229:230451, "Saved as Draft")', () => {
    expect(buildVacancyCreationSummary([titleChange, statusChange])).toEqual({
      title: 'Senior Java Developer',
      status: 'DRAFT',
      scheduleDate: null,
      expirationDate: null,
    });
  });

  it('returns null when only Title is present — every existing sample/test fixture bar the real one', () => {
    expect(buildVacancyCreationSummary([titleChange])).toBeNull();
  });

  it('returns null when only Status is present', () => {
    expect(buildVacancyCreationSummary([statusChange])).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(buildVacancyCreationSummary([])).toBeNull();
  });
});

describe('getSingleScalar', () => {
  it('returns null for null/empty input', () => {
    expect(getSingleScalar(null)).toBeNull();
    expect(getSingleScalar([])).toBeNull();
  });

  it('returns the first element stringified', () => {
    expect(getSingleScalar(['LIVE'])).toBe('LIVE');
  });

  it('returns null when the first element is an object', () => {
    expect(getSingleScalar([{ school: 'Royal College' }])).toBeNull();
  });
});

describe('isObjectArray', () => {
  it('is true only for a non-empty array of objects', () => {
    expect(isObjectArray([{ a: 1 }])).toBe(true);
    expect(isObjectArray(['a'])).toBe(false);
    expect(isObjectArray([])).toBe(false);
    expect(isObjectArray(null)).toBe(false);
  });
});

describe('shouldRenderAsGrid', () => {
  it('is true for any object array, even a single-item one', () => {
    expect(shouldRenderAsGrid([{ school: 'Royal College' }])).toBe(true);
  });

  it('is true for a plain array with more than one item', () => {
    expect(shouldRenderAsGrid(['Animal Welfare', 'Arts and Culture'])).toBe(
      true
    );
  });

  it('is false for a single-item plain array', () => {
    expect(shouldRenderAsGrid(['LIVE'])).toBe(false);
  });
});

describe('toGridItem', () => {
  it('takes the first two truthy entries as title/subtitle', () => {
    expect(
      toGridItem({
        school: 'Royal College',
        schoolLocation: 'Colombo, Sri Lanka',
      })
    ).toEqual({ title: 'Royal College', subtitle: 'Colombo, Sri Lanka' });
  });

  it('skips null/undefined/empty-string entries', () => {
    expect(
      toGridItem({ school: 'Royal College', schoolLocation: null })
    ).toEqual({ title: 'Royal College', subtitle: undefined });
  });
});

describe('toGridItems', () => {
  it('maps an object array through toGridItem', () => {
    expect(toGridItems([{ school: 'Royal College' }])).toEqual([
      { title: 'Royal College', subtitle: undefined },
    ]);
  });

  it('wraps each plain-array value as a title-only item', () => {
    expect(toGridItems(['Animal Welfare', 'Arts and Culture'])).toEqual([
      { title: 'Animal Welfare' },
      { title: 'Arts and Culture' },
    ]);
  });
});

describe('resolveChangeVariant', () => {
  it('reads FIELD_VALUE_ADDED and VACANCY_CREATED as "added"', () => {
    expect(
      resolveChangeVariant({
        changeType: 'FIELD_VALUE_ADDED',
        oldValue: null,
        newValue: ['x'],
      })
    ).toBe('added');
    expect(
      resolveChangeVariant({
        changeType: 'VACANCY_CREATED',
        oldValue: null,
        newValue: ['x'],
      })
    ).toBe('added');
  });

  it('reads FIELD_VALUE_REMOVED as "removed"', () => {
    expect(
      resolveChangeVariant({
        changeType: 'FIELD_VALUE_REMOVED',
        oldValue: ['x'],
        newValue: null,
      })
    ).toBe('removed');
  });

  it('reads a plain FIELD_VALUE_UPDATED (both values present) as "updated"', () => {
    expect(
      resolveChangeVariant({
        changeType: 'FIELD_VALUE_UPDATED',
        oldValue: ['AAA'],
        newValue: ['XXX'],
      })
    ).toBe('updated');
  });

  it('reads FIELD_VALUE_UPDATED with newValue: null as "removed" — a real response shape (e.g. "Position/Role Held" cleared) the API sends instead of FIELD_VALUE_REMOVED', () => {
    expect(
      resolveChangeVariant({
        changeType: 'FIELD_VALUE_UPDATED',
        oldValue: ['Role A'],
        newValue: null,
      })
    ).toBe('removed');
  });

  it('does not treat FIELD_VALUE_UPDATED as removed when oldValue is also null (nothing actually went away)', () => {
    expect(
      resolveChangeVariant({
        changeType: 'FIELD_VALUE_UPDATED',
        oldValue: null,
        newValue: null,
      })
    ).toBe('updated');
  });
});

describe('resolveScalarChangeLabelKey', () => {
  it('matches the vacancy-level Title/Schedule/Expiration fields under "Vacancy"', () => {
    expect(
      resolveScalarChangeLabelKey({
        sectionName: 'Vacancy',
        fieldName: 'Title',
      })
    ).toBe('titleChanged');
    expect(
      resolveScalarChangeLabelKey({
        sectionName: 'Vacancy',
        fieldName: 'Schedule Date',
      })
    ).toBe('scheduleDateChanged');
  });

  it('also matches the same fields under "Schedule" — a real response shows post-creation schedule/expiration updates use this section name, not "Vacancy"', () => {
    expect(
      resolveScalarChangeLabelKey({
        sectionName: 'Schedule',
        fieldName: 'Scheduled Publish Date',
      })
    ).toBe('scheduleDateChanged');
    expect(
      resolveScalarChangeLabelKey({
        sectionName: 'Schedule',
        fieldName: 'Expiration Date',
      })
    ).toBe('expirationDateChanged');
  });

  it('returns null for an unrelated section', () => {
    expect(
      resolveScalarChangeLabelKey({
        sectionName: 'Sports',
        fieldName: 'Start Date',
      })
    ).toBeNull();
  });
});

describe('isDataTakenFromCandidateChange', () => {
  const base: VacancyVersionHistoryChange = {
    changeType: 'FIELD_VALUE_UPDATED',
    sectionName: 'Sports',
    fieldName: 'Data Taken From Candidate',
    oldValue: ['false'],
    newValue: ['true'],
  };

  it('matches the real API shape (FIELD_VALUE_UPDATED, literal fieldName)', () => {
    expect(isDataTakenFromCandidateChange(base)).toBe(true);
  });

  it('is case-insensitive on the field name', () => {
    expect(
      isDataTakenFromCandidateChange({
        ...base,
        fieldName: 'data taken from candidate',
      })
    ).toBe(true);
  });

  it('does not match a different changeType even with the same field name', () => {
    expect(
      isDataTakenFromCandidateChange({
        ...base,
        changeType: 'FIELD_VALUE_ADDED',
      })
    ).toBe(false);
  });

  it('does not match an unrelated field name', () => {
    expect(
      isDataTakenFromCandidateChange({
        ...base,
        fieldName: 'Position/Role Held',
      })
    ).toBe(false);
  });
});
