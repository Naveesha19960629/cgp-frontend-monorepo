import { fireEvent, render, screen } from '@testing-library/react';

import { Input } from '@cgp/ui-kit/components/ui/input';
import { Textarea } from '@cgp/ui-kit/components/ui/textarea';

describe('Input and Textarea sanitization', () => {
  it('removes emoji from Input value', () => {
    render(<Input aria-label="plain-input" />);

    const input = screen.getByLabelText('plain-input');
    fireEvent.change(input, { target: { value: 'Hello😀 World🎓' } });

    expect(input).toHaveValue('Hello World');
  });

  it('passes sanitized Input value to onChange', () => {
    const capturedValues: string[] = [];
    const handleChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      capturedValues.push(event.target.value);
    });
    render(<Input aria-label="input-with-handler" onChange={handleChange} />);

    const input = screen.getByLabelText('input-with-handler');
    fireEvent.change(input, { target: { value: 'Job🚀 Title' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(capturedValues).toEqual(['Job Title']);
  });

  it('removes emoji from Textarea value', () => {
    render(<Textarea aria-label="plain-textarea" />);

    const textarea = screen.getByLabelText('plain-textarea');
    fireEvent.change(textarea, { target: { value: 'Result✅ line🙂' } });

    expect(textarea).toHaveValue('Result line');
  });

  it('passes sanitized Textarea value to onChange', () => {
    const capturedValues: string[] = [];
    const handleChange = vi.fn(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        capturedValues.push(event.target.value);
      }
    );
    render(
      <Textarea aria-label="textarea-with-handler" onChange={handleChange} />
    );

    const textarea = screen.getByLabelText('textarea-with-handler');
    fireEvent.change(textarea, { target: { value: 'Notes📝 text' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(capturedValues).toEqual(['Notes text']);
  });
});
