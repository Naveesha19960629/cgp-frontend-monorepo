import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Combobox } from '@cgp/ui-kit/components/combobox';

// `@cgp/ui-kit/components/combobox` is the shared "Searchable Dropdown" used
// by Profile Requirements' City/State/Country fields (and other vacancy
// steps). Each step mocks it out in its own test file, so the
// Backspace-to-clear accessibility behaviour (DQCGP-3292) is covered here
// instead, against the real component.

function Harness() {
  const [value, setValue] = useState('city-1');

  return (
    <Combobox
      options={[{ value: 'city-1', label: 'Aachen' }]}
      value={value}
      onValueChange={setValue}
      placeholder="Search"
    />
  );
}

describe('Combobox — Backspace clears a previously selected value', () => {
  it('clears the selection when Backspace is pressed while the field is closed', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Harness />);

    const input = screen.getByTestId('form-combobox-input');
    expect(input).toHaveValue('Aachen');

    input.focus();
    await user.keyboard('{Backspace}');

    expect(input).toHaveValue('');
  });

  it('lets the user edit the search text before it clears the selection', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Harness />);

    const input = screen.getByTestId('form-combobox-input');
    await user.click(input);
    expect(input).toHaveValue('Aachen');

    await user.keyboard('{Backspace}');

    // One character removed from the open search text — not cleared yet.
    expect(input).not.toHaveValue('');
  });

  it('does nothing when Backspace is pressed on an already-empty field', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Combobox
        options={[{ value: 'city-1', label: 'Aachen' }]}
        value=""
        onValueChange={vi.fn()}
        placeholder="Search"
      />
    );

    const input = screen.getByTestId('form-combobox-input');
    input.focus();
    await user.keyboard('{Backspace}');

    expect(input).toHaveValue('');
  });
});
