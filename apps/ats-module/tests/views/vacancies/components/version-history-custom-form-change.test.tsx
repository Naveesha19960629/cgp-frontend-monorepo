import { render, screen } from '@testing-library/react';

import VersionHistoryCustomFormChange from '@/views/vacancies/components/version-history-custom-form-change';
import type { CustomFormChangeSummary } from '@/views/vacancies/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
  }),
}));

// DQCGP-2235 — one test per CustomFormChangeSummary kind, using the shape
// buildCustomFormChangeSummary() (version-history-helpers.ts) actually
// produces from the real API sample payloads.
describe('VersionHistoryCustomFormChange', () => {
  it('renders Forms Added as a box grid with the form title and question count', () => {
    const summary: CustomFormChangeSummary = {
      kind: 'formsAdded',
      forms: [
        { formTitle: 'Behavioral Assessment', questionCount: 6 },
        { formTitle: 'Background Check Form', questionCount: 3 },
      ],
    };
    render(<VersionHistoryCustomFormChange summary={summary} />);

    expect(screen.getByText('Behavioral Assessment')).toBeInTheDocument();
    expect(screen.getByText('Background Check Form')).toBeInTheDocument();
    expect(
      screen.getAllByText(
        'versionHistory.changeTypes.customForm.questionCount:6'
      )
    ).toHaveLength(1);
    expect(
      screen.getAllByText(
        'versionHistory.changeTypes.customForm.questionCount:3'
      )
    ).toHaveLength(1);
  });

  it('stacks two question boxes for Questions Added in one save, each showing its own type/required meta', () => {
    const summary: CustomFormChangeSummary = {
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
    };
    const { container } = render(
      <VersionHistoryCustomFormChange summary={summary} />
    );

    expect(
      screen.getByText('Add New 2 question to exisiting form')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Add New 3 question to exisiting form')
    ).toBeInTheDocument();
    // The meta row's icon/label/dot/value are adjacent text+icon children of
    // one span, so their text isn't isolated in its own element — asserted
    // against the container's full text instead of a per-node getByText.
    expect(container.textContent).toContain(
      'customizableForm.question.types.paragraph'
    );
    expect(container.textContent).toContain(
      'customizableForm.question.types.shortAnswer'
    );
    // required: false on both questions -> both show "no", twice.
    expect(
      container.textContent?.split('versionHistory.changeTypes.customForm.no')
        .length - 1
    ).toBe(2);
  });

  it('colors only "Removed" red in the header — the count+noun stays the default slate, not red', () => {
    const summary: CustomFormChangeSummary = {
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
    };
    render(<VersionHistoryCustomFormChange summary={summary} />);

    const removedVerb = screen.getByText(
      'versionHistory.changeTypes.verbs.removed'
    );
    expect(removedVerb).toHaveClass('text-[#be123c]');
    const countDetail = screen.getByText(
      'versionHistory.changeTypes.details.removedItems:2,versionHistory.changeTypes.customForm.questionFieldLabels'
    );
    expect(countDetail).not.toHaveClass('text-[#be123c]');
  });

  it('hides the Type/Required meta row for a removed question when the API sends them as null', () => {
    const summary: CustomFormChangeSummary = {
      kind: 'questionsRemoved',
      formTitle: 'Behavioral Assessment',
      questions: [
        {
          text: 'Add New question to exisiting form',
          questionType: null,
          required: null,
        },
      ],
    };
    render(<VersionHistoryCustomFormChange summary={summary} />);

    expect(
      screen.getByText('Add New question to exisiting form')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('versionHistory.changeTypes.customForm.typeMetaLabel')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'versionHistory.changeTypes.customForm.requiredMetaLabel'
      )
    ).not.toBeInTheDocument();
  });

  it('renders one card per question for Options Added grouped across 3 different questions', () => {
    const summary: CustomFormChangeSummary = {
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
    };
    render(<VersionHistoryCustomFormChange summary={summary} />);

    expect(
      screen.getByText('Check box - 1st New Choise Question added')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Multiple Choice - 2nd New Choice Questions added')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Drop down - 3rd new Choice Questions added')
    ).toBeInTheDocument();
    expect(screen.getByText('Check box E')).toBeInTheDocument();
    expect(screen.getByText('Multiple Choise D')).toBeInTheDocument();
    expect(screen.getByText('Drop down option E')).toBeInTheDocument();
  });

  it('groups two options sharing one question into a single box grid', () => {
    const summary: CustomFormChangeSummary = {
      kind: 'optionsAdded',
      formTitle: 'Behavioral Assessment',
      groups: [
        {
          questionText: 'Where do you want to work?',
          options: ['Colombo', 'Remote'],
        },
      ],
    };
    render(<VersionHistoryCustomFormChange summary={summary} />);

    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('renders Question Text Updated as a before/after scalar diff', () => {
    const summary: CustomFormChangeSummary = {
      kind: 'questionTextUpdated',
      formTitle: 'Behavioral Assessment',
      before: 'Try first question',
      after: 'Try first question -> Question Changed',
    };
    render(<VersionHistoryCustomFormChange summary={summary} />);

    expect(screen.getByText('Try first question')).toBeInTheDocument();
    expect(
      screen.getByText('Try first question -> Question Changed')
    ).toBeInTheDocument();
  });

  it("resolves Question Type Updated enums to the app's established labels, not the raw enum", () => {
    const summary: CustomFormChangeSummary = {
      kind: 'questionTypeUpdated',
      formTitle: 'Behavioral Assessment',
      questionText: 'Try first question -> Question Changed -> type Changed',
      before: 'SHORT_ANSWER',
      after: 'PARAGRAPH',
    };
    render(<VersionHistoryCustomFormChange summary={summary} />);

    expect(
      screen.getByText('customizableForm.question.types.shortAnswer')
    ).toBeInTheDocument();
    expect(
      screen.getByText('customizableForm.question.types.paragraph')
    ).toBeInTheDocument();
    expect(screen.queryByText('SHORT_ANSWER')).not.toBeInTheDocument();
  });

  it('falls back to the raw type value for an unrecognized question type enum', () => {
    const summary: CustomFormChangeSummary = {
      kind: 'questionTypeUpdated',
      formTitle: 'Behavioral Assessment',
      questionText: 'Q',
      before: 'SOMETHING_NEW',
      after: 'PARAGRAPH',
    };
    render(<VersionHistoryCustomFormChange summary={summary} />);

    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument();
  });

  it('renders Option Value Updated as a before/after scalar diff', () => {
    const summary: CustomFormChangeSummary = {
      kind: 'optionValueUpdated',
      formTitle: 'Behavioral Assessment',
      questionText: 'Check box - 1st New Choise Question added',
      before: 'Check box  A',
      after: 'Check box  A - Chamod',
    };
    render(<VersionHistoryCustomFormChange summary={summary} />);

    // testing-library normalizes runs of whitespace in matched text, so the
    // real API's double space ("Check box  A") is queried as a single space.
    expect(screen.getByText('Check box A')).toBeInTheDocument();
    expect(screen.getByText('Check box A - Chamod')).toBeInTheDocument();
  });

  it('renders Required Toggle Changed as two toggle switches, off then on', () => {
    const summary: CustomFormChangeSummary = {
      kind: 'requiredToggleChanged',
      formTitle: 'Behavioral Assessment',
      questionText: 'New questions 1?',
      before: false,
      after: true,
    };
    const { container } = render(
      <VersionHistoryCustomFormChange summary={summary} />
    );

    // VersionHistoryToggleSwitch marks its Switch aria-hidden (it's a
    // read-only historical value, not a live control), which excludes it
    // from the accessibility-tree role query — queried by DOM attribute
    // instead of screen.getByRole.
    const switches = container.querySelectorAll('[role="switch"]');
    expect(switches).toHaveLength(2);
    expect(switches[0]).toHaveAttribute('data-state', 'unchecked');
    expect(switches[1]).toHaveAttribute('data-state', 'checked');
  });

  it('renders a Linear Scale Updated card with only the rows that actually changed, in the given order', () => {
    const summary: CustomFormChangeSummary = {
      kind: 'linearScaleUpdated',
      formTitle: 'Behavioral Assessment',
      questionText: 'Linear Scale',
      rows: [
        { field: 'startLabel', before: 'Star from 0', after: 'Star from 1' },
        { field: 'endLabel', before: 'End from 0', after: 'End to 7' },
      ],
    };
    const { container } = render(
      <VersionHistoryCustomFormChange summary={summary} />
    );

    expect(screen.getByText('Star from 0')).toBeInTheDocument();
    expect(screen.getByText('Star from 1')).toBeInTheDocument();
    expect(screen.getByText('End from 0')).toBeInTheDocument();
    expect(screen.getByText('End to 7')).toBeInTheDocument();
    // Only the 2 rows that changed (each rendering one arrow icon, and
    // nothing else in this card renders an svg) — no Start/End Value row
    // rendered even though the union type allows it.
    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });
});
