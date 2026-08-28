import * as SwitchPrimitive from '@radix-ui/react-switch';

import * as React from 'react';

import { cn } from '@cgp/ui-kit/lib/utils';

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default' | 'md' | 'lg';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-unchecked:bg-input dark:data-unchecked:bg-input/80 relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 aria-invalid:ring-3 data-checked:bg-emerald-500 data-disabled:cursor-not-allowed data-disabled:opacity-50',
        // Responsive track dimensions based on size
        // Figma ATS-Handover 4229:226984 / 4229:244966 — track 48x28, knob 20px inset 4px.
        // The 1px transparent border is inside this box, so the flex content box is 26px and
        // `items-center` lands the 20px knob 3px in, i.e. 4px from the painted outer edge.
        'data-[size=lg]:h-7 data-[size=lg]:w-12',
        // Figma ATS-Handover 4229:229985 / 6536:91053 — track 48x24, knob 20px inset 2px.
        // Same 1px-border-inside-the-box logic as lg: content box is 22px tall, `items-center`
        // lands the knob 1px in, i.e. 2px from the painted outer edge.
        'data-[size=md]:h-6 data-[size=md]:w-12',
        'data-[size=default]:h-[18.4px] data-[size=default]:w-8',
        'data-[size=sm]:h-3.5 data-[size=sm]:w-6',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-background dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground pointer-events-none block rounded-full ring-0 transition-transform',
          // Knob sizes
          'group-data-[size=lg]/switch:size-5', // 20px x 20px
          'group-data-[size=md]/switch:size-5', // 20px x 20px
          'group-data-[size=default]/switch:size-4',
          'group-data-[size=sm]/switch:size-3',
          // Sliding translation math (checked)
          'group-data-[size=lg]/switch:data-checked:translate-x-[23px]', // 24px from the outer edge, less the 1px border
          'group-data-[size=md]/switch:data-checked:translate-x-6.25', // 26px from the outer edge, less the 1px border
          'group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)]',
          'group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)]',
          // Unchecked positions
          'group-data-[size=lg]/switch:data-unchecked:translate-x-[3px]', // 4px from the outer edge, less the 1px border
          'group-data-[size=md]/switch:data-unchecked:translate-x-px', // 2px from the outer edge, less the 1px border
          'group-data-[size=default]/switch:data-unchecked:translate-x-0',
          'group-data-[size=sm]/switch:data-unchecked:translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
