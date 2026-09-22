import { useEffect, useState } from 'react';

/**
 * Minimal shape of the User-Agent Client Hints API, which is not part of
 * TypeScript's DOM library yet.
 */
type UserAgentClientHints = {
  mobile?: boolean;
};

/** Tablets and larger are at least this wide on their shortest side. */
const TABLET_MIN_SHORTEST_SIDE = 768;

/** User agents reported by phones (and by phone emulation in dev tools). */
const PHONE_USER_AGENT = /Android|iPhone|iPod|Windows Phone|IEMobile|Mobile/i;

/**
 * User agents reported by desktop and laptop platforms. Touchscreen laptops
 * and 2-in-1s live here, so they must never be mistaken for phones.
 */
const DESKTOP_USER_AGENT = /Windows NT|Macintosh|CrOS|X11/i;

/**
 * Determine whether the current device is a phone.
 *
 * Touch support alone is not a phone signal: touchscreen laptops report
 * `navigator.maxTouchPoints > 0` as well. Detection therefore goes from the
 * most reliable signal to the least:
 *
 * 1. Client Hints `mobile` flag, which Chromium reports accurately (`false`
 *    on touchscreen laptops, `true` under dev tools device emulation).
 * 2. The user-agent string, for Safari and Firefox where Client Hints are
 *    unavailable.
 * 3. Touch-only input on a non-desktop platform, as a final fallback for
 *    phone browsers with an unusual user agent.
 */
function isPhoneDevice(): boolean {
  const { userAgent } = navigator;
  const clientHints = (
    navigator as Navigator & { userAgentData?: UserAgentClientHints }
  ).userAgentData;

  if (typeof clientHints?.mobile === 'boolean') {
    return clientHints.mobile;
  }

  if (PHONE_USER_AGENT.test(userAgent)) {
    return true;
  }

  // No mouse or trackpad available, i.e. the device is driven by touch alone.
  const isTouchOnly =
    navigator.maxTouchPoints > 0 &&
    window.matchMedia('(pointer: coarse)').matches &&
    window.matchMedia('(hover: none)').matches;

  return isTouchOnly && !DESKTOP_USER_AGENT.test(userAgent);
}

/**
 * Hook to detect when a phone is in landscape orientation.
 * Blocks landscape view on phones only (not tablets, not desktops or laptops,
 * including touchscreen laptops).
 *
 * Logic:
 * - Confirms the device is a phone (see `isPhoneDevice`)
 * - Checks if device is in landscape orientation (window.matchMedia)
 * - Verifies shortest viewport side is below tablet threshold (< 768px)
 *
 * Returns: boolean indicating whether to show landscape blocker overlay
 */
export function useDeviceOrientation(): boolean {
  const [shouldBlockLandscape, setShouldBlockLandscape] = useState(false);

  useEffect(() => {
    /**
     * Determine if device is a phone in landscape.
     */
    const checkOrientation = () => {
      // Check if in landscape orientation.
      // Fallback to viewport dimensions for environments where matchMedia is unreliable.
      const isLandscape =
        window.matchMedia('(orientation: landscape)').matches ||
        window.innerWidth > window.innerHeight;

      // Use shortest side to identify phones in both portrait and landscape.
      // Example: iPhone 14 Pro Max landscape can be 932x430; shortest side is 430.
      // Tablets are usually >= 768 on the shortest side.
      const shortestViewportSide = Math.min(
        window.innerWidth,
        window.innerHeight
      );
      const isPhoneViewport = shortestViewportSide < TABLET_MIN_SHORTEST_SIDE;

      // Block in landscape for phone devices at phone-sized viewports only.
      const shouldBlock = isPhoneDevice() && isLandscape && isPhoneViewport;
      setShouldBlockLandscape(shouldBlock);
    };

    // Initial check
    checkOrientation();

    // Listen for orientation changes and window resize
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);

    // Cleanup listeners
    return () => {
      window.removeEventListener('orientationchange', checkOrientation);
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  return shouldBlockLandscape;
}
