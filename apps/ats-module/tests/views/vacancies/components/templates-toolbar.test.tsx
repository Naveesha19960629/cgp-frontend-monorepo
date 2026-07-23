import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TemplatesToolbar from '@/views/vacancies/components/templates-toolbar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const defaultProps = {
  search: '',
  onSearchChange: vi.fn(),
  sortOrder: 'NEWEST' as const,
  onSortOrderChange: vi.fn(),
  onCreate: vi.fn(),
};

describe('TemplatesToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => vi.useRealTimers());

  it('renders the search input with the correct placeholder', () => {
    render(<TemplatesToolbar {...defaultProps} />);
    expect(
      screen.getByPlaceholderText('templates.searchPlaceholder')
    ).toBeInTheDocument();
  });

  it('reflects the search prop value in the input', () => {
    render(<TemplatesToolbar {...defaultProps} search="engineer" />);
    expect(
      screen.getByPlaceholderText('templates.searchPlaceholder')
    ).toHaveValue('engineer');
  });

  it('updates the input value when the search prop changes externally', () => {
    const { rerender } = render(<TemplatesToolbar {...defaultProps} />);
    rerender(<TemplatesToolbar {...defaultProps} search="updated" />);
    expect(
      screen.getByPlaceholderText('templates.searchPlaceholder')
    ).toHaveValue('updated');
  });

  it('renders the create button', () => {
    render(<TemplatesToolbar {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: 'templates.createButton' })
    ).toBeInTheDocument();
  });

  it('calls onCreate when the create button is clicked', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<TemplatesToolbar {...defaultProps} onCreate={onCreate} />);

    await user.click(
      screen.getByRole('button', { name: 'templates.createButton' })
    );

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('renders both sort options when the dropdown is opened', async () => {
    const user = userEvent.setup();
    render(<TemplatesToolbar {...defaultProps} />);

    await user.click(screen.getByRole('combobox'));

    expect(
      screen.getByRole('option', { name: 'templates.sort.newest' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'templates.sort.oldest' })
    ).toBeInTheDocument();
  });

  it('debounces onSearchChange when the user types', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    render(
      <TemplatesToolbar {...defaultProps} onSearchChange={onSearchChange} />
    );
    const input = screen.getByPlaceholderText('templates.searchPlaceholder');

    fireEvent.change(input, { target: { value: 'react' } });

    expect(onSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onSearchChange).toHaveBeenCalledWith('react');
  });

  it('resets the debounce timer on further typing before it fires', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    render(
      <TemplatesToolbar {...defaultProps} onSearchChange={onSearchChange} />
    );
    const input = screen.getByPlaceholderText('templates.searchPlaceholder');

    fireEvent.change(input, { target: { value: 'rea' } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.change(input, { target: { value: 'react' } });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith('react');
  });

  it('sanitizes typed input by trimming leading spaces and collapsing repeated spaces', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    render(
      <TemplatesToolbar {...defaultProps} onSearchChange={onSearchChange} />
    );
    const input = screen.getByPlaceholderText('templates.searchPlaceholder');

    fireEvent.change(input, { target: { value: '  react   dev' } });

    expect(input).toHaveValue('react dev');

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onSearchChange).toHaveBeenCalledWith('react dev');
  });

  it('calls onSearchChange immediately with the trimmed value on blur', () => {
    const onSearchChange = vi.fn();
    render(
      <TemplatesToolbar {...defaultProps} onSearchChange={onSearchChange} />
    );
    const input = screen.getByPlaceholderText('templates.searchPlaceholder');

    fireEvent.change(input, { target: { value: 'fast' } });
    fireEvent.blur(input);

    expect(onSearchChange).toHaveBeenCalledWith('fast');
  });

  it('trims trailing whitespace on blur', () => {
    const onSearchChange = vi.fn();
    render(
      <TemplatesToolbar {...defaultProps} onSearchChange={onSearchChange} />
    );
    const input = screen.getByPlaceholderText('templates.searchPlaceholder');

    fireEvent.change(input, { target: { value: 'fast' } });
    fireEvent.blur(input);
    onSearchChange.mockClear();

    fireEvent.change(input, { target: { value: 'fast ' } });
    fireEvent.blur(input);

    expect(onSearchChange).toHaveBeenCalledWith('fast');
  });

  it('calls onSortOrderChange when a different sort option is selected', async () => {
    const user = userEvent.setup();
    const onSortOrderChange = vi.fn();
    render(
      <TemplatesToolbar
        {...defaultProps}
        onSortOrderChange={onSortOrderChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('templates.sort.oldest'));

    expect(onSortOrderChange).toHaveBeenCalledWith('OLDEST');
  });

  it('cleans up the debounce timer on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = render(<TemplatesToolbar {...defaultProps} />);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
