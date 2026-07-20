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

  describe('long label wrapping inside a grid column', () => {
    /**
     * Regression test: in a fixed-column grid layout (see
     * vacancy-id-edit-jd-page.tsx / template-form-body.tsx), a flex/grid
     * item's default min-width is content-based, so a long, largely
     * unbreakable label (e.g. "License/Certification") would overflow past
     * its own column and get visually covered by the next field's toggle
     * instead of wrapping. `min-w-0` lets the item shrink to the column's
     * width, and `wrap-anywhere` (unlike `wrap-break-word`) actually reduces
     * the text's min-content size so it wraps instead of overflowing.
     */
    it('lets the row shrink below the label content width', () => {
      render(
        <FieldToggle
          label="Name of the License/Certification"
          checked
          onToggle={onToggle}
        />
      );

      const label = screen.getByText('Name of the License/Certification');
      expect(label).toHaveClass('min-w-0');
      expect(label).toHaveClass('wrap-anywhere');
      expect(label.parentElement).toHaveClass('min-w-0');
    });
  });
});
