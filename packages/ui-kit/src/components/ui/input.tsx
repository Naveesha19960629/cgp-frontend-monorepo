import * as React from 'react';

import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn, removeEmoji } from '@cgp/ui-kit/lib/utils';

function Input({
  className,
  type,
  onChange,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        applyTypography('body-medium'),
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
      onChange={event => {
        const sanitizedValue = removeEmoji(event.currentTarget.value);
        if (sanitizedValue !== event.currentTarget.value) {
          event.currentTarget.value = sanitizedValue;
        }
        onChange?.(event);
      }}
    />
  );
}

export { Input };
