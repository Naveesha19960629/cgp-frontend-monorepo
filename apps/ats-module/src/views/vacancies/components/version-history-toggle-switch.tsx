import type { VersionHistoryToggleSwitchProps } from '@/views/vacancies/types';

import { Switch } from '@cgp/ui-kit/components/ui/switch';

/**
 * The on/off switch drawn for a SECTION_ENABLED change (Figma
 * BFyxZ6AzbRZgVvjLzRFwv3, node 4229:229289) — reuses the ui-kit's own
 * `Switch` (`size="lg"`: 48×24px track, 20px knob, `emerald-500` when
 * checked) rather than hand-building new toggle markup; its checked-state
 * green already matches Figma's `#10b981` exactly. This is a read-only
 * historical value, not a live control, so it's marked `aria-hidden` and
 * non-focusable/non-clickable — `disabled` isn't used instead because the
 * ui-kit Switch dims disabled tracks to 50% opacity, which would read as a
 * faded/inactive toggle rather than the fully-opaque on/off state Figma
 * shows for a past change.
 */
export default function VersionHistoryToggleSwitch({
  isOn,
}: Readonly<VersionHistoryToggleSwitchProps>) {
  return (
    <Switch
      size="lg"
      checked={isOn}
      aria-hidden
      tabIndex={-1}
      className="pointer-events-none"
    />
  );
}
