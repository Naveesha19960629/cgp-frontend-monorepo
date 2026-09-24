import * as React from 'react';

const MOVE_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End']);

/**
 * WCAG 2.4.7 for cmdk multi-select lists. cmdk makes the first option
 * active as soon as the list opens, but Enter must not pick an option the
 * user didn't aim at (DQCGP-3297). So the highlight is drawn, and Enter
 * picks it, only once the user has moved it from the keyboard. The first
 * Down Arrow lands on the first option rather than skipping past it (APG
 * listbox). Typing or closing the list hides it again, since cmdk then goes
 * back to its first option.
 *
 * Call `onKeyDown` from the <Command>'s own onKeyDown, before cmdk handles
 * the key, and style the active row (`data-selected`) only while `shown`.
 */
export function useListHighlight({
  open,
  search,
}: {
  open: boolean;
  search: string;
}) {
  const [shown, setShown] = React.useState(false);
  const [prev, setPrev] = React.useState({ open, search });

  // Reset during render, not in an effect, so it lands in the same commit.
  if (prev.open !== open || prev.search !== search) {
    setPrev({ open, search });
    if (!open || prev.search !== search) setShown(false);
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!MOVE_KEYS.has(event.key)) return;
    // Stops cmdk moving past the option it already has active.
    if (!shown && event.key === 'ArrowDown') event.preventDefault();
    setShown(true);
  };

  return { shown: open && shown, onKeyDown };
}
