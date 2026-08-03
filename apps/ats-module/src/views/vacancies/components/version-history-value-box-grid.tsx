import type { VersionHistoryValueBoxGridProps } from '@/views/vacancies/types';

import { cn } from '@cgp/ui-kit/lib/utils';

// Figma (BFyxZ6AzbRZgVvjLzRFwv3, node 4229:229230) pairs a green/600 border
// with green/700 title text for both "added" and "updated" boxes — two
// distinct shades, not one color reused for both. "removed" reuses the same
// red for border and text.
const VARIANT_BORDER_CLASS: Record<
  VersionHistoryValueBoxGridProps['variant'],
  string
> = {
  added: 'border-[#059669]',
  removed: 'border-[#be123c]',
  updated: 'border-[#059669]',
};

const VARIANT_TITLE_CLASS: Record<
  VersionHistoryValueBoxGridProps['variant'],
  string
> = {
  added: 'text-[#047857]',
  removed: 'text-[#be123c]',
  updated: 'text-[#047857]',
};

/**
 * The bordered two-column box grid for "added/removed/updated N items"
 * changes (e.g. schools, industries) — mirrors renderValueBoxGrid in
 * utils/version-history-pdf.ts, same border/title color per variant.
 */
export default function VersionHistoryValueBoxGrid({
  items,
  variant,
}: Readonly<VersionHistoryValueBoxGridProps>) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, index) => (
        <div
          // Items are a point-in-time snapshot with no stable id, and never
          // reorder within a single render.
          key={index}
          // Figma insets box content by 28px (node 4229:229313).
          className={cn(
            'rounded-lg border bg-white p-7',
            VARIANT_BORDER_CLASS[variant]
          )}
        >
          <p
            className={cn(
              'text-base font-bold wrap-break-word',
              VARIANT_TITLE_CLASS[variant]
            )}
          >
            {item.title}
          </p>
          {item.subtitle && (
            <p className="mt-1 text-sm font-medium text-[#475569]">
              {item.subtitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
