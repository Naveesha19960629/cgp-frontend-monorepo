import { act, renderHook } from '@testing-library/react';

import { useVacancyTemplateForm } from '@/views/vacancies/hooks/use-vacancy-template-form';
import { TEMPLATE_SECTIONS } from '@/views/vacancies/utils/vacancy-template-config';

describe('useVacancyTemplateForm', () => {
  it('initializes with default values: empty name, all toggles off', () => {
    const { result } = renderHook(() => useVacancyTemplateForm());

    const values = result.current.form.getValues();

    expect(values.templateName).toBe('');
    expect(values.customizableForm).toBe(false);

    for (const section of TEMPLATE_SECTIONS) {
      const sectionState = values.sections[section.key];
      expect(sectionState.dataTakenFromCandidate).toBe(false);
      for (const field of section.fields) {
        expect(sectionState.fields[field.code]).toBe(false);
      }
    }
  });

  it('fails validation when templateName is empty', async () => {
    const { result } = renderHook(() => useVacancyTemplateForm());

    const triggerResult = await result.current.form.trigger('templateName');

    expect(triggerResult).toBe(false);
  });

  it('fails validation when templateName exceeds the max length', async () => {
    const { result } = renderHook(() => useVacancyTemplateForm());

    act(() => {
      result.current.form.setValue('templateName', 'a'.repeat(151));
    });
    const triggerResult = await result.current.form.trigger('templateName');

    expect(triggerResult).toBe(false);
  });

  it('accepts a templateName at the max length boundary', async () => {
    const { result } = renderHook(() => useVacancyTemplateForm());

    act(() => {
      result.current.form.setValue('templateName', 'a'.repeat(150));
    });
    const triggerResult = await result.current.form.trigger('templateName');

    expect(triggerResult).toBe(true);
  });

  it('passes validation for the full form with valid default state', async () => {
    const { result } = renderHook(() => useVacancyTemplateForm());

    act(() => {
      result.current.form.setValue('templateName', 'My Template');
    });
    const triggerResult = await result.current.form.trigger();

    expect(triggerResult).toBe(true);
  });

  it('setDataTakenFromCandidate(sectionKey, true) sets the checkbox and turns every field toggle in that section off', () => {
    const { result } = renderHook(() => useVacancyTemplateForm());
    const section = TEMPLATE_SECTIONS[0];

    act(() => {
      for (const field of section.fields) {
        result.current.form.setValue(
          `sections.${section.key}.fields.${field.code}`,
          true
        );
      }
    });

    act(() => {
      result.current.setDataTakenFromCandidate(section.key, true);
    });

    const values = result.current.form.getValues();
    expect(values.sections[section.key].dataTakenFromCandidate).toBe(true);
    for (const field of section.fields) {
      expect(values.sections[section.key].fields[field.code]).toBe(false);
    }
  });

  it('setDataTakenFromCandidate(sectionKey, false) only updates the checkbox and leaves field toggles untouched', () => {
    const { result } = renderHook(() => useVacancyTemplateForm());
    const section = TEMPLATE_SECTIONS[0];
    const firstField = section.fields[0];

    act(() => {
      result.current.form.setValue(
        `sections.${section.key}.fields.${firstField.code}`,
        true
      );
    });

    act(() => {
      result.current.setDataTakenFromCandidate(section.key, false);
    });

    const values = result.current.form.getValues();
    expect(values.sections[section.key].dataTakenFromCandidate).toBe(false);
    expect(values.sections[section.key].fields[firstField.code]).toBe(true);
  });

  it('setDataTakenFromCandidate marks the field as dirty', () => {
    const { result } = renderHook(() => useVacancyTemplateForm());
    const section = TEMPLATE_SECTIONS[0];

    expect(result.current.form.formState.isDirty).toBe(false);

    act(() => {
      result.current.setDataTakenFromCandidate(section.key, true);
    });

    expect(result.current.form.formState.isDirty).toBe(true);
  });

  it('is a no-op when the section key does not exist in TEMPLATE_SECTIONS', () => {
    const { result } = renderHook(() => useVacancyTemplateForm());

    expect(() => {
      act(() => {
        result.current.setDataTakenFromCandidate('unknownSection', true);
      });
    }).not.toThrow();
  });
});
