import type { VersionHistoryChipListProps } from '@/views/vacancies/types';

/**
 * Plain multi-select values (Causes, Skills, Industries…) rendered as chips —
 * Figma's "Skills Chip" (BFyxZ6AzbRZgVvjLzRFwv3, node 6537:91161): a
 * slate/100 fill with slate/600 text. Object-shaped values get the bordered
 * box grid instead; see VersionHistoryValueBoxGrid.
 */
export default function VersionHistoryChipList({
  items,
}: Readonly<VersionHistoryChipListProps>) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        // The value alone isn't a guaranteed-unique key — a duplicate
        // string is a possible API value, not just a hypothetical (see
        // DQCGP-3902, where an equivalent content-only key elsewhere in
        // this feature let two entries collide and orphaned one
        // permanently in the DOM). `index` is a safe tiebreaker: `items`
        // is rebuilt fresh from the same source data on every render.
        <span
          key={`${item}-${index}`}
          className="rounded-md bg-[#f1f5f9] px-3 py-2 text-sm font-medium text-[#475569]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
