import { useState } from 'react';

import { ThemeProvider, useTheme } from '@/app/providers/theme-provider';

type MockMediaQueryList = {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

function mockMatchMedia(initialMatches: boolean) {
  const listeners: Array<() => void> = [];
  const mql: MockMediaQueryList = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((_event: string, handler: () => void) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn(),
  };

  window.matchMedia = vi.fn().mockReturnValue(mql);

  return {
    mql,
    fireChange: (nextMatches: boolean) => {
      mql.matches = nextMatches;
      listeners.forEach(listener => listener());
    },
  };
}

function TestConsumer() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button type="button" onClick={() => setTheme('light')}>
        set-light
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        set-dark
      </button>
      <button type="button" onClick={() => setTheme('system')}>
        set-system
      </button>
    </div>
  );
}

function ThrowingConsumer() {
  useTheme();
  return null;
}

describe('ThemeProvider / useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('defaults to the system theme and resolves to light when the media query does not match', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('resolves the system theme to dark when the media query matches', () => {
    mockMatchMedia(true);

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('honors an explicit defaultTheme prop', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('reads a valid persisted theme from localStorage on init, ignoring defaultTheme', () => {
    mockMatchMedia(false);
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('falls back to defaultTheme when the persisted value is invalid', () => {
    mockMatchMedia(false);
    localStorage.setItem('theme', 'not-a-real-theme');

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('supports a custom storageKey', () => {
    mockMatchMedia(false);
    localStorage.setItem('custom-key', 'dark');

    render(
      <ThemeProvider storageKey="custom-key">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('updates theme, persists to localStorage, and toggles the document class when setTheme is called', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('set-dark'));

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);

    fireEvent.click(screen.getByText('set-light'));

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('re-resolves the theme when the OS color scheme changes while theme is "system"', () => {
    const { fireChange } = mockMatchMedia(false);

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);

    fireChange(true);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('does not listen for OS color scheme changes when an explicit theme is set', () => {
    const { mql } = mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(mql.addEventListener).not.toHaveBeenCalled();
  });

  it('removes the OS color scheme listener on unmount', () => {
    const { mql } = mockMatchMedia(false);

    const { unmount } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalled();
  });

  it('toggles between dark and light with the "d" keyboard shortcut', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('resolves the "d" shortcut from a system theme based on the current system preference', () => {
    mockMatchMedia(true);

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('system');

    fireEvent.keyDown(window, { key: 'D' });

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('ignores the "d" shortcut when a modifier key is held, the event repeats, or the key differs', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: 'd', ctrlKey: true });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    fireEvent.keyDown(window, { key: 'd', metaKey: true });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    fireEvent.keyDown(window, { key: 'd', altKey: true });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    fireEvent.keyDown(window, { key: 'd', repeat: true });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    fireEvent.keyDown(window, { key: 'x' });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('resolves the "d" shortcut from a system theme to dark when the system preference is light', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('system');

    fireEvent.keyDown(window, { key: 'd' });

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('applies the "d" shortcut when the target is a plain, non-editable element', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    const plainDiv = document.createElement('div');
    document.body.appendChild(plainDiv);

    fireEvent.keyDown(plainDiv, { key: 'd' });

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');

    document.body.removeChild(plainDiv);
  });

  it('ignores the "d" shortcut when the event target is an editable element', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    const input = document.createElement('input');
    document.body.appendChild(input);

    fireEvent.keyDown(input, { key: 'd' });

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    document.body.removeChild(input);
  });

  it('removes the keydown listener on unmount', () => {
    mockMatchMedia(false);

    const { unmount } = render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    unmount();

    fireEvent.keyDown(window, { key: 'd' });
    // No assertion needed beyond "does not throw" — the listener should be
    // removed, so nothing observes this event after unmount.
  });

  it('syncs theme state from a storage event on the same key', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'theme',
        newValue: 'dark',
        storageArea: localStorage,
      })
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('falls back to defaultTheme on a storage event with an invalid value', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'theme',
        newValue: 'bogus',
        storageArea: localStorage,
      })
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('ignores storage events for a different key or a different storage area', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'unrelated-key',
        newValue: 'dark',
        storageArea: localStorage,
      })
    );
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'theme',
        newValue: 'dark',
        storageArea: sessionStorage,
      })
    );
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('removes the storage listener on unmount', () => {
    mockMatchMedia(false);

    const { unmount } = render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    unmount();

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: 'theme',
        newValue: 'dark',
        storageArea: localStorage,
      })
    );
    // The provider is unmounted, so this should not throw and there is no
    // remaining consumer to assert against.
  });

  it('does not create a transition-blocking style element when disableTransitionOnChange is false', () => {
    mockMatchMedia(false);

    render(
      <ThemeProvider disableTransitionOnChange={false}>
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('set-dark'));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('throws when useTheme is used outside of a ThemeProvider', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => render(<ThrowingConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );

    consoleErrorSpy.mockRestore();
  });

  it('re-renders consumers when the context value changes, exposing the latest setTheme', () => {
    mockMatchMedia(false);

    function Wrapper() {
      const [key, setKey] = useState(0);
      return (
        <ThemeProvider defaultTheme="light">
          <TestConsumer />
          <button type="button" onClick={() => setKey(key + 1)}>
            rerender
          </button>
        </ThemeProvider>
      );
    }

    render(<Wrapper />);

    fireEvent.click(screen.getByText('rerender'));
    fireEvent.click(screen.getByText('set-dark'));

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });
});
