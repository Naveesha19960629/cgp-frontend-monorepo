import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HeaderControls from '@/app/components/header-controls';
import type { User } from '@/app/types';

const useUserMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('@/app/contexts/user-context', () => ({
  useUser: () => useUserMock() as unknown,
}));

vi.mock('@react-keycloak/web', () => ({
  useKeycloak: () => ({
    keycloak: { logout: logoutMock },
    initialized: true,
  }),
}));

const baseUser: User = {
  id: '1',
  email: 'jane.doe@example.com',
  emailVerified: true,
  name: 'Jane Doe',
  firstName: 'jane',
  lastName: 'doe',
  givenName: 'jane',
  familyName: 'doe',
  preferredUsername: 'jane.doe',
  picture: 'https://example.com/avatar.png',
};

// jsdom never fires real image load/error events, so radix-ui's AvatarImage
// (which tracks loading status via an in-memory `new window.Image()`, not the
// rendered <img>) never reaches the "loaded" state and always defers to
// AvatarFallback. Stubbing `Image` as already-complete lets it resolve to
// "loaded" synchronously so the <img alt=.../> actually renders for assertions.
class CompleteMockImage {
  complete = true;
  naturalWidth = 1;
  src = '';
  addEventListener() {
    /* no-op: status already resolves synchronously via complete/naturalWidth */
  }
  removeEventListener() {
    /* no-op */
  }
}

describe('HeaderControls', () => {
  const OriginalImage = globalThis.Image;

  beforeEach(() => {
    useUserMock.mockReset();
    logoutMock.mockReset();
  });

  afterEach(() => {
    globalThis.Image = OriginalImage;
  });

  it('falls back to CN initials when there is no user', () => {
    useUserMock.mockReturnValue({ user: null, isLoading: false });

    render(<HeaderControls />);

    expect(screen.getByText('CN')).toBeInTheDocument();
    // No picture is available, so the avatar image never resolves and only
    // the fallback initials are present in the document.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('derives uppercased initials from firstName/lastName when there is no picture', () => {
    useUserMock.mockReturnValue({
      user: { ...baseUser, picture: undefined },
      isLoading: false,
    });

    render(<HeaderControls />);

    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it("renders the user's picture and name on the avatar image once loaded", async () => {
    globalThis.Image = CompleteMockImage as unknown as typeof globalThis.Image;
    useUserMock.mockReturnValue({ user: baseUser, isLoading: false });

    render(<HeaderControls />);

    const avatarImage = await screen.findByAltText('Jane Doe');
    expect(avatarImage).toHaveAttribute('src', baseUser.picture);
  });

  it('opens the profile dropdown and calls keycloak.logout with the login redirect uri on Log out', async () => {
    useUserMock.mockReturnValue({ user: baseUser, isLoading: false });
    const user = userEvent.setup();

    render(<HeaderControls />);

    await user.click(screen.getByTestId('profile-expand-button'));

    const logoutItem = await screen.findByText('Log out');
    await user.click(logoutItem);

    expect(logoutMock).toHaveBeenCalledWith({
      redirectUri: `${window.location.origin}/auth/login`,
    });
  });
});
