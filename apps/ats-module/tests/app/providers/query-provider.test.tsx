import { useQueryClient } from '@tanstack/react-query';

import { screen } from '@testing-library/react';

import { QueryProvider } from '@/app/providers/query-provider';

function QueryClientConsumer() {
  const queryClient = useQueryClient();
  const defaultOptions = queryClient.getDefaultOptions();

  return (
    <div data-testid="consumer">
      <span data-testid="stale-time">
        {defaultOptions.queries?.staleTime as number}
      </span>
      <span data-testid="retry">{String(defaultOptions.queries?.retry)}</span>
    </div>
  );
}

describe('QueryProvider', () => {
  it('renders its children', () => {
    render(
      <QueryProvider>
        <span>child content</span>
      </QueryProvider>
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders multiple children passed through', () => {
    render(
      <QueryProvider>
        <span>first</span>
        <span>second</span>
      </QueryProvider>
    );

    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('supplies a QueryClient instance with the configured default options', () => {
    render(
      <QueryProvider>
        <QueryClientConsumer />
      </QueryProvider>
    );

    expect(screen.getByTestId('consumer')).toBeInTheDocument();
    expect(screen.getByTestId('stale-time')).toHaveTextContent(
      String(1000 * 60 * 5)
    );
    expect(screen.getByTestId('retry')).toHaveTextContent('1');
  });
});
