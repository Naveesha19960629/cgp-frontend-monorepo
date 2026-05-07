import { useEffect, useState } from 'react';

/**
 * Hook to detect when a touch phone is in landscape orientation.
 * Blocks landscape view on phones only (not tablets, not desktops).
 *
 * Logic:
 * - Checks if device is in landscape orientation (window.matchMedia)
 * - Confirms device is mobile via touch support or mobile user-agent
 * - Verifies shortest viewport side is below tablet threshold (< 768px)
 *
 * Returns: boolean indicating whether to show landscape blocker overlay
 */
export function useDeviceOrientation(): boolean {
  const [shouldBlockLandscape, setShouldBlockLandscape] = useState(false);

  useEffect(() => {
    /**
     * Determine if device is a touch phone in landscape.
     */
    const checkOrientation = () => {
      // Treat both real devices and desktop emulation as mobile signals.
      const isTouchDevice = navigator.maxTouchPoints > 0;
      const isMobileUserAgent = /Android|iPhone|iPod|Mobile/i.test(
        navigator.userAgent
      );
      const isMobileDevice = isTouchDevice || isMobileUserAgent;

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
      const isPhoneViewport = shortestViewportSide < 768;

      // Block in landscape for phone-sized mobile devices only.
      const shouldBlock = isMobileDevice && isLandscape && isPhoneViewport;
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
