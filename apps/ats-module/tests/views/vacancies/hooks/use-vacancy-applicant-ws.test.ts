import { useVacancyApplicantWs } from '@/views/vacancies/hooks/use-vacancy-applicant-ws';

const useKeycloakMock = vi.fn();
const infoToastMock = vi.fn();

vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => useKeycloakMock() as unknown,
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  InfoToast: (...args: unknown[]) => {
    infoToastMock(...args);
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  sent: string[] = [];
  closed = false;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.closed = true;
  }
}

function mockKeycloak(overrides: Record<string, unknown> = {}) {
  useKeycloakMock.mockReturnValue({
    keycloak: {
      updateToken: vi.fn().mockResolvedValue(true),
      token: 'test-token',
      ...overrides,
    },
    initialized: true,
  });
}

describe('useVacancyApplicantWs', () => {
  beforeEach(() => {
    useKeycloakMock.mockReset();
    infoToastMock.mockReset();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not open a websocket when disabled', () => {
    mockKeycloak();

    renderHook(() =>
      useVacancyApplicantWs({ vacancyId: 'vac-1', enabled: false })
    );

    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it('does not open a websocket when vacancyId is missing', () => {
    mockKeycloak();

    renderHook(() =>
      useVacancyApplicantWs({ vacancyId: undefined, enabled: true })
    );

    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it('does not open a websocket when the token refresh fails', async () => {
    mockKeycloak({ updateToken: vi.fn().mockRejectedValue(new Error('nope')) });

    renderHook(() =>
      useVacancyApplicantWs({ vacancyId: 'vac-1', enabled: true })
    );

    await waitFor(() => {
      expect(useKeycloakMock).toHaveBeenCalled();
    });
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it('sends the authorization handshake as the first message once open', async () => {
    mockKeycloak();

    renderHook(() =>
      useVacancyApplicantWs({ vacancyId: 'vac-1', enabled: true })
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0];
    expect(socket.url).toBe(
      `${import.meta.env.VITE_WS_URL}/vacancy-applicant-ws`
    );

    socket.onopen?.();

    expect(socket.sent).toEqual([
      JSON.stringify({
        authorization: 'Bearer',
        token: 'test-token',
        vacancyId: 'vac-1',
      }),
    ]);
  });

  it('shows an info toast when applicantCount is 1 or more', async () => {
    mockKeycloak();

    renderHook(() =>
      useVacancyApplicantWs({ vacancyId: 'vac-1', enabled: true })
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0];

    socket.onmessage?.({
      data: JSON.stringify({ baseVacancyId: 'vac-1', applicantCount: 1 }),
    });

    expect(infoToastMock).toHaveBeenCalledTimes(1);
    expect(infoToastMock).toHaveBeenCalledWith({
      title: 'vacancies.edit.applicantNotification.title',
      description: 'vacancies.edit.applicantNotification.message',
    });
  });

  it('does not show a toast when applicantCount is 0 or absent', async () => {
    mockKeycloak();

    renderHook(() =>
      useVacancyApplicantWs({ vacancyId: 'vac-1', enabled: true })
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0];

    socket.onmessage?.({
      data: JSON.stringify({ baseVacancyId: 'vac-1', applicantCount: 0 }),
    });
    socket.onmessage?.({ data: JSON.stringify({ baseVacancyId: 'vac-1' }) });

    expect(infoToastMock).not.toHaveBeenCalled();
  });

  it('ignores a malformed message instead of throwing', async () => {
    mockKeycloak();

    renderHook(() =>
      useVacancyApplicantWs({ vacancyId: 'vac-1', enabled: true })
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0];

    expect(() => socket.onmessage?.({ data: 'not-json' })).not.toThrow();
    expect(infoToastMock).not.toHaveBeenCalled();
  });

  it('does not re-notify for a repeated, non-increasing applicantCount', async () => {
    mockKeycloak();

    renderHook(() =>
      useVacancyApplicantWs({ vacancyId: 'vac-1', enabled: true })
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0];

    socket.onmessage?.({
      data: JSON.stringify({ baseVacancyId: 'vac-1', applicantCount: 1 }),
    });
    socket.onmessage?.({
      data: JSON.stringify({ baseVacancyId: 'vac-1', applicantCount: 1 }),
    });

    expect(infoToastMock).toHaveBeenCalledTimes(1);
  });

  it('notifies again when applicantCount increases further', async () => {
    mockKeycloak();

    renderHook(() =>
      useVacancyApplicantWs({ vacancyId: 'vac-1', enabled: true })
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0];

    socket.onmessage?.({
      data: JSON.stringify({ baseVacancyId: 'vac-1', applicantCount: 1 }),
    });
    socket.onmessage?.({
      data: JSON.stringify({ baseVacancyId: 'vac-1', applicantCount: 2 }),
    });

    expect(infoToastMock).toHaveBeenCalledTimes(2);
  });

  it('closes the socket on unmount', async () => {
    mockKeycloak();

    const { unmount } = renderHook(() =>
      useVacancyApplicantWs({ vacancyId: 'vac-1', enabled: true })
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    const socket = MockWebSocket.instances[0];

    unmount();

    expect(socket.closed).toBe(true);
  });
});
