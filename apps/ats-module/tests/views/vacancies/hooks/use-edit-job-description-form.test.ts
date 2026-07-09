import { act, renderHook } from '@testing-library/react';

import { useEditJobDescriptionForm } from '@/views/vacancies/hooks/use-edit-job-description-form';
import type { VacancyJobDescription } from '@/views/vacancies/types';

const jobDescription: VacancyJobDescription = {
  vacancyId: 'vacancy-1',
  sections: [
    {
      sectionKey: 'PROFILE_REQUIREMENT',
      fields: [
        { fieldKey: 'GENDER', isVisible: true },
        { fieldKey: 'MARITAL_STATUS', isVisible: false },
      ],
    },
    {
      sectionKey: 'INDUSTRY',
      fields: [{ fieldKey: 'INDUSTRIES', isVisible: true }],
    },
  ],
};

describe('useEditJobDescriptionForm', () => {
  it('starts with no dirty state and empty form values before data loads', () => {
    const { result } = renderHook(() => useEditJobDescriptionForm());

    expect(result.current.isDirty).toBe(false);
    expect(result.current.form.getValues()).toEqual({});
  });

  it('resets the form from the loaded job description', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data?: VacancyJobDescription }) =>
        useEditJobDescriptionForm(data),
      { initialProps: { data: undefined as VacancyJobDescription | undefined } }
    );

    rerender({ data: jobDescription });

    expect(result.current.form.getValues()).toEqual({
      PROFILE_REQUIREMENT: { GENDER: true, MARITAL_STATUS: false },
      INDUSTRY: { INDUSTRIES: true },
    });
    expect(result.current.isDirty).toBe(false);
  });

  it('toggleField marks the form dirty and updates the value', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data?: VacancyJobDescription }) =>
        useEditJobDescriptionForm(data),
      { initialProps: { data: undefined as VacancyJobDescription | undefined } }
    );
    rerender({ data: jobDescription });

    act(() => {
      result.current.toggleField('PROFILE_REQUIREMENT', 'GENDER', false);
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.form.getValues('PROFILE_REQUIREMENT.GENDER')).toBe(
      false
    );
  });

  it('getAllFields returns every loaded field with its current toggle state, including untouched ones', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data?: VacancyJobDescription }) =>
        useEditJobDescriptionForm(data),
      { initialProps: { data: undefined as VacancyJobDescription | undefined } }
    );
    rerender({ data: jobDescription });

    act(() => {
      result.current.toggleField('PROFILE_REQUIREMENT', 'GENDER', false);
    });

    expect(result.current.getAllFields()).toEqual(
      expect.arrayContaining([
        {
          sectionKey: 'PROFILE_REQUIREMENT',
          fieldKey: 'GENDER',
          isVisible: false,
        },
        {
          sectionKey: 'PROFILE_REQUIREMENT',
          fieldKey: 'MARITAL_STATUS',
          isVisible: false,
        },
        { sectionKey: 'INDUSTRY', fieldKey: 'INDUSTRIES', isVisible: true },
      ])
    );
    expect(result.current.getAllFields()).toHaveLength(3);
  });

  it('getAllFields reflects the loaded snapshot even when nothing has been toggled', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data?: VacancyJobDescription }) =>
        useEditJobDescriptionForm(data),
      { initialProps: { data: undefined as VacancyJobDescription | undefined } }
    );
    rerender({ data: jobDescription });

    expect(result.current.getAllFields()).toEqual(
      expect.arrayContaining([
        {
          sectionKey: 'PROFILE_REQUIREMENT',
          fieldKey: 'GENDER',
          isVisible: true,
        },
        {
          sectionKey: 'PROFILE_REQUIREMENT',
          fieldKey: 'MARITAL_STATUS',
          isVisible: false,
        },
        { sectionKey: 'INDUSTRY', fieldKey: 'INDUSTRIES', isVisible: true },
      ])
    );
  });
});
