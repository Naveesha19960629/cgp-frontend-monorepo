import { Check } from 'lucide-react';

import type { VersionHistoryCheckboxIndicatorProps } from '@/views/vacancies/types';

import { cn } from '@cgp/ui-kit/lib/utils';

/**
 * The checkbox drawn for a "Data Taken From Candidate" change (Figma
 * BFyxZ6AzbRZgVvjLzRFwv3, node 6536:91081 for the "checked" state — filled
 * `#075056`, the same dark teal already used elsewhere in this exact page
 * for the sidebar's selected-row accent, not the ui-kit `Checkbox`'s more
 * general-purpose `brand-primary-500` token, which is a visibly different
 * shade). Built as a small static indicator rather than reusing the ui-kit
 * `Checkbox` (a 16px interactive form control) — this is a 28px read-only
 * historical value, the same category of purpose-built indicator as
 * VersionHistoryStatusPill/VersionHistoryToggleSwitch elsewhere in this
 * view, not a live control. The "unchecked" state has no Figma reference
 * anywhere in the file (only the checked/enabled example exists) — an
 * empty bordered box is the standard unchecked-checkbox convention, used
 * here as a clearly-inferred default pending a real reference.
 */
export default function VersionHistoryCheckboxIndicator({
  isChecked,
}: Readonly<VersionHistoryCheckboxIndicatorProps>) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md',
        isChecked ? 'bg-[#075056]' : 'border border-[#cbd5e1] bg-white'
      )}
    >
      {isChecked && <Check className="size-4 text-white" strokeWidth={3} />}
    </span>
  );
}
