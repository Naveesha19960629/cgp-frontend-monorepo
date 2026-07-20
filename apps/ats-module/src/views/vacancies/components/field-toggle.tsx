import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { cn } from '@cgp/ui-kit/lib/utils';

/** A single field label + enable/disable toggle. */
export default function FieldToggle({
  label,
  checked,
  disabled,
  onToggle,
}: Readonly<{
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (value: boolean) => void;
}>) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-start justify-between gap-3',
        disabled && 'opacity-50'
      )}
    >
      <span className="min-w-0 text-sm leading-5 font-semibold wrap-anywhere text-slate-500">
        {label}
      </span>
      <Switch
        size="lg"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}
