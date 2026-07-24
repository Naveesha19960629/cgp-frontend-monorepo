import type { ReactNode } from 'react';

import { UserProvider, useUser } from '@/app/contexts/user-context';

const useKeycloakMock = vi.fn();
const setTokenGetterMock = vi.fn();

vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => useKeycloakMock() as unknown,
}));

vi.mock('@cgp/data-access', () => ({
  setTokenGetter: (getter: () => Promise<string | null>) => {
    setTokenGetterMock(getter);
  },
}));

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <UserProvider>{children}</UserProvider>;
}

describe('user-context', () => {
  beforeEach(() => {
    useKeycloakMock.mockReset();
    setTokenGetterMock.mockReset();
  });

  it('throws when useUser is called outside a UserProvider', () => {
    // Suppress the expected React error boundary console noise.
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => renderHook(() => useUser())).toThrow(
      'useUser must be used within a UserProvider'
    );

    consoleErrorSpy.mockRestore();
  });

  it('keeps user null while keycloak is not yet initialized', async () => {
    useKeycloakMock.mockReturnValue({
      keycloak: { authenticated: false, tokenParsed: {} },
      initialized: false,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
    // The token-getter interceptor is only wired up once initialized.
    expect(setTokenGetterMock).not.toHaveBeenCalled();
  });

  it('sets user to null when initialized but not authenticated', async () => {
    useKeycloakMock.mockReturnValue({
      keycloak: { authenticated: false, tokenParsed: {} },
      initialized: true,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
    expect(setTokenGetterMock).toHaveBeenCalledTimes(1);
  });

  it('derives a full user object from tokenParsed when authenticated, using given_name/family_name fallbacks', async () => {
    useKeycloakMock.mockReturnValue({
      keycloak: {
        authenticated: true,
        tokenParsed: {
          sub: 'user-1',
          email: 'jane.doe@example.com',
          email_verified: true,
          name: 'Jane Doe',
          given_name: 'Jane',
          family_name: 'Doe',
          preferred_username: 'jane.doe',
          salutation: 'Ms.',
          phone_number: '+123456',
          picture: 'https://example.com/pic.png',
        },
        token: 'token-abc',
        updateToken: vi.fn().mockResolvedValue(true),
        logout: vi.fn(),
      },
      initialized: true,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    expect(result.current.user).toEqual({
      id: 'user-1',
      email: 'jane.doe@example.com',
      emailVerified: true,
      name: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      givenName: 'Jane',
      familyName: 'Doe',
      preferredUsername: 'jane.doe',
      salutation: 'Ms.',
      phoneNumber: '+123456',
      picture: 'https://example.com/pic.png',
    });
  });

  it('prefers first_name/last_name over given_name/family_name when both are present', async () => {
    useKeycloakMock.mockReturnValue({
      keycloak: {
        authenticated: true,
        tokenParsed: {
          sub: 'user-2',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Smith',
          given_name: 'given-John',
          family_name: 'given-Smith',
        },
        token: 'token-xyz',
        updateToken: vi.fn().mockResolvedValue(true),
        logout: vi.fn(),
      },
      initialized: true,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    expect(result.current.user?.firstName).toBe('John');
    expect(result.current.user?.lastName).toBe('Smith');
    expect(result.current.user?.emailVerified).toBe(false);
    expect(result.current.user?.salutation).toBeUndefined();
    expect(result.current.user?.phoneNumber).toBeUndefined();
    expect(result.current.user?.picture).toBeUndefined();
  });

  it('calls keycloak.logout and resolves null when updateToken rejects inside the interceptor', async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined);
    const updateTokenMock = vi.fn().mockRejectedValue(new Error('expired'));

    useKeycloakMock.mockReturnValue({
      keycloak: {
        authenticated: true,
        tokenParsed: { sub: 'user-3' },
        token: 'token-123',
        updateToken: updateTokenMock,
        logout: logoutMock,
      },
      initialized: true,
    });

    renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(setTokenGetterMock).toHaveBeenCalledTimes(1);
    });

    const capturedGetter = setTokenGetterMock.mock.calls[0][0] as () => Promise<
      string | null
    >;

    const token = await capturedGetter();

    expect(updateTokenMock).toHaveBeenCalledWith(30);
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(token).toBeNull();
  });

  it('resolves the token from keycloak.token when updateToken succeeds', async () => {
    const logoutMock = vi.fn();
    const updateTokenMock = vi.fn().mockResolvedValue(true);

    useKeycloakMock.mockReturnValue({
      keycloak: {
        authenticated: true,
        tokenParsed: { sub: 'user-4' },
        token: 'live-token',
        updateToken: updateTokenMock,
        logout: logoutMock,
      },
      initialized: true,
    });

    renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(setTokenGetterMock).toHaveBeenCalledTimes(1);
    });

    const capturedGetter = setTokenGetterMock.mock.calls[0][0] as () => Promise<
      string | null
    >;

    const token = await capturedGetter();

    expect(logoutMock).not.toHaveBeenCalled();
    expect(token).toBe('live-token');
  });
});
