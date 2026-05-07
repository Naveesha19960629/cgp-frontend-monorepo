import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import rotateBg from '@cgp/ui-kit/assets/images/rotate-bg.svg';
import rotateIcon from '@cgp/ui-kit/assets/images/rotate-icon.svg';
import { useDeviceOrientation } from '@cgp/ui-kit/hooks/use-device-orientation';

/**
 * LandscapeBlocker Component
 *
 * Renders a full-screen overlay that blocks landscape view on touch phones.
 * Only visible when device is in landscape orientation on a phone.
 *
 * Features:
 * - Fixed full-screen overlay with gradient background
 * - Centered content with icon, title, and descriptive text
 * - Blocks pointer events to prevent app interaction while active
 * - Accessible with semantic HTML and ARIA attributes
 */
export function LandscapeBlocker() {
  const shouldBlockLandscape = useDeviceOrientation();
  const { t } = useTranslation();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverscroll = html.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousBodyTouchAction = body.style.touchAction;

    if (shouldBlockLandscape) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      html.style.overscrollBehavior = 'none';
      body.style.overscrollBehavior = 'none';
      body.style.touchAction = 'none';
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      html.style.overscrollBehavior = previousHtmlOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
      body.style.touchAction = previousBodyTouchAction;
    };
  }, [shouldBlockLandscape]);

  if (!shouldBlockLandscape) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#f5f7f7' }}
      role="presentation"
      aria-live="polite"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(96deg, #f6f1ed 0%, #eef6f6 100%)',
        }}
        aria-hidden="true"
      />

      <img
        src={rotateBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-95 contrast-125 saturate-125"
        aria-hidden="true"
      />

      {/* Content container */}
      <div className="relative z-10 flex w-full max-w-[920px] items-center justify-center gap-10 px-8 text-left">
        {/* Icon/Avatar */}
        <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-white/85 p-3 shadow-lg">
          <img
            src={rotateIcon}
            alt={t('landscapeBlocker.iconAlt')}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="max-w-[296px]">
          {/* Title */}
          <h1 className="text-[20px] leading-[24px] font-bold tracking-[-0.1px] text-slate-900">
            {t('landscapeBlocker.title')}
          </h1>

          {/* Description */}
          <p className="mt-2 text-[14px] leading-[20px] font-semibold text-slate-700">
            {t('landscapeBlocker.description')}
          </p>
        </div>
      </div>

      {/* Block interaction with the app beneath */}
      <div className="absolute inset-0 cursor-not-allowed" aria-hidden="true" />
    </div>
  );
}
