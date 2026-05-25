import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import * as React from 'react';

import { ScrollBar } from '@cgp/ui-kit/components/ui/scroll-area';
import { cn } from '@cgp/ui-kit/lib/utils';

interface ScrollAreaWithShadowProps extends React.ComponentProps<
  typeof ScrollAreaPrimitive.Root
> {
  children: React.ReactNode;
  className?: string;
}

export function ScrollAreaWithShadow({
  children,

  className,
  ...props
}: ScrollAreaWithShadowProps) {
  const [showShadow, setShowShadow] = React.useState(false);
  const [showTopShadow, setShowTopShadow] = React.useState(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const checkScrollable = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      const isScrollable = viewport.scrollHeight > viewport.clientHeight;
      const scrollTop = viewport.scrollTop;
      const scrollBottom =
        viewport.scrollHeight - viewport.clientHeight - scrollTop;

      // Show bottom shadow when content is scrollable and not at bottom
      setShowShadow(isScrollable && scrollBottom > 5);

      // Show top shadow when scrolled down from top
      setShowTopShadow(scrollTop > 5);
    }
  }, []);

  React.useEffect(() => {
    checkScrollable();

    const viewport = viewportRef.current;
    if (viewport) {
      const resizeObserver = new ResizeObserver(checkScrollable);
      resizeObserver.observe(viewport);

      // Listen to scroll events
      viewport.addEventListener('scroll', checkScrollable);

      return () => {
        resizeObserver.disconnect();
        viewport.removeEventListener('scroll', checkScrollable);
      };
    }
  }, [checkScrollable]);

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />

      {/* Top shadow overlay */}
      {showTopShadow && (
        <div className="pointer-events-none absolute top-0 right-0 left-0 h-37" />
      )}

      {/* Bottom shadow overlay */}
      {showShadow && (
        <div
          className="pointer-events-none absolute right-0 bottom-0 left-0 h-37"
          style={{
            background:
              'linear-gradient(to top, rgba(255, 255, 255, 1) 0%, transparent 100%)',
          }}
        />
      )}
    </ScrollAreaPrimitive.Root>
  );
}
