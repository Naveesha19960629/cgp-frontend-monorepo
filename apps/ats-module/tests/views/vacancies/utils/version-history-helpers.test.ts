import {
  getSingleScalar,
  isObjectArray,
  normalizeStatusKey,
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
