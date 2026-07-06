import { type VariantProps, cva } from 'class-variance-authority';

import { Slot } from '@radix-ui/react-slot';

import * as React from 'react';

import { cn } from '@cgp/ui-kit/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80 px-2.5 py-0.5 text-xs',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2.5 py-0.5 text-xs',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 px-2.5 py-0.5 text-xs',
        outline: 'text-foreground px-2.5 py-0.5 text-xs',
        chip: 'border-neutral-200 min-h-[44px] h-auto max-w-full break-all bg-[linear-gradient(114.81deg,#e1eff0_0%,#f1f5f9_50%)] p-3 text-slate-600 text-[14px] leading-[20px] tracking-normal',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
