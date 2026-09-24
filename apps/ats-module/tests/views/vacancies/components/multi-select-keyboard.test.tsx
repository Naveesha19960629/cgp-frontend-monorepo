import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { initReactI18next } from 'react-i18next';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { beforeAll, describe, expect, it, vi } from 'vitest';

import atsEn from '@/app/utils/i18n/locales/en/ats.json';

import MultipleSelector, {
  type Option,
} from '@cgp/ui-kit/components/multi-select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@cgp/ui-kit/components/ui/form';
import i18n from 'i18next';

// DQCGP-4310 — keyboard accessibility (ATS NFR-024). Real cmdk,
// Radix Popover and English translations: multi-select.test.tsx mocks the
// badge and runs without i18n, so it can't check what a screen reader hears.

const options: Option[] = [
  { value: 'reading', label: 'Reading' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'hiking', label: 'Hiking' },
];

function Harness({
  initial = [],
  onChange,
}: {
  initial?: Option[];
  onChange?: (value: Option[]) => void;
}) {
  const [value, setValue] = useState<Option[]>(initial);
  return (
    <MultipleSelector
      value={value}
      options={options}
      onChange={next => {
        setValue(next);
        onChange?.(next);
      }}
      inputProps={{ 'aria-label': 'Hobbies' }}
    />
  );
}

const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

beforeAll(async () => {
  // Same bundle ATS merges into the shared 'translation' namespace, which
  // the ui-kit components read from.
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      lng: 'en',
      resources: { en: { translation: atsEn } },
      interpolation: { escapeValue: false },
    });
  } else {
    i18n.addResourceBundle('en', 'translation', atsEn, true, true);
  }
});

function FormHarness() {
  const form = useForm<{ hobbies: Option[] }>({
    defaultValues: { hobbies: [] },
  });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="hobbies"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your hobbies</FormLabel>
            <FormControl>
              <MultipleSelector
                value={field.value}
                onChange={field.onChange}
                options={options}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  );
}

describe('MultipleSelector — accessible name (WCAG 4.1.2)', () => {
  it('takes its name from the FormLabel when wrapped in FormControl', () => {
    render(<FormHarness />);

    expect(
      screen.getByRole('combobox', { name: 'Your hobbies' })
    ).toBeInTheDocument();
  });

  it('drops cmdk’s empty label so browsers fall back to the placeholder', () => {
    render(<MultipleSelector options={options} placeholder="Search hobbies" />);
    const input = screen.getByRole('combobox');

    // Browsers name an unlabelled input from its placeholder (HTML-AAM), but
    // only if aria-labelledby isn't pointing at cmdk's empty <label>.
    // dom-accessibility-api skips placeholders, so assert the attributes.
    expect(input).not.toHaveAttribute('aria-labelledby');
    expect(input).toHaveAttribute('placeholder', 'Search hobbies');
  });

  it('routes an explicit aria-label through cmdk’s label', () => {
    render(
      <MultipleSelector options={options} aria-label="Preferred hobbies" />
    );

    expect(
      screen.getByRole('combobox', { name: 'Preferred hobbies' })
    ).toBeInTheDocument();
  });
});

