import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import { Combobox } from '@cgp/ui-kit/components/combobox';

// DQCGP-4310 — keyboard accessibility (ATS NFR-024). Runs against
// the real cmdk and Radix Popover: combobox.test.tsx mocks both, so it cannot
// see whether the arrow keys actually reach the option list.

const options = [
  { value: 'de', label: 'Germany' },
  { value: 'lk', label: 'Sri Lanka' },
  { value: 'se', label: 'Sweden' },
];

function Harness({
  initial = '',
  onChange,
}: {
  initial?: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="country">Country</label>
      <Combobox
        id="country"
        aria-describedby="country-error"
        options={options}
        value={value}
        onValueChange={next => {
          setValue(next);
          onChange?.(next);
        }}
        placeholder="Search"
        addable={false}
      />
      <p id="country-error">Required</p>
    </>
  );
}

const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('Combobox — keyboard accessibility', () => {
  it('is labelled and described by its form field', () => {
    render(<Harness />);

    const input = screen.getByRole('combobox', { name: 'Country' });
    expect(input).toHaveAccessibleDescription('Required');
  });

  it('opens on ArrowDown and exposes the list and active option', async () => {
    const user = setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Country' });

    input.focus();
    await user.keyboard('{ArrowDown}');

    expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    const activeId = input.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    expect(document.getElementById(activeId!)).toHaveTextContent('Germany');
  });

  it('moves the highlight with the arrow keys and selects with Enter', async () => {
    const user = setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Country' });

    input.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const activeId = input.getAttribute('aria-activedescendant');
    expect(document.getElementById(activeId!)).toHaveTextContent('Sri Lanka');

    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('lk');
    expect(input).toHaveValue('Sri Lanka');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    // WCAG 2.4.3: DOM focus never left the field.
    expect(input).toHaveFocus();
  });

  it('draws the highlight on the row Enter will pick (WCAG 2.4.7)', async () => {
    const user = setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Country' });

    input.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');

    const active = document.getElementById(
      input.getAttribute('aria-activedescendant')!
    );
    expect(active).toHaveTextContent('Sri Lanka');
    expect(active).toHaveAttribute('data-selected', 'true');
    expect(active).toHaveClass('data-[selected=true]:bg-neutral-100');
    expect(
      screen
        .getAllByRole('option')
        .filter(option => option.getAttribute('data-selected') === 'true')
    ).toHaveLength(1);
  });

  it('wraps from the first option to the last on ArrowUp', async () => {
    const user = setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Country' });

    input.focus();
    await user.keyboard('{ArrowDown}{ArrowUp}');

    const activeId = input.getAttribute('aria-activedescendant');
    expect(document.getElementById(activeId!)).toHaveTextContent('Sweden');
  });

  it('starts the highlight on the current value when reopened', async () => {
    const user = setup();
    render(<Harness initial="se" />);
    const input = screen.getByRole('combobox', { name: 'Country' });

    input.focus();
    await user.keyboard('{ArrowDown}');

    const activeId = input.getAttribute('aria-activedescendant');
    expect(document.getElementById(activeId!)).toHaveTextContent('Sweden');
  });

  it('types a space into the search instead of selecting', async () => {
    const user = setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Country' });

    await user.type(input, 'Sri ');

    expect(input).toHaveValue('Sri ');
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape without changing the value', async () => {
    const user = setup();
    const onChange = vi.fn();
    render(<Harness initial="de" onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Country' });

    input.focus();
    await user.keyboard('{ArrowDown}{Escape}');

    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveValue('Germany');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not let Enter submit the form while the list is closed', async () => {
    const user = setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Harness initial="de" />
      </form>
    );

    screen.getByRole('combobox', { name: 'Country' }).focus();
    await user.keyboard('{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  // NFR-024 within the ARIA APG editable combobox, where both keys edit text:
  // Delete deselects in one press while the value is untouched; Backspace
  // erases character by character and deselects once the box is empty.
  it('announces a form error without painting the red border; only isError does', () => {
    const { rerender } = render(
      <Combobox aria-label="City" aria-invalid options={options} value="" />
    );
    const input = screen.getByRole('combobox', { name: 'City' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).not.toHaveClass('border-destructive');

    rerender(<Combobox aria-label="City" isError options={options} value="" />);
    expect(input).toHaveClass('border-destructive');
  });

  describe('Backspace / Delete (NFR-024)', () => {
    it('clears the selection with Delete while the list is closed', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness initial="de" onChange={onChange} />);
      const input = screen.getByRole('combobox', { name: 'Country' });
      expect(input).toHaveValue('Germany');

      input.focus();
      await user.keyboard('{Delete}');

      expect(onChange).toHaveBeenCalledWith('');
      expect(input).toHaveValue('');
    });

    it('clears the untouched value with Delete when a click has opened the list', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness initial="de" onChange={onChange} />);
      const input = screen.getByRole('combobox', { name: 'Country' });

      await user.click(input);
      expect(input).toHaveValue('Germany');
      await user.keyboard('{Delete}');

      expect(onChange).toHaveBeenCalledWith('');
      expect(input).toHaveValue('');
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('erases one character with Backspace on the closed field and searches with the rest', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness initial="de" onChange={onChange} />);
      const input = screen.getByRole('combobox', { name: 'Country' });

      input.focus();
      await user.keyboard('{Backspace}');

      expect(input).toHaveValue('German');
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('deselects once Backspace has erased the whole value', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness initial="se" onChange={onChange} />);
      const input = screen.getByRole('combobox', { name: 'Country' });

      await user.click(input);
      await user.keyboard('{Backspace>5/}');
      expect(input).toHaveValue('S');
      expect(onChange).not.toHaveBeenCalled();

      await user.keyboard('{Backspace}');
      expect(input).toHaveValue('');
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('edits typed text with Delete instead of deselecting', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness initial="de" onChange={onChange} />);
      const input = screen.getByRole('combobox', { name: 'Country' });

      await user.click(input);
      await user.keyboard('x{ArrowLeft}{Delete}');

      expect(input).toHaveValue('Germany');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('edits typed search text as normal', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness initial="de" onChange={onChange} />);
      const input = screen.getByRole('combobox', { name: 'Country' });

      await user.click(input);
      await user.keyboard('x{Backspace}');

      expect(input).toHaveValue('Germany');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does nothing on an already-empty field', async () => {
      const user = setup();
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);

      screen.getByRole('combobox', { name: 'Country' }).focus();
      await user.keyboard('{Backspace}');

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
