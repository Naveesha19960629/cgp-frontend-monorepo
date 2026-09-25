import clsx from 'clsx';

import { useEffect, useRef, useState } from 'react';

import { applyTypography } from '@cgp/ui-kit/lib/typography';

// Real buttons so the text expands from the keyboard (NFR-024, WCAG 2.1.1);
// they used to be click-only spans.
const FOCUS_RING =
  'focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none';

interface ExpandableTextProps {
  limit?: number; // Optional character limit for truncation
  text: string;
  className?: string;
  moreTextClassName?: string;
}

export default function ExpandableText({
  text,
  className = clsx(applyTypography('h5'), 'text-slate-500'),
  moreTextClassName = 'text-brand-primary-400 cursor-pointer hover:underline ml-1',
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const maxHeight = lineHeight * 2;

    if (el.scrollHeight > maxHeight) {
      setShowButton(true);
    }
  }, [text]);

  return (
    <div className="relative">
      <p
        ref={textRef}
        className={clsx(
          className,
          'whitespace-pre-line',
          !expanded && 'line-clamp-2'
        )}
      >
        {text}

        {expanded && (
          <button
            type="button"
            aria-expanded
            onClick={() => setExpanded(false)}
            className={clsx(moreTextClassName, FOCUS_RING)}
          >
            less
          </button>
        )}
      </p>

      {!expanded && showButton && (
        <button
          type="button"
          aria-expanded={false}
          onClick={() => setExpanded(true)}
          className={clsx(
            moreTextClassName,
            FOCUS_RING,
            'absolute right-0 bottom-0 bg-white pl-1 text-base font-bold'
          )}
        >
          ...
          <span className="text-brand-primary-500 text-base font-bold">
            more
          </span>
        </button>
      )}
    </div>
  );
}