describe('MultipleSelector — keyboard accessibility', () => {
  it('reports aria-expanded truthfully instead of cmdk’s fixed "true"', async () => {
    const user = setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Hobbies' });

    expect(input).toHaveAttribute('aria-expanded', 'false');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('names every chip remove button and the clear-all button', () => {
    render(<Harness initial={[options[0], options[1]]} />);

    expect(
      screen.getByRole('button', { name: 'Remove Reading' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Gaming' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Clear all selections' })
    ).toBeInTheDocument();
  });

  describe('Backspace / Delete (NFR-024)', () => {
    it.each(['{Backspace}', '{Delete}'])(
      'removes the last chip with %s on an empty search and announces it',
      async key => {
        const user = setup();
        const onChange = vi.fn();
        render(
          <Harness initial={[options[0], options[1]]} onChange={onChange} />
        );

        screen.getByRole('combobox', { name: 'Hobbies' }).focus();
        await user.keyboard(key);

        expect(onChange).toHaveBeenCalledWith([options[0]]);
        expect(screen.getByRole('status')).toHaveTextContent(
          'Gaming removed. 1 selected.'
        );
      }
    );

    it('announces when the last chip goes', async () => {
      const user = setup();
      render(<Harness initial={[options[0]]} />);

      screen.getByRole('combobox', { name: 'Hobbies' }).focus();
      await user.keyboard('{Backspace}');

      expect(screen.getByRole('status')).toHaveTextContent(
        'Reading removed. Nothing selected.'
      );
    });

    it('skips fixed chips', async () => {
      const user = setup();
      const onChange = vi.fn();
      const fixed = { ...options[1], fixed: true };
      render(<Harness initial={[options[0], fixed]} onChange={onChange} />);

      screen.getByRole('combobox', { name: 'Hobbies' }).focus();
      await user.keyboard('{Backspace}');

      expect(onChange).toHaveBeenCalledWith([fixed]);
    });

    it('edits the search text instead while there is text', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness initial={[options[0]]} onChange={onChange} />);
      const input = screen.getByRole('combobox', { name: 'Hobbies' });

      await user.type(input, 'Gam{Backspace}');

      expect(input).toHaveValue('Ga');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Enter (NFR-024 with DQCGP-3297)', () => {
    it('does not select the auto-highlighted option on an unaimed Enter', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);

      await user.click(screen.getByRole('combobox', { name: 'Hobbies' }));
      await user.keyboard('{Enter}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('still honours the enableEnterToSelect opt-in without navigation', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(
        <MultipleSelector
          options={options}
          onChange={onChange}
          enableEnterToSelect
          aria-label="Hobbies"
        />
      );

      await user.click(screen.getByRole('combobox', { name: 'Hobbies' }));
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('selects the option the user moved to with the arrow keys', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);

      await user.click(screen.getByRole('combobox', { name: 'Hobbies' }));
      await user.keyboard('{ArrowDown}{Enter}');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toHaveLength(1);
    });
  });

  describe('visible highlight (WCAG 2.4.7)', () => {
    /** The option cmdk has active, if the list draws it. */
    const drawnHighlight = () =>
      screen
        .getAllByRole('option')
        .find(
          option =>
            option.getAttribute('data-selected') === 'true' &&
            option.classList.contains('data-[selected=true]:bg-accent')
        );

    it('draws no highlight before the user moves it', async () => {
      const user = setup();
      render(<Harness />);

      await user.click(screen.getByRole('combobox', { name: 'Hobbies' }));

      expect(drawnHighlight()).toBeUndefined();
    });

    it('lands the first ArrowDown on the first option, then Enter picks it', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);

      await user.click(screen.getByRole('combobox', { name: 'Hobbies' }));
      await user.keyboard('{ArrowDown}');
      expect(drawnHighlight()).toHaveTextContent('Reading');

      await user.keyboard('{ArrowDown}');
      expect(drawnHighlight()).toHaveTextContent('Gaming');

      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenLastCalledWith([options[1]]);
    });

    it('highlights the first option when ArrowDown opens the list', async () => {
      const user = setup();
      render(<Harness />);

      await user.click(screen.getByRole('combobox', { name: 'Hobbies' }));
      await user.keyboard('{Escape}{ArrowDown}');

      expect(drawnHighlight()).toHaveTextContent('Reading');
    });

    it('hides the highlight again once the user types', async () => {
      const user = setup();
      render(<Harness />);

      await user.click(screen.getByRole('combobox', { name: 'Hobbies' }));
      await user.keyboard('{ArrowDown}h');

      expect(drawnHighlight()).toBeUndefined();
    });

    it('draws it from the start with the enableEnterToSelect opt-in', async () => {
      const user = setup();
      render(
        <MultipleSelector
          options={options}
          enableEnterToSelect
          aria-label="Hobbies"
        />
      );

      await user.click(screen.getByRole('combobox', { name: 'Hobbies' }));

      expect(drawnHighlight()).toHaveTextContent('Reading');
    });
  });

  it('keeps focus in the field when Escape closes the list, and reopens on ArrowDown', async () => {
    const user = setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Hobbies' });

    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });
});
