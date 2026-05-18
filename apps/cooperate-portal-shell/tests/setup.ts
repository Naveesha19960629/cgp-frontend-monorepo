import '@testing-library/jest-dom';
import * as RTL from '@testing-library/react';

// Make @testing-library/react utilities available as globals
// so test files don't need to import them individually
Object.assign(globalThis, RTL);

// jsdom does not implement window.matchMedia. Provide a minimal mock so
// components that call it (LandscapeBlocker, Toaster, etc.) don't throw.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
