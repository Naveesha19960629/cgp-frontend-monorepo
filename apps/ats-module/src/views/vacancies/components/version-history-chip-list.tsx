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
      {items.map(item => (
        // The value itself is the key: a multi-select field's chosen
        // options are themselves unique within one change (no stable id
        // exists, but the plain string values are).
        <span
          key={item}
          className="rounded-md bg-[#f1f5f9] px-3 py-2 text-sm font-medium text-[#475569]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
