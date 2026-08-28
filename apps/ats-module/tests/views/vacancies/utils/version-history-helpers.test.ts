import type { VacancyVersionHistoryChange } from '@/views/vacancies/types';
import {
  buildCustomFormChangeSummary,
  buildVacancyCreationSummary,
  getSingleScalar,
  isDataTakenFromCandidateChange,
  isObjectArray,
  normalizeStatusKey,
  parseBooleanFlag,
  resolveChangeVariant,
  resolveScalarChangeLabelKey,
  resolveVersionEntries,
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

// DQCGP-2235 — "Customizable Forms" fixtures are the real API sample
// payloads the user supplied for each Figma-matched scenario.
describe('buildCustomFormChangeSummary', () => {
  it('parses Form Added into a formsAdded summary (Figma node 4229:229674)', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_ADDED',
      sectionName: 'Customizable Forms',
      fieldName: 'Form',
      oldValue: null,
      newValue: [
        { formTitle: 'Behavioral Assessment', questionCount: 1 },
        { formTitle: 'Background Check Form', questionCount: 1 },
      ],
    };
    expect(buildCustomFormChangeSummary([change], 0)).toEqual({
      summary: {
        kind: 'formsAdded',
        forms: [
          { formTitle: 'Behavioral Assessment', questionCount: 1 },
          { formTitle: 'Background Check Form', questionCount: 1 },
        ],
      },
      consumed: 1,
    });
  });

  it('parses Form Removed (multiple forms) into a formsRemoved summary (Figma node 4229:229703)', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_REMOVED',
      sectionName: 'Customizable Forms',
      fieldName: 'Form',
      oldValue: [
        { formTitle: 'Background Check Form', questionCount: 1 },
        { formTitle: 'Financial Detals', questionCount: 1 },
      ],
      newValue: null,
    };
    expect(buildCustomFormChangeSummary([change], 0)).toEqual({
      summary: {
        kind: 'formsRemoved',
        forms: [
          { formTitle: 'Background Check Form', questionCount: 1 },
          { formTitle: 'Financial Detals', questionCount: 1 },
        ],
      },
      consumed: 1,
    });
  });

  it('parses two Questions Added in one save into a questionsAdded summary (Figma node 4229:229761 — "two cards" per the user)', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_ADDED',
      sectionName: 'Customizable Forms',
      fieldName: 'Question',
      oldValue: null,
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: null,
          value: 'Add New 2 question to exisiting form',
          questionType: 'PARAGRAPH',
          required: false,
          changeIndex: 1,
        },
        {
          formTitle: 'Behavioral Assessment',
          questionText: null,
          value: 'Add New 3 question to exisiting form',
          questionType: 'SHORT_ANSWER',
          required: false,
          changeIndex: 2,
        },
      ],
    };
    expect(buildCustomFormChangeSummary([change], 0)).toEqual({
      summary: {
        kind: 'questionsAdded',
        formTitle: 'Behavioral Assessment',
        questions: [
          {
            text: 'Add New 2 question to exisiting form',
            questionType: 'PARAGRAPH',
            required: false,
          },
          {
            text: 'Add New 3 question to exisiting form',
            questionType: 'SHORT_ANSWER',
            required: false,
          },
        ],
      },
      consumed: 1,
    });
  });

  it('parses two Questions Removed with null type/required (real API sample — Figma mock shows them populated, but the app hides the meta row instead of fabricating a value)', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_REMOVED',
      sectionName: 'Customizable Forms',
      fieldName: 'Question',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: null,
          value: 'Add New question to exisiting form',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
        {
          formTitle: 'Behavioral Assessment',
          questionText: null,
          value: 'Add New 2 question to exisiting form',
          questionType: null,
          required: null,
          changeIndex: 2,
        },
      ],
      newValue: null,
    };
    const result = buildCustomFormChangeSummary([change], 0);
    expect(result?.summary).toEqual({
      kind: 'questionsRemoved',
      formTitle: 'Behavioral Assessment',
      questions: [
        {
          text: 'Add New question to exisiting form',
          questionType: null,
          required: null,
        },
        {
          text: 'Add New 2 question to exisiting form',
          questionType: null,
          required: null,
        },
      ],
    });
  });

  it('parses Question Text Updated into a before/after summary (Figma node 4229:229804)', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Question Text',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: null,
          value: 'Try first question',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: null,
          value: 'Try first question -> Question Changed',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
    };
    expect(buildCustomFormChangeSummary([change], 0)).toEqual({
      summary: {
        kind: 'questionTextUpdated',
        formTitle: 'Behavioral Assessment',
        before: 'Try first question',
        after: 'Try first question -> Question Changed',
      },
      consumed: 1,
    });
  });

  it('parses Question Type Updated with the raw type enums, resolved to labels at render time (Figma node 4229:229835)', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Question Type',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText:
            'Try first question -> Question Changed -> type Changed',
          value: 'SHORT_ANSWER',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText:
            'Try first question -> Question Changed -> type Changed',
          value: 'PARAGRAPH',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
    };
    expect(buildCustomFormChangeSummary([change], 0)).toEqual({
      summary: {
        kind: 'questionTypeUpdated',
        formTitle: 'Behavioral Assessment',
        questionText: 'Try first question -> Question Changed -> type Changed',
        before: 'SHORT_ANSWER',
        after: 'PARAGRAPH',
      },
      consumed: 1,
    });
  });

  it('groups New Option Added across 3 different questions into 3 groups by changeIndex (Figma node 4229:229858 — "three cards" per the user)', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_ADDED',
      sectionName: 'Customizable Forms',
      fieldName: 'Option',
      oldValue: null,
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Check box - 1st New Choise Question added',
          value: 'Check box E',
          questionType: 'CHECKBOXES',
          required: null,
          changeIndex: 1,
        },
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Multiple Choice - 2nd New Choice Questions added',
          value: 'Multiple Choise D',
          questionType: 'MULTIPLE_CHOICE',
          required: null,
          changeIndex: 2,
        },
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Drop down - 3rd new Choice Questions added',
          value: 'Drop down option E',
          questionType: 'DROPDOWN',
          required: null,
          changeIndex: 3,
        },
      ],
    };
    expect(buildCustomFormChangeSummary([change], 0)).toEqual({
      summary: {
        kind: 'optionsAdded',
        formTitle: 'Behavioral Assessment',
        groups: [
          {
            questionText: 'Check box - 1st New Choise Question added',
            options: ['Check box E'],
          },
          {
            questionText: 'Multiple Choice - 2nd New Choice Questions added',
            options: ['Multiple Choise D'],
          },
          {
            questionText: 'Drop down - 3rd new Choice Questions added',
            options: ['Drop down option E'],
          },
        ],
      },
      consumed: 1,
    });
  });

  it('groups two options sharing the same changeIndex into one card', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_ADDED',
      sectionName: 'Customizable Forms',
      fieldName: 'Option',
      oldValue: null,
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Where do you want to work?',
          value: 'Colombo',
          questionType: 'CHECKBOXES',
          required: null,
          changeIndex: 1,
        },
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Where do you want to work?',
          value: 'Remote',
          questionType: 'CHECKBOXES',
          required: null,
          changeIndex: 1,
        },
      ],
    };
    expect(buildCustomFormChangeSummary([change], 0)).toEqual({
      summary: {
        kind: 'optionsAdded',
        formTitle: 'Behavioral Assessment',
        groups: [
          {
            questionText: 'Where do you want to work?',
            options: ['Colombo', 'Remote'],
          },
        ],
      },
      consumed: 1,
    });
  });

  it('parses Option Value Updated (Figma node 4229:229896)', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Option Value',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Check box - 1st New Choise Question added',
          value: 'Check box  A',
          questionType: 'CHECKBOXES',
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Check box - 1st New Choise Question added',
          value: 'Check box  A - Chamod',
          questionType: 'CHECKBOXES',
          required: null,
          changeIndex: 1,
        },
      ],
    };
    expect(buildCustomFormChangeSummary([change], 0)).toEqual({
      summary: {
        kind: 'optionValueUpdated',
        formTitle: 'Behavioral Assessment',
        questionText: 'Check box - 1st New Choise Question added',
        before: 'Check box  A',
        after: 'Check box  A - Chamod',
      },
      consumed: 1,
    });
  });

  it('parses Option Removed (Figma node 4229:229937)', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_REMOVED',
      sectionName: 'Customizable Forms',
      fieldName: 'Option',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Check box - 1st New Choise Question added',
          value: 'Check box E',
          questionType: 'CHECKBOXES',
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: null,
    };
    expect(buildCustomFormChangeSummary([change], 0)).toEqual({
      summary: {
        kind: 'optionsRemoved',
        formTitle: 'Behavioral Assessment',
        groups: [
          {
            questionText: 'Check box - 1st New Choise Question added',
            options: ['Check box E'],
          },
        ],
      },
      consumed: 1,
    });
  });

  it.each([
    ['false', 'true', false, true],
    ['true', 'false', true, false],
  ])(
    'parses Required Toggle Changed %s -> %s as booleans (Figma node 4229:229985)',
    (beforeValue, afterValue, expectedBefore, expectedAfter) => {
      const change: VacancyVersionHistoryChange = {
        changeType: 'FIELD_VALUE_UPDATED',
        sectionName: 'Customizable Forms',
        fieldName: 'Required',
        oldValue: [
          {
            formTitle: 'Behavioral Assessment',
            questionText: 'New questions 1?',
            value: beforeValue,
            questionType: null,
            required: null,
            changeIndex: 1,
          },
        ],
        newValue: [
          {
            formTitle: 'Behavioral Assessment',
            questionText: 'New questions 1?',
            value: afterValue,
            questionType: null,
            required: null,
            changeIndex: 1,
          },
        ],
      };
      expect(buildCustomFormChangeSummary([change], 0)).toEqual({
        summary: {
          kind: 'requiredToggleChanged',
          formTitle: 'Behavioral Assessment',
          questionText: 'New questions 1?',
          before: expectedBefore,
          after: expectedAfter,
        },
        consumed: 1,
      });
    }
  );

  it('merges Linear Scale Start Value + End Value + Start Label + End Label across separate raw changes into one card, in a fixed row order (Figma node 4229:230027)', () => {
    const startValueChange: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Linear Scale Start Value',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: '0',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: '1',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
    };
    const endLabelChange: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Linear Scale End Label',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: 'End from 0',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: 'End to 7',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
    };
    const startLabelChange: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Linear Scale Start Label',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: 'Star from 0',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: 'Star from 1',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
    };
    // Deliberately out of the Figma card's visual order (Start Value, End
    // Label, Start Label) — the API reports each field as its own flat
    // entry in whatever order it saved them, and the merge must still
    // output rows in the fixed Start Value / End Value / Start Label / End
    // Label order regardless of arrival order.
    const changes = [startValueChange, endLabelChange, startLabelChange];

    expect(buildCustomFormChangeSummary(changes, 0)).toEqual({
      summary: {
        kind: 'linearScaleUpdated',
        formTitle: 'Behavioral Assessment',
        questionText: 'Linear Scale',
        rows: [
          { field: 'startValue', before: '0', after: '1' },
          { field: 'startLabel', before: 'Star from 0', after: 'Star from 1' },
          { field: 'endLabel', before: 'End from 0', after: 'End to 7' },
        ],
      },
      consumed: 3,
    });
  });

  it('does not merge a Linear Scale change belonging to a different question', () => {
    const startValueChange: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Linear Scale Start Value',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale A',
          value: '0',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale A',
          value: '1',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
    };
    const otherQuestionEndValueChange: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Linear Scale End Value',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale B',
          value: '2',
          questionType: null,
          required: null,
          changeIndex: 2,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale B',
          value: '7',
          questionType: null,
          required: null,
          changeIndex: 2,
        },
      ],
    };
    const result = buildCustomFormChangeSummary(
      [startValueChange, otherQuestionEndValueChange],
      0
    );
    expect(result).toEqual({
      summary: {
        kind: 'linearScaleUpdated',
        formTitle: 'Behavioral Assessment',
        questionText: 'Linear Scale A',
        rows: [{ field: 'startValue', before: '0', after: '1' }],
      },
      consumed: 1,
    });
  });

  it('returns null (falls back to the generic renderer) for an unrecognized Customizable Forms field name', () => {
    const change: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Something Unexpected',
      oldValue: ['a'],
      newValue: ['b'],
    };
    expect(buildCustomFormChangeSummary([change], 0)).toBeNull();
  });
});

