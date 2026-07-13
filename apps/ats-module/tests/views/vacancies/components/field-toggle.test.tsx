import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FieldToggle from '@/views/vacancies/components/field-toggle';

describe('FieldToggle', () => {
  const onToggle = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders the field label', () => {
    render(<FieldToggle label="School" checked onToggle={onToggle} />);
    expect(screen.getByText('School')).toBeInTheDocument();
  });

  it('reflects a checked state on the switch', () => {
    render(<FieldToggle label="School" checked onToggle={onToggle} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('reflects an unchecked state on the switch', () => {
    render(<FieldToggle label="School" checked={false} onToggle={onToggle} />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('calls onToggle with true when an unchecked switch is clicked', async () => {
    const user = userEvent.setup();
    render(<FieldToggle label="School" checked={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('calls onToggle with false when a checked switch is clicked', async () => {
    const user = userEvent.setup();
    render(<FieldToggle label="School" checked onToggle={onToggle} />);
    await user.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('disables the switch and does not call onToggle when disabled', async () => {
    const user = userEvent.setup();
    render(<FieldToggle label="School" checked disabled onToggle={onToggle} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
    await user.click(toggle);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
