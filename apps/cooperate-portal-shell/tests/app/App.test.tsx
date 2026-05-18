import { screen } from '@testing-library/react';

import App from '@/app/app';

// The real router uses createBrowserRouter with a lazy federated module
// (ats-module/AtsRoutes). Mock the router module so tests are isolated
// from remote micro-frontend modules and browser-history dependencies.
vi.mock('@/app/router', async () => {
  const { createMemoryRouter } = await import('react-router-dom');
  return {
    default: createMemoryRouter([
      {
        path: '*',
        element: <div data-testid="shell-content">Shell Content</div>,
      },
    ]),
  };
});

// React Query's QueryClientProvider relies on useEffect which throws when
// react and react-dom resolve to different patch versions (19.2.6 vs 19.2.5).
// Use a pass-through wrapper so the test doesn't depend on the real provider.
vi.mock('@cgp/data-access', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  queryClient: null,
}));

describe('App', () => {
  it('mounts without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('shell-content')).toBeInTheDocument();
  });
});
