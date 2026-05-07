import clsx from 'clsx';

import { useEffect, useRef, useState } from 'react';

import { applyTypography } from '@cgp/ui-kit/lib/typography';

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
          <span
            onClick={() => setExpanded(false)}
            className={moreTextClassName}
          >
            less
          </span>
        )}
      </p>

      {!expanded && showButton && (
        <span
          onClick={() => setExpanded(true)}
          className={clsx(
            moreTextClassName,
            'absolute right-0 bottom-0 bg-white pl-1 text-base font-bold'
          )}
        >
          ...
          <span className="text-brand-primary-500 text-base font-bold">
            more
          </span>
        </span>
      )}
    </div>
  );
}
