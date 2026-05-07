import { clsx } from 'clsx';

import * as React from 'react';

import { applyTypography } from '@cgp/ui-kit/lib/typography';

interface CharacterCountProps extends React.HTMLAttributes<HTMLSpanElement> {
  currentLength: number;
  maxLength: number;
}

const CharacterCount = React.forwardRef<HTMLSpanElement, CharacterCountProps>(
  ({ currentLength, maxLength, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(applyTypography('body-semibold'), className)}
        data-slot="character-count"
        role="status"
        aria-live="polite"
        {...props}
      >
        <span className="text-slate-900">{currentLength}</span>
        <span className="text-slate-500">/{maxLength}</span>
      </span>
    );
  }
);
CharacterCount.displayName = 'CharacterCount';

export type { CharacterCountProps };
export { CharacterCount };
