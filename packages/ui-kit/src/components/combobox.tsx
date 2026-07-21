import clsx from 'clsx';

import { CheckIcon, Plus } from 'lucide-react';

import React from 'react';
import { useTranslation } from 'react-i18next';

import multiSelectInfoAvatar from '@/assets/images/multi-select-info-avatar.svg';

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@cgp/ui-kit/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { ScrollArea } from '@cgp/ui-kit/components/ui/scroll-area';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn, removeEmoji } from '@cgp/ui-kit/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  /**
   * Overrides the text shown in the closed input for the selected value.
   * Useful when the dropdown lists a richer label (e.g. "Skill - Career Path")
   * but the collapsed field should show a shorter one (e.g. just "Skill").
   */
  selectedLabel?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyTitle?: string;
  className?: string;
  disabled?: boolean;
  onAddNew?: (value: string) => void;
  loading?: boolean;
  onSearchChange?: (value: string) => void;
  onImmediateSearchChange?: (value: string) => void;
  maxLength?: number;
  isError?: boolean;
  beforeOpen?: () => boolean;
  errorMessage?: string;
  hideAddNew?: boolean;
  preventNumbers?: boolean;
  preventSpecialCharacters?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  clearOnSelect?: boolean;
  modal?: boolean;
  addable?: boolean;
}

