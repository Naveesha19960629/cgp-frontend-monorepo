import { useState } from 'react';

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import { Combobox } from '@cgp/ui-kit/components/combobox';
import MultipleSelector, {
  type Option,
} from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import {
  SELECT_CLEAR_VALUE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cgp/ui-kit/components/ui/select';
import { createDateClearHandler } from '@cgp/ui-kit/lib/keyboard-actions';

// DQCGP-4310 — ATS NFR-024: Backspace or Delete clears a date or dropdown
// selection. The other keyboard specs focus each field programmatically;
// these start the way people do, by clicking the field, which opens the
// calendar or list first. Real Radix, cmdk and react-day-picker throughout.

const KEYS = ['{Backspace}', '{Delete}'];
const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ── Date picker ─────────────────────────────────────────────────────────────

const SELECTED = new Date(2024, 5, 12);

/** The trigger, popover and calendar wiring every ATS date step uses. */
function DateHarness({ initial = SELECTED }: { initial?: Date }) {
  const [date, setDate] = useState<Date | undefined>(initial);
  const [open, setOpen] = useState(false);
  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          onKeyDown={createDateClearHandler({
            hasValue: !!date,
            isOpen: open,
            onClear: () => setDate(undefined),
          })}
        >
          {date ? date.toDateString() : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Choose date">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={next => {
            setDate(next);
            setOpen(false);
          }}
          captionLayout="dropdown"
          startMonth={new Date(2000, 0)}
          endMonth={new Date(2030, 11)}
        />
      </PopoverContent>
    </Popover>
  );
}

const dateTrigger = () =>
  screen.getByRole('button', { name: /Pick a date|2024/ });

describe('Date picker — Backspace / Delete', () => {
  it.each(KEYS)(
    'clears with %s from the open calendar and closes it',
    async key => {
      const user = setup();
      render(<DateHarness />);
      const trigger = dateTrigger();

      await user.click(trigger);
      expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeVisible();

      await user.keyboard(key);

      expect(trigger).toHaveTextContent('Pick a date');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      // Radix hands focus back to the trigger (WCAG 2.4.3).
      expect(trigger).toHaveFocus();
    }
  );

  it('clears from a focused day in the grid', async () => {
    const user = setup();
    render(<DateHarness />);

    await user.click(dateTrigger());
    const grid = screen.getByRole('grid');
    const selectedDay = within(grid)
      .getAllByRole('button')
      .find(b => b.closest('[aria-selected="true"]'));
    act(() => selectedDay?.focus());
    await user.keyboard('{Delete}');

    expect(dateTrigger()).toHaveTextContent('Pick a date');
  });

  it.each(KEYS)('clears with %s on the focused, closed trigger', async key => {
    const user = setup();
    render(<DateHarness />);
    const trigger = dateTrigger();

    trigger.focus();
    await user.keyboard(key);

    expect(trigger).toHaveTextContent('Pick a date');
    expect(trigger).toHaveFocus();
  });

  it('leaves arrow-key day navigation alone', async () => {
    const user = setup();
    render(<DateHarness />);

    await user.click(dateTrigger());
    const grid = screen.getByRole('grid');
    const selectedDay = within(grid)
      .getAllByRole('button')
      .find(b => b.closest('[aria-selected="true"]'));
    act(() => selectedDay?.focus());
    await user.keyboard('{ArrowRight}{Enter}');

    expect(dateTrigger()).toHaveTextContent(
      new Date(2024, 5, 13).toDateString()
    );
  });
});

// ── Combobox ────────────────────────────────────────────────────────────────

const cities = [
  { value: 'city-1', label: 'Aachen' },
  { value: 'city-2', label: 'Berlin' },
];

function ComboboxHarness({
  onValueChange,
}: {
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState('city-1');
  return (
    <Combobox
      aria-label="City"
      options={cities}
      value={value}
      onValueChange={next => {
        setValue(next);
        onValueChange?.(next);
      }}
      placeholder="Search"
    />
  );
}

describe('Combobox — Backspace / Delete', () => {
  it('clears with Delete after a click opens the list, and keeps it open', async () => {
    const user = setup();
    const onValueChange = vi.fn();
    render(<ComboboxHarness onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'City' });

    await user.click(input);
    expect(input).toHaveValue('Aachen');
    await user.keyboard('{Delete}');

    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    // The full list is back so another city can be picked straight away.
    expect(screen.getAllByRole('option')).toHaveLength(cities.length);
  });

  it('erases one character with Backspace after a click, as text editing does', async () => {
    const user = setup();
    const onValueChange = vi.fn();
    render(<ComboboxHarness onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'City' });

    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(input).toHaveValue('Aache');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('edits typed search text as normal', async () => {
    const user = setup();
    const onValueChange = vi.fn();
    render(<ComboboxHarness onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'City' });

    await user.click(input);
    await user.keyboard('x{Backspace}');

    expect(input).toHaveValue('Aachen');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

// ── Select ──────────────────────────────────────────────────────────────────

function SelectHarness({ clearable = true }: { clearable?: boolean }) {
  const [value, setValue] = useState('married');
  return (
    <>
      <Select
        clearable={clearable}
        value={value}
        onValueChange={next =>
          setValue(next === SELECT_CLEAR_VALUE ? '' : next)
        }
      >
        <SelectTrigger aria-label="Marital status">
          <SelectValue placeholder="Select marital status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="single">Single</SelectItem>
          <SelectItem value="married">Married</SelectItem>
        </SelectContent>
      </Select>
      <output data-testid="value">{value}</output>
    </>
  );
}

const selectTrigger = () =>
  screen.getByRole('combobox', { name: 'Marital status' });

describe('Select — Backspace / Delete on a clearable field', () => {
  it.each(KEYS)(
    'clears with %s from the open list and closes it',
    async key => {
      const user = setup();
      render(<SelectHarness />);

      await user.click(selectTrigger());
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.keyboard(key);

      expect(screen.getByTestId('value')).toHaveTextContent('');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(selectTrigger()).toHaveTextContent('Select marital status');
      expect(selectTrigger()).toHaveFocus();
    }
  );

  it.each(KEYS)('clears with %s on the focused, closed trigger', async key => {
    const user = setup();
    render(<SelectHarness />);

    selectTrigger().focus();
    await user.keyboard(key);

    expect(screen.getByTestId('value')).toHaveTextContent('');
    expect(selectTrigger()).toHaveAttribute('data-placeholder');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('leaves a required (not clearable) field alone', async () => {
    const user = setup();
    render(<SelectHarness clearable={false} />);

    selectTrigger().focus();
    await user.keyboard('{Backspace}');
    await user.click(selectTrigger());
    await user.keyboard('{Delete}');

    expect(screen.getByTestId('value')).toHaveTextContent('married');
  });
});

// ── Multi-select ────────────────────────────────────────────────────────────

const hobbies: Option[] = [
  { value: 'reading', label: 'Reading' },
  { value: 'gaming', label: 'Gaming' },
];

describe('Multi-select — Backspace / Delete', () => {
  it.each(KEYS)('removes the last chip with %s after a click', async key => {
    const user = setup();
    const onChange = vi.fn();
    function Harness() {
      const [value, setValue] = useState<Option[]>(hobbies);
      return (
        <MultipleSelector
          aria-label="Hobbies"
          value={value}
          options={hobbies}
          onChange={next => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    }
    render(<Harness />);

    await user.click(screen.getByRole('combobox', { name: 'Hobbies' }));
    await user.keyboard(key);

    expect(onChange).toHaveBeenLastCalledWith([hobbies[0]]);
  });
});
