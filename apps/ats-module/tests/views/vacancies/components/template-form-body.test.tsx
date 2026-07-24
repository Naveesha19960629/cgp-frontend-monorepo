import type { UseFormReturn } from 'react-hook-form';

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TemplateFormBody from '@/views/vacancies/components/template-form-body';
import { useVacancyTemplateForm } from '@/views/vacancies/hooks/use-vacancy-template-form';
import type { VacancyTemplateFormValues } from '@/views/vacancies/hooks/use-vacancy-template-form';
import { TEMPLATE_NAME_MAX_LENGTH } from '@/views/vacancies/utils/vacancy-template-config';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { max?: number }) =>
      opts ? `${key}:${opts.max}` : key,
  }),
}));

/** Renders the real `useVacancyTemplateForm` hook, exactly like the pages do. */
function Harness({
  onFormReady,
}: Readonly<{
  onFormReady?: (form: UseFormReturn<VacancyTemplateFormValues>) => void;
}>) {
  const { form, setDataTakenFromCandidate } = useVacancyTemplateForm();
  onFormReady?.(form);
  return (
    <TemplateFormBody
      form={form}
      setDataTakenFromCandidate={setDataTakenFromCandidate}
    />
  );
}

describe('TemplateFormBody', () => {
  it('renders the template name input with the placeholder', () => {
    render(<Harness />);
    expect(
      screen.getByPlaceholderText('createTemplate.namePlaceholder')
    ).toBeInTheDocument();
  });

  it('updates the template name field when the user changes it', () => {
    render(<Harness />);

    const input = screen.getByLabelText('createTemplate.nameLabel');
    fireEvent.change(input, { target: { value: 'Engineer' } });

    expect(input).toHaveValue('Engineer');
  });

  it('strips emoji from the entered template name', () => {
    render(<Harness />);

    const input = screen.getByLabelText('createTemplate.nameLabel');
    fireEvent.change(input, { target: { value: 'Dev😀' } });

    expect(input).toHaveValue('Dev');
  });

  it('does not show a name error message when the name is valid', () => {
    render(<Harness />);

    const input = screen.getByLabelText('createTemplate.nameLabel');
    fireEvent.change(input, { target: { value: 'Engineer' } });

    expect(
      screen.queryByText(/createTemplate\.nameRequired/)
    ).not.toBeInTheDocument();
  });

  it('shows a name-required error message once the name field is emptied', async () => {
    render(<Harness />);

    const input = screen.getByLabelText('createTemplate.nameLabel');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: '' } });

    expect(
      await screen.findByText(
        `createTemplate.nameRequired:${TEMPLATE_NAME_MAX_LENGTH}`
      )
    ).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders a section card for every configured template section', () => {
    render(<Harness />);
    expect(
      screen.getByText('createTemplate.sections.profileRequirement')
    ).toBeInTheDocument();
    expect(
      screen.getByText('createTemplate.sections.skills')
    ).toBeInTheDocument();
    expect(
      screen.getByText('createTemplate.sections.industries')
    ).toBeInTheDocument();
  });

  it('renders the Customizable Form section with its own switch', () => {
    render(<Harness />);
    expect(
      screen.getByText('createTemplate.sections.customizableForm')
    ).toBeInTheDocument();
  });

  it('toggles the Customizable Form switch on click', async () => {
    const user = userEvent.setup();
    let currentForm: UseFormReturn<VacancyTemplateFormValues> | undefined;
    render(<Harness onFormReady={form => (currentForm = form)} />);

    const heading = screen.getByText(
      'createTemplate.sections.customizableForm'
    );
    const section = heading.closest('section')!;
    const toggle = within(section).getByRole('switch');

    expect(toggle).not.toBeChecked();
    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(currentForm!.getValues('customizableForm')).toBe(true);
  });

  it('toggles a field switch inside a section on click', async () => {
    const user = userEvent.setup();
    let currentForm: UseFormReturn<VacancyTemplateFormValues> | undefined;
    render(<Harness onFormReady={form => (currentForm = form)} />);

    const fieldLabel = screen.getByText('createTemplate.fields.profile.gender');
    const row = fieldLabel.closest('div')!;
    const toggle = within(row).getByRole('switch');

    await user.click(toggle);

    expect(
      currentForm!.getValues('sections.profileRequirement.fields.gender')
    ).toBe(true);
  });

  it('checks the "data from candidate" checkbox for a section', async () => {
    const user = userEvent.setup();
    let currentForm: UseFormReturn<VacancyTemplateFormValues> | undefined;
    render(<Harness onFormReady={form => (currentForm = form)} />);

    const heading = screen.getByText(
      'createTemplate.sections.profileRequirement'
    );
    const section = heading.closest('section')!;
    const checkbox = within(section).getByRole('checkbox');

    await user.click(checkbox);

    expect(
      currentForm!.getValues(
        'sections.profileRequirement.dataTakenFromCandidate'
      )
    ).toBe(true);
  });

  it('disables and forces off field toggles in a section when "data from candidate" is checked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const fieldLabel = screen.getByText('createTemplate.fields.profile.gender');
    const row = fieldLabel.closest('div')!;
    const fieldToggle = within(row).getByRole('switch');

    await user.click(fieldToggle);
    expect(fieldToggle).toBeChecked();

    const heading = screen.getByText(
      'createTemplate.sections.profileRequirement'
    );
    const section = heading.closest('section')!;
    const checkbox = within(section).getByRole('checkbox');
    await user.click(checkbox);

    expect(fieldToggle).not.toBeChecked();
    expect(fieldToggle).toBeDisabled();
  });
});