describe('resolveVersionEntries — Customizable Forms integration', () => {
  it('folds a Linear Scale Start/End Label pair (2 raw changes) into ONE entry, alongside an unrelated plain change', () => {
    const startLabelChange: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Linear Scale Start Label',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: 'Star from 0',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: 'Star from 1',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
    };
    const endLabelChange: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Customizable Forms',
      fieldName: 'Linear Scale End Label',
      oldValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: 'End from 0',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
      newValue: [
        {
          formTitle: 'Behavioral Assessment',
          questionText: 'Linear Scale',
          value: 'End to 7',
          questionType: null,
          required: null,
          changeIndex: 1,
        },
      ],
    };
    const titleChange: VacancyVersionHistoryChange = {
      changeType: 'FIELD_VALUE_UPDATED',
      sectionName: 'Vacancy',
      fieldName: 'Title',
      oldValue: ['Old Title'],
      newValue: ['New Title'],
    };

    const entries = resolveVersionEntries(
      {
        versionNumber: 23,
        updatedAt: '2026-08-28T09:58:02.808603',
        updatedBy: 'pmo@oxoholdings.group',
        profilePicture: null,
        changes: {
          user: [startLabelChange, endLabelChange, titleChange],
          system: [],
        },
      },
      'pmo@oxoholdings.group'
    );

    expect(entries).toHaveLength(2);
    expect(entries[0].customFormChange).toEqual({
      kind: 'linearScaleUpdated',
      formTitle: 'Behavioral Assessment',
      questionText: 'Linear Scale',
      rows: [
        { field: 'startLabel', before: 'Star from 0', after: 'Star from 1' },
        { field: 'endLabel', before: 'End from 0', after: 'End to 7' },
      ],
    });
    expect(entries[1].change).toBe(titleChange);
    expect(entries[1].customFormChange).toBeUndefined();
  });
});
