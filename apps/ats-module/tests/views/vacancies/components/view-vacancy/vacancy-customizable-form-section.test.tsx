import { screen } from '@testing-library/react';

import { VacancyCustomizableFormSection } from '@/views/vacancies/components/view-vacancy/vacancy-customizable-form-section';
import type {
  VacancyViewCustomizableFormCard,
  VacancyViewCustomizableFormQuestion,
} from '@/views/vacancies/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseQuestion: VacancyViewCustomizableFormQuestion = {
  text: 'What is your favorite color?',
  type: 'SHORT_ANSWER',
  required: false,
  options: [],
  scaleFrom: 0,
  scaleTo: 2,
  startLabel: '',
  endLabel: '',
};

const buildForm = (
  overrides: Partial<VacancyViewCustomizableFormCard> = {}
): VacancyViewCustomizableFormCard => ({
  title: 'Screening form',
  questions: [baseQuestion],
  ...overrides,
});

describe('VacancyCustomizableFormSection', () => {
  it('renders nothing when customizableForm is undefined', () => {
    const { container } = render(
      <VacancyCustomizableFormSection customizableForm={undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when isEnabled is false', () => {
    const { container } = render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: false,
          sectionTitle: 'My Form',
          forms: [buildForm()],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when forms is empty', () => {
    const { container } = render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [],
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the custom section title when provided', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'Custom Screening',
          forms: [buildForm()],
        }}
      />
    );
    expect(screen.getByText('Custom Screening')).toBeInTheDocument();
  });

  it('falls back to the default section title when sectionTitle is empty', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: '',
          forms: [buildForm()],
        }}
      />
    );
    expect(
      screen.getByText('vacancies.view.sections.customizableForms')
    ).toBeInTheDocument();
  });

  it('falls back to the untitled form label when form title is empty', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [buildForm({ title: '' })],
        }}
      />
    );
    expect(
      screen.getByText('customizableForm.untitledForm')
    ).toBeInTheDocument();
  });

  it('renders the form title when provided', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [buildForm({ title: 'Interview Form' })],
        }}
      />
    );
    expect(screen.getByText('Interview Form')).toBeInTheDocument();
  });

  it('renders multiple forms and multiple questions per form', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [
            buildForm({
              title: 'Form A',
              questions: [
                baseQuestion,
                { ...baseQuestion, text: 'Second question' },
              ],
            }),
            buildForm({ title: 'Form B' }),
          ],
        }}
      />
    );
    expect(screen.getByText('Form A')).toBeInTheDocument();
    expect(screen.getByText('Form B')).toBeInTheDocument();
    expect(
      screen.getAllByText('What is your favorite color?').length
    ).toBeGreaterThan(0);
    expect(screen.getByText('Second question')).toBeInTheDocument();
  });

  it('hides the question field entirely when question text is empty', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [buildForm({ questions: [{ ...baseQuestion, text: '' }] })],
        }}
      />
    );
    expect(
      screen.queryByText('customizableForm.view.question')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('-')).not.toBeInTheDocument();
  });

  it('hides the type field entirely when question type is empty', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [buildForm({ questions: [{ ...baseQuestion, type: '' }] })],
        }}
      />
    );
    expect(
      screen.queryByText('customizableForm.view.type')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('-')).not.toBeInTheDocument();
  });

  it.each([
    ['SHORT_ANSWER', 'customizableForm.question.types.shortAnswer'],
    ['PARAGRAPH', 'customizableForm.question.types.paragraph'],
    ['MULTIPLE_CHOICE', 'customizableForm.question.types.multipleChoice'],
    ['CHECKBOXES', 'customizableForm.question.types.checkboxes'],
    ['DROPDOWN', 'customizableForm.question.types.dropDown'],
    ['LINEAR_SCALE', 'customizableForm.question.types.linearScale'],
  ] as const)(
    'renders the correct type label for %s questions',
    (type, expectedLabel) => {
      render(
        <VacancyCustomizableFormSection
          customizableForm={{
            isEnabled: true,
            sectionTitle: 'My Form',
            forms: [buildForm({ questions: [{ ...baseQuestion, type }] })],
          }}
        />
      );
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    }
  );

  it.each(['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'] as const)(
    'renders option badges for %s questions when options exist',
    type => {
      render(
        <VacancyCustomizableFormSection
          customizableForm={{
            isEnabled: true,
            sectionTitle: 'My Form',
            forms: [
              buildForm({
                questions: [
                  { ...baseQuestion, type, options: ['Option A', 'Option B'] },
                ],
              }),
            ],
          }}
        />
      );
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
      expect(
        screen.getByText('customizableForm.view.options')
      ).toBeInTheDocument();
    }
  );

  it('does not render options section for option-type questions with no options', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [
            buildForm({
              questions: [
                { ...baseQuestion, type: 'MULTIPLE_CHOICE', options: [] },
              ],
            }),
          ],
        }}
      />
    );
    expect(
      screen.queryByText('customizableForm.view.options')
    ).not.toBeInTheDocument();
  });

  it('does not render options section for non-option question types', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [
            buildForm({
              questions: [{ ...baseQuestion, type: 'SHORT_ANSWER' }],
            }),
          ],
        }}
      />
    );
    expect(
      screen.queryByText('customizableForm.view.options')
    ).not.toBeInTheDocument();
  });

  it('renders scale range and start/end labels for LINEAR_SCALE questions', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [
            buildForm({
              questions: [
                {
                  ...baseQuestion,
                  type: 'LINEAR_SCALE',
                  scaleFrom: 1,
                  scaleTo: 5,
                  startLabel: 'Not likely',
                  endLabel: 'Very likely',
                },
              ],
            }),
          ],
        }}
      />
    );
    expect(screen.getByText('1–5')).toBeInTheDocument();
    expect(screen.getByText('Not likely')).toBeInTheDocument();
    expect(screen.getByText('Very likely')).toBeInTheDocument();
    expect(
      screen.getByText('customizableForm.question.startLabel')
    ).toBeInTheDocument();
    expect(
      screen.getByText('customizableForm.question.endLabel')
    ).toBeInTheDocument();
  });

  it('does not render scale fields for non-LINEAR_SCALE questions', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [
            buildForm({
              questions: [{ ...baseQuestion, type: 'SHORT_ANSWER' }],
            }),
          ],
        }}
      />
    );
    expect(
      screen.queryByText('customizableForm.view.scale')
    ).not.toBeInTheDocument();
  });

  it('shows required label when question is required', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [
            buildForm({ questions: [{ ...baseQuestion, required: true }] }),
          ],
        }}
      />
    );
    expect(
      screen.getByText('customizableForm.view.required')
    ).toBeInTheDocument();
  });

  it('shows optional label when question is not required', () => {
    render(
      <VacancyCustomizableFormSection
        customizableForm={{
          isEnabled: true,
          sectionTitle: 'My Form',
          forms: [
            buildForm({ questions: [{ ...baseQuestion, required: false }] }),
          ],
        }}
      />
    );
    expect(
      screen.getByText('customizableForm.view.optional')
    ).toBeInTheDocument();
  });
});
