import { InfoCircle } from 'iconsax-reactjs';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { Popover, PopoverTrigger } from '@cgp/ui-kit/components/ui/popover';
import { cn } from '@cgp/ui-kit/lib/utils';

interface FieldTooltipProps {
  title?: string;
  description?: string;
  image?: string;
  children?: ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
}

export function FieldTooltip({
  title,
  image,
  children,
  triggerClassName,
  contentClassName,
  side = 'top',
  align = 'start',
  alignOffset = -10,
}: FieldTooltipProps) {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 300);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span
          className={triggerClassName ?? 'inline-flex cursor-pointer'}
          onClick={() => setOpen(prev => !prev)}
        >
          {children ?? (
            <InfoCircle size={16} className="text-slate-900" variant="Linear" />
          )}
        </span>
      </PopoverTrigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={2}
          alignOffset={alignOffset}
          className={cn(
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-auto max-w-[238px] rounded-xl border-none bg-slate-700 p-2 shadow-xl',
            contentClassName
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex flex-col gap-1 p-0.5">
            {image && (
              <img
                src={image}
                alt={title}
                className="w-full rounded-lg object-cover"
              />
            )}
            <p className="text-sm leading-relaxed font-semibold tracking-normal whitespace-pre-line text-white">
              {title}
            </p>
          </div>
          <PopoverPrimitive.Arrow
            className="fill-slate-700"
            width={12}
            height={10}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}
