import * as SliderPrimitive from '@radix-ui/react-slider';

import * as React from 'react';

import { cn } from '@cgp/ui-kit/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none items-center select-none',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-[9px] w-full grow overflow-hidden rounded-full bg-slate-200">
      <SliderPrimitive.Range className="slider-track absolute h-full rounded-full bg-slate-900" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-[19px] w-[19px] rounded-full border border-[#D4D4D4] bg-[#FFFFFF] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)] transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