export function Combobox({
  options,
  value,
  selectedLabel,
  onValueChange,
  placeholder = 'Select option...',
  searchPlaceholder: _searchPlaceholder = 'Search options...',
  emptyMessage,
  emptyTitle,
  className,
  disabled = false,
  onAddNew,
  loading = false,
  onSearchChange,
  onImmediateSearchChange,
  maxLength,
  isError = false,
  beforeOpen,
  addable = true,
  errorMessage,
  hideAddNew = false,
  preventNumbers = false,
  preventSpecialCharacters = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  clearOnSelect = false,
  modal = true,
}: ComboboxProps) {
  const { t } = useTranslation();

  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const [searchValue, setSearchValue] = React.useState('');
  const clickingInputRef = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [selectedOption, setSelectedOption] = React.useState<
    ComboboxOption | undefined
  >(undefined);

  // Cache every option label we've ever seen so we can resolve the display
  // label even after async options refresh and the selected item is no longer
  // in the current page/slice (e.g. record #51 after resetting to first 50).
  const optionsCacheRef = React.useRef<Map<string, string>>(new Map());

  const debouncedSearchChange = useDebouncedCallback(
    (value: string) => {
      onSearchChange?.(value.trimStart().trimEnd());
    },
    300 // 300ms delay
  );

  React.useEffect(() => {
    // Populate cache before resolving so the current batch is included.
    options.forEach(o => optionsCacheRef.current.set(o.value, o.label));

    const selected = options.find(option => option.value === value);
    if (selected) {
      setSelectedOption(selected);
    } else if (!value) {
      setSelectedOption(undefined);
    } else {
      // Value is set but not in current options snapshot (async reset).
      // Resolve from cache so the label stays visible.
      const cachedLabel = optionsCacheRef.current.get(value);
      if (cachedLabel !== undefined) {
        setSelectedOption({ value, label: cachedLabel });
      }
      // If not in cache either, keep whatever selectedOption was before.
    }
  }, [value, options]);

  // When the popover is closed externally (parent changes controlled `open` prop
  // without going through handleOpenChange), clear stale searchValue so the input
  // doesn't show old typed text the next time the popover reopens.
  React.useEffect(() => {
    if (!open) {
      setSearchValue('');
      debouncedSearchChange.cancel();
    }
  }, [open, debouncedSearchChange]);

  const filteredOptions = React.useMemo(() => {
    const trimmedSearch = searchValue.trimStart().trimEnd();
    if (!trimmedSearch) return options;
    return options.filter(
      option =>
        option.label.toLowerCase().includes(trimmedSearch.toLowerCase()) ||
        option.value.toLowerCase().includes(trimmedSearch.toLowerCase())
    );
  }, [options, searchValue]);

  const searchValueExists = React.useMemo(() => {
    const trimmed = searchValue.trim().toLowerCase();
    return options.some(opt => opt.label.toLowerCase() === trimmed);
  }, [options, searchValue]);

  const handleSelect = (selectedValue: string) => {
    // single select: replace with new value
    onValueChange?.(selectedValue);
    setOpen(false);
    setSearchValue('');
  };

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    controlledOnOpenChange?.(newOpen);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && clickingInputRef.current) {
      clickingInputRef.current = false;
      return;
    }
    clickingInputRef.current = false;
    if (newOpen && beforeOpen && !beforeOpen()) {
      return;
    }
    if (newOpen && !clearOnSelect && selectedOption) {
      const displayLabel = selectedLabel ?? selectedOption.label;
      setSearchValue(displayLabel);
      // If the selected option is not in the current options slice (e.g. it
      // came from a previous search beyond the initial page), trigger the
      // external search immediately so the list repopulates on open.
      const inCurrentOptions = options.some(
        o => o.value === selectedOption.value
      );
      if (!inCurrentOptions) {
        onSearchChange?.(displayLabel);
      }
    }
    setOpen(newOpen);
    if (!newOpen) {
      setSearchValue('');
      onSearchChange?.('');
    }
  };

  const handleAddNew = () => {
    if (searchValue.trim() && onAddNew) {
      debouncedSearchChange.flush();
      onAddNew(searchValue.trim());
      handleOpenChange(false);
    }
  };

  const getInputDisplayValue = (): string => {
    if (clearOnSelect || open) return searchValue;
    if (!selectedOption) return '';
    return selectedLabel ?? selectedOption.label;
  };
  const inputDisplayValue = getInputDisplayValue();

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={modal}>
      <PopoverTrigger asChild>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          data-testid="form-combobox-input"
          aria-expanded={open}
          aria-invalid={isError || undefined}
          value={inputDisplayValue}
          onChange={e => {
            let cleanVal = removeEmoji(
              e.target.value.trimStart().replace(/  +/g, ' ')
            );
            if (preventNumbers) cleanVal = cleanVal.replace(/[0-9]/g, '');
            if (preventSpecialCharacters)
              cleanVal = cleanVal.replace(/[^a-zA-Z0-9\s]/g, '');
            setSearchValue(cleanVal);
            onImmediateSearchChange?.(cleanVal);
            debouncedSearchChange(cleanVal);
            if (!open) handleOpenChange(true);
          }}
          onMouseDown={() => {
            if (open) {
              clickingInputRef.current = true;
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            'border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 !h-11 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-none transition-[color,box-shadow] outline-none placeholder:text-slate-500 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
            applyTypography('body-medium'),
            selectedOption && 'text-slate-900',
            isError && 'border-destructive',
            className
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] max-w-94 overflow-hidden p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={e => e.preventDefault()}
        onCloseAutoFocus={e => e.preventDefault()}
        onInteractOutside={e => {
          const nativeTarget = (
            e as CustomEvent<{ originalEvent: PointerEvent }>
          ).detail?.originalEvent?.target as Node | null;
          const target = (nativeTarget ?? e.target) as Node;
          if (inputRef.current?.contains(target)) {
            e.preventDefault();
          }
        }}
      >
        <Command onMouseDown={e => e.preventDefault()}>
          <CommandList className="max-h-none overflow-hidden">
            <ScrollArea className="p-3 [&_[data-slot=scroll-area-viewport]]:max-h-[272px] [&_[data-slot=scroll-area-viewport]>div]:!block [&_[data-slot=scroll-area-viewport]>div]:!w-full">
              <div className="w-full overflow-hidden">
                {searchValue.trim().length > 0 &&
                  !hideAddNew &&
                  !searchValueExists && (
                    <CommandGroup className="p-0">
                      {errorMessage && (
                        <p className="text-destructive px-3 py-1.5 text-xs font-medium">
                          {errorMessage}
                        </p>
                      )}
                      {addable && (
                        <CommandItem
                          onSelect={handleAddNew}
                          className={clsx(
                            'w-full cursor-pointer gap-1 overflow-hidden rounded-sm bg-neutral-200 p-3 text-slate-900',
                            (loading || !!errorMessage) &&
                              'cursor-not-allowed opacity-50'
                          )}
                          disabled={loading || !!errorMessage}
                        >
                          <Plus className="size-6 shrink-0" />
                          <span className="flex min-w-0 flex-1 items-center gap-1 font-medium">
                            <span className="shrink-0">Add</span>
                            <span className="flex min-w-0 flex-1 items-center">
                              <span className="shrink-0">&ldquo;</span>
                              <span className="min-w-0 truncate">
                                {searchValue}
                              </span>
                              <span className="shrink-0">&rdquo;</span>
                            </span>
                          </span>
                        </CommandItem>
                      )}
                    </CommandGroup>
                  )}
                {loading && (
                  <CommandGroup className="p-0">
                    <CommandItem
                      disabled
                      className={clsx(
                        'mb-0 rounded-sm pb-0 pl-0 text-sm font-medium text-slate-500',
                        addable ? 'pt-3' : 'pt-0'
                      )}
                    >
                      Searching...
                    </CommandItem>
                  </CommandGroup>
                )}

                {!loading && filteredOptions.length === 0 && (
                  <div
                    className={clsx(
                      'flex h-full flex-col content-start items-center pb-3',
                      addable ? 'pt-6' : 'pt-3'
                    )}
                  >
                    <div className="flex flex-col items-start">
                      <img
                        src={multiSelectInfoAvatar}
                        alt={t('common.noData')}
                      />
                      <div className="mt-3 w-61 text-left">
                        <p className="font-bold text-slate-900">
                          {emptyTitle || t('common.noDataTitle')}
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {emptyMessage || t('common.noDataDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!loading && filteredOptions.length > 0 && (
                  <CommandGroup className="w-full p-0">
                    {filteredOptions.map(option => (
                      <CommandItem
                        key={option.value}
                        value={option.label} // use label for shadcn filter
                        onSelect={() => handleSelect(option.value)} // store real value
                        className={cn(
                          'w-full min-w-0 gap-2 overflow-hidden rounded-sm p-3 hover:bg-neutral-100 hover:text-slate-900',
                          option.value === value
                            ? 'text-slate-900'
                            : 'text-slate-500'
                        )}
                      >
                        {option.value === value && (
                          <CheckIcon className="size-4 shrink-0 grow-0" />
                        )}
                        <p className="block min-w-0 wrap-break-word whitespace-normal">
                          {option.label}
                        </p>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </div>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
