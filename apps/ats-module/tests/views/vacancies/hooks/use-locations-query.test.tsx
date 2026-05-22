import { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderHook, waitFor } from '@testing-library/react';

import { beforeEach, describe, expect, it } from 'vitest';

import { useLocationsQuery } from '@/views/vacancies/hooks/use-locations-query';

describe('useLocationsQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('should return empty array initially', async () => {
    const { result } = renderHook(() => useLocationsQuery(''), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('should return all locations when search is empty', async () => {
    const { result } = renderHook(() => useLocationsQuery(''), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.length).toBeGreaterThan(0);
  });

  it('should filter locations by search query', async () => {
    const { result } = renderHook(() => useLocationsQuery('United'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.length).toBeGreaterThan(0);
    expect(result.current.data.some(loc => loc.label.includes('United'))).toBe(
      true
    );
  });

  it('should return empty array for non-matching search', async () => {
    const { result } = renderHook(() => useLocationsQuery('XYZ123'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.length).toBe(0);
  });

  it('should have id and label properties', async () => {
    const { result } = renderHook(() => useLocationsQuery(''), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.data.forEach(location => {
      expect(location).toHaveProperty('id');
      expect(location).toHaveProperty('label');
      expect(typeof location.id).toBe('string');
      expect(typeof location.label).toBe('string');
    });
  });

  it('should be case-insensitive in search', async () => {
    const { result } = renderHook(() => useLocationsQuery('united states'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.length).toBeGreaterThan(0);
  });

  it('should not have errors', async () => {
    const { result } = renderHook(() => useLocationsQuery(''), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });
});
