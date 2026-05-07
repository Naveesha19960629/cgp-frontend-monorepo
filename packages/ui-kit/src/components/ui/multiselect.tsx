import { CheckIcon, ChevronDownIcon } from 'lucide-react';

import * as React from 'react';

import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';
import { Popover as PopoverPrimitive } from 'radix-ui';

interface MultiSelectProps {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  maxSelections?: number;
  placeholder?: string;
  children: React.ReactNode;
  disabled?: boolean;
  name?: string;
  getDisplayLabel?: (value: string) => string;
}

interface MultiSelectContextValue {
  selectedValues: string[];
  toggleValue: (value: string) => void;
  maxSelections: number;
  getDisplayLabel?: (value: string) => string;
}

const MultiSelectContext = React.createContext<
  MultiSelectContextValue | undefined
>(undefined);

function useMultiSelectContext() {
  const context = React.useContext(MultiSelectContext);
  if (!context) {
    throw new Error(
      'MultiSelect components must be used within a MultiSelect component'
    );
  }
  return context;
}

function MultiSelect({
  value = [],
  onValueChange,
  maxSelections = 2,
  placeholder = 'Select options',
  children,
  disabled = false,
  name,
  getDisplayLabel,
}: MultiSelectProps) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  const toggleValue = React.useCallback(
    (itemValue: string) => {
      const newValues = selectedValues.includes(itemValue)
        ? selectedValues.filter(v => v !== itemValue)
        : maxSelections === Infinity || selectedValues.length < maxSelections
          ? [...selectedValues, itemValue]
          : selectedValues;

      setSelectedValues(newValues);
      onValueChange?.(newValues);
    },
    [selectedValues, maxSelections, onValueChange]
  );

  const contextValue = React.useMemo(
    () => ({
      selectedValues,
      toggleValue,
      maxSelections,
      getDisplayLabel,
    }),
    [selectedValues, toggleValue, maxSelections, getDisplayLabel]
  );

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <input type="hidden" name={name} value={selectedValues.join(',')} />
        <MultiSelectTrigger
          placeholder={placeholder}
          selectedValues={selectedValues}
          getDisplayLabel={getDisplayLabel}
          disabled={disabled}
        />
        <MultiSelectContent>{children}</MultiSelectContent>
      </PopoverPrimitive.Root>
    </MultiSelectContext.Provider>
  );
}

interface MultiSelectTriggerProps {
  placeholder: string;
  selectedValues: string[];
  className?: string;
  size?: 'sm' | 'default';
  getDisplayLabel?: (value: string) => string;
  disabled?: boolean;
}

function MultiSelectTrigger({
  placeholder,
  selectedValues,
  className,
  size = 'default',
  getDisplayLabel,
  disabled = false,
}: MultiSelectTriggerProps) {
  return (
    <PopoverPrimitive.Trigger asChild>
      <button
        type="button"
        disabled={disabled}
        data-slot="multiselect-trigger"
        data-size={size}
        className={cn(
          "border-input [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-22 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-11 data-[size=sm]:h-8",
          applyTypography('body-medium'),
          className
        )}
      >
        <span className="flex-1 text-left">
          {selectedValues.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {selectedValues.map(value => (
                <span
                  key={value}
                  className="bg-brand-primary-500/10 text-brand-primary-700 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                >
                  {getDisplayLabel ? getDisplayLabel(value) : value}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
      </button>
    </PopoverPrimitive.Trigger>
  );
}

function MultiSelectContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align="start"
        sideOffset={4}
        data-slot="multiselect-content"
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-[300px] w-[var(--radix-popover-trigger-width)] origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-md border shadow-md',
          className
        )}
      >
        <div className="max-h-[300px] overflow-y-auto p-1">{children}</div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

function MultiSelectItem({
  className,
  children,
  value,
  disabled,
}: {
  className?: string;
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
}) {
  const { selectedValues, toggleValue, maxSelections } =
    useMultiSelectContext();
  const isSelected = selectedValues.includes(value);
  const isMaxReached =
    maxSelections !== Infinity &&
    selectedValues.length >= maxSelections &&
    !isSelected;

  const handleClick = () => {
    if (!disabled && !isMaxReached) {
      toggleValue(value);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isMaxReached}
      data-slot="multiselect-item"
      className={cn(
        'focus:bg-accent focus:text-accent-foreground hover:bg-accent relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-left text-sm outline-hidden select-none disabled:pointer-events-none disabled:opacity-50',
        isSelected && 'bg-accent/50',
        className
      )}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="size-4" />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

export { MultiSelect, MultiSelectContent, MultiSelectItem };
