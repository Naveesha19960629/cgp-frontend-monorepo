import { describe, expect, it } from 'vitest';

import type { ScheduleVacancy } from '@/views/vacancies/types';
import {
  hasPublishDateChanged,
  hasScheduleChanged,
} from '@/views/vacancies/utils/vacancy-schedule-comparison';

const SAVED: ScheduleVacancy = {
  schedulePublishAt: '2099-12-20T10:00:00 AM',
  expirationAt: '2099-12-30T11:59:59 PM',
};

describe('hasScheduleChanged', () => {
  it('returns false when the current values match the saved schedule exactly', () => {
    expect(
      hasScheduleChanged(SAVED, {
        schedulePublishDate: '2099-12-20',
        schedulePublishTime: '10:00:00 AM',
        expirationDate: '2099-12-30',
        expirationTime: '11:59:59 PM',
      })
    ).toBe(false);
  });

  it('returns false when the saved value is 24-hour ISO and the form value is the equivalent 12-hour time', () => {
    expect(
      hasScheduleChanged(
        {
          schedulePublishAt: '2099-12-20T10:00:00',
          expirationAt: '2099-12-30T23:59:59',
        },
        {
          schedulePublishDate: '2099-12-20',
          schedulePublishTime: '10:00:00 AM',
          expirationDate: '2099-12-30',
          expirationTime: '11:59:59 PM',
        }
      )
    ).toBe(false);
  });

  it('returns true when the publish time differs', () => {
    expect(
      hasScheduleChanged(SAVED, {
        schedulePublishDate: '2099-12-20',
        schedulePublishTime: '11:00:00 AM',
        expirationDate: '2099-12-30',
        expirationTime: '11:59:59 PM',
      })
    ).toBe(true);
  });

  it('returns true when the expiration date differs', () => {
    expect(
      hasScheduleChanged(SAVED, {
        schedulePublishDate: '2099-12-20',
        schedulePublishTime: '10:00:00 AM',
        expirationDate: '2099-12-31',
        expirationTime: '11:59:59 PM',
      })
    ).toBe(true);
  });

  it('returns true when there is no saved schedule yet', () => {
    expect(
      hasScheduleChanged(undefined, {
        schedulePublishDate: '2099-12-20',
        schedulePublishTime: '10:00:00 AM',
        expirationDate: '2099-12-30',
        expirationTime: '11:59:59 PM',
      })
    ).toBe(true);
  });

  it('returns true when any current field is empty', () => {
    expect(
      hasScheduleChanged(SAVED, {
        schedulePublishDate: '',
        schedulePublishTime: '',
        expirationDate: '',
        expirationTime: '',
      })
    ).toBe(true);
  });

  it('returns true when a saved/current value cannot be parsed into a valid date', () => {
    expect(
      hasScheduleChanged(
        { schedulePublishAt: 'not-a-date', expirationAt: 'also-not-a-date' },
        {
          schedulePublishDate: '2099-12-20',
          schedulePublishTime: '10:00:00 AM',
          expirationDate: '2099-12-30',
          expirationTime: '11:59:59 PM',
        }
      )
    ).toBe(true);
  });
});

describe('hasPublishDateChanged', () => {
  it('returns false when the publish date/time is unchanged', () => {
    expect(
      hasPublishDateChanged(SAVED, {
        schedulePublishDate: '2099-12-20',
        schedulePublishTime: '10:00:00 AM',
      })
    ).toBe(false);
  });

  it('returns true when the publish date changes', () => {
    expect(
      hasPublishDateChanged(SAVED, {
        schedulePublishDate: '2099-11-01',
        schedulePublishTime: '10:00:00 AM',
      })
    ).toBe(true);
  });

  it('returns true when the publish time changes', () => {
    expect(
      hasPublishDateChanged(SAVED, {
        schedulePublishDate: '2099-12-20',
        schedulePublishTime: '11:00:00 AM',
      })
    ).toBe(true);
  });

  it('returns true when there is no saved publish date yet', () => {
    expect(
      hasPublishDateChanged(undefined, {
        schedulePublishDate: '2099-12-20',
        schedulePublishTime: '10:00:00 AM',
      })
    ).toBe(true);
  });

  it('returns false when the current fields are empty (no edit made yet)', () => {
    expect(
      hasPublishDateChanged(SAVED, {
        schedulePublishDate: '',
        schedulePublishTime: '',
      })
    ).toBe(false);
  });
});
