import { useTheme } from 'next-themes';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { useToastOverlay } from '@cgp/ui-kit/hooks/use-toast-overlay';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const { hasToasts, overlayGradient } = useToastOverlay();

  return (
    <>
      {/* Overlay when toasts are visible */}
      <div
        className={`fixed inset-0 z-[9999] transition-opacity duration-800 ease-in-out ${
          hasToasts ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{
          zIndex: 9999,
          background: overlayGradient,
        }}
      />

      <Sonner
        theme={theme as ToasterProps['theme']}
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
            zIndex: 10000, // Ensure toaster is above the overlay
          } as React.CSSProperties
        }
        {...props}
      />
    </>
  );
};

export { Toaster };
