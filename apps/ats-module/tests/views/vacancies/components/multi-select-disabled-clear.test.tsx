import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MultipleSelector, {
  type Option,
} from '@cgp/ui-kit/components/multi-select';

// `@cgp/ui-kit/components/multi-select` is the shared "select or add" combobox
// used by every "Preferred X" vacancy-creation step (Industries, Causes,
// Hobbies, Skills, etc). Each step mocks it out in its own test file, so this
// regression (DQCGP-2866) is covered here instead, against the real component,
// the way its consumers actually use it: `disabled` flips to `true` when the
// step's section toggle turns off.

function Harness({ initialDisabled = false }: { initialDisabled?: boolean }) {
  const [disabled, setDisabled] = useState(initialDisabled);
  const [value, setValue] = useState<Option[]>([]);

  return (
    <div>
      <button type="button" onClick={() => setDisabled(true)}>
        disable
      </button>
      <MultipleSelector
        value={value}
        onChange={setValue}
        options={[{ value: 'ind-1', label: 'Healthcare' }]}
        disabled={disabled}
        creatable
        placeholder="Search"
      />
    </div>
  );
}

describe('MultipleSelector — clears typed input when disabled', () => {
  it('removes uncommitted typed text once the field becomes disabled', async () => {
    // The combobox's Popover is `modal`, which makes Radix mark the rest of
    // the document `pointer-events: none` while open — harmless in a real
    // browser (typing only needs keyboard events) but userEvent.type()'s
    // internal focus click trips its pointer-events guard against that.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Harness />);

    const input = screen.getByTestId('form-combobox-input');
    await user.click(input);
    await user.type(input, 'Hospitality');
    expect(input).toHaveValue('Hospitality');

    await user.click(screen.getByText('disable'));

    expect(input).toHaveValue('');
  });
});
