import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import { LocationAutocomplete } from '@cgp/ui-kit/components/location-autocomplete';
import { CalendarWithTime } from '@cgp/ui-kit/components/ui/calendar-with-time';

// DQCGP-4310 — ATS NFR-024 on the two pickers the Vacancy steps build
// themselves: the Schedule step's date-time picker and the dialogs' location
// autocomplete. Real Radix, react-day-picker and Base UI.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

// ── Date-time picker ────────────────────────────────────────────────────────

function DateTimeHarness({ clearable = true }: { clearable?: boolean }) {
  const [date, setDate] = useState('2099-12-25');
  const [time, setTime] = useState('10:00:00');
  return (
    <>
      <CalendarWithTime
        dateValue={date}
        onDateChange={setDate}
        timeValue={time}
        onTimeChange={setTime}
        timeLabel="Publish time"
        dateButtonPlaceholder="Pick a date"
        startMonth={new Date(2099, 0)}
        endMonth={new Date(2100, 11)}
        formattedDateDisplay={date ? `${date} ${time}` : undefined}
        onClear={
          clearable
            ? () => {
                setDate('');
                setTime('');
              }
            : undefined
        }
      />
      <output data-testid="value">{`${date}|${time}`}</output>
    </>
  );
}

const dateTimeTrigger = () =>
  screen.getByRole('button', { name: /2099-12-25|Pick a date/ });

describe('CalendarWithTime — Backspace / Delete clear date and time', () => {
  it.each(['{Backspace}', '{Delete}'])(
    'clears both with %s on the focused, closed field',
    async key => {
      const user = setup();
      render(<DateTimeHarness />);
      const trigger = dateTimeTrigger();

      trigger.focus();
      await user.keyboard(key);

      expect(screen.getByTestId('value')).toHaveTextContent('|');
      expect(trigger).toHaveTextContent('Pick a date');
      expect(trigger).toHaveFocus();
    }
  );

  it('clears both from the open calendar, closes it and returns focus', async () => {
    const user = setup();
    render(<DateTimeHarness />);
    const trigger = dateTimeTrigger();

    await user.click(trigger);
    expect(
      screen.getByRole('dialog', { name: 'common.a11y.chooseDateTime' })
    ).toBeInTheDocument();
    await user.keyboard('{Delete}');

    expect(screen.getByTestId('value')).toHaveTextContent('|');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('leaves the time input to ordinary editing', async () => {
    const user = setup();
    render(<DateTimeHarness />);

    await user.click(dateTimeTrigger());
    screen.getByLabelText('Publish time').focus();
    await user.keyboard('{Backspace}');

    expect(screen.getByTestId('value')).toHaveTextContent(/^2099-12-25\|/);
  });

  it('does nothing when the caller gives no onClear', async () => {
    const user = setup();
    render(<DateTimeHarness clearable={false} />);

    dateTimeTrigger().focus();
    await user.keyboard('{Delete}');

    expect(screen.getByTestId('value')).toHaveTextContent(
      '2099-12-25|10:00:00'
    );
  });
});

// ── Location autocomplete ───────────────────────────────────────────────────

const LOCATIONS = [
  { id: 'cmb', label: 'Colombo, Sri Lanka' },
  { id: 'kdy', label: 'Kandy, Sri Lanka' },
];

function LocationHarness() {
  const [value, setValue] = useState(LOCATIONS[0]);
  return (
    <>
      <LocationAutocomplete
        options={LOCATIONS}
        value={value}
        onSearchChange={vi.fn()}
        onSelect={setValue}
        placeholder="Location"
      />
      <output data-testid="location">{value.id}</output>
    </>
  );
}

const locationInput = () => screen.getByPlaceholderText('Location');

describe('LocationAutocomplete — Backspace / Delete', () => {
  it('clears the location with Delete while it is untouched', async () => {
    const user = setup();
    render(<LocationHarness />);

    locationInput().focus();
    await user.keyboard('{Delete}');

    expect(screen.getByTestId('location')).toBeEmptyDOMElement();
    expect(locationInput()).toHaveValue('');
  });

  it('erases one character with Backspace and keeps the location', async () => {
    const user = setup();
    render(<LocationHarness />);

    await user.click(locationInput());
    await user.keyboard('{End}{Backspace}');

    expect(locationInput()).toHaveValue('Colombo, Sri Lank');
    expect(screen.getByTestId('location')).toHaveTextContent('cmb');
  });

  it('clears the location once its text is erased', async () => {
    const user = setup();
    render(<LocationHarness />);

    await user.clear(locationInput());

    expect(screen.getByTestId('location')).toBeEmptyDOMElement();
  });
});
