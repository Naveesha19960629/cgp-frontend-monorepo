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
import { createKeyboardActionHandler } from '@cgp/ui-kit/lib/keyboard-actions';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn, removeEmoji } from '@cgp/ui-kit/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

/** cmdk value of the "Add \"…\"" row, kept apart from real option values. */
const ADD_NEW_ITEM_VALUE = '__combobox_add_new__';
const LOADING_ITEM_VALUE = '__combobox_loading__';

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
  /**
   * Fires with the text currently shown in the input whenever it changes —
   * while typing (the live search text) and when a value is selected/cleared.
   * Lets external adornments such as a live character counter track the field.
   */
  onInputValueChange?: (value: string) => void;
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
  /** Set by `FormControl` so the field's `FormLabel` points at the input. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Set by `FormControl` to link the field's description and error text. */
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
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
  onInputValueChange,
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
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: ComboboxProps) {
  const { t } = useTranslation();

  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const [searchValue, setSearchValue] = React.useState('');
  // cmdk's highlighted row, driven from the input by the arrow keys. The
  // input is the popover trigger, so it sits outside <Command>.
  const [activeValue, setActiveValue] = React.useState('');
  const [activeOptionId, setActiveOptionId] = React.useState<string>();
  const [listEl, setListEl] = React.useState<HTMLDivElement | null>(null);
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
    const trimmedSearch = searchValue.trimStart().trimEnd().toLowerCase();
    if (!trimmedSearch) return options;
    return options.filter(option => {
      const label = option.label.toLowerCase();
      const value = option.value.toLowerCase();
      return (
        label.includes(trimmedSearch) ||
        value.includes(trimmedSearch) ||
        // Handles pasting (or reopening) a full "City, State, Country"
        // breadcrumb: the server matches on the leading segment but returns a
        // short label (e.g. "Ada"), so the typed text is a superset of the
        // option label. Without this the server result would be filtered out
        // and the field would wrongly show "No Data Found".
        (label.length > 0 && trimmedSearch.includes(label))
      );
    });
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

  /**
   * `prefill` copies the selected label into the search text, so a click
   * opens on the current value. Typing into the closed field opens it with
   * the typed text instead (prefilling would overwrite that keystroke).
   */
  const handleOpenChange = (newOpen: boolean, prefill = true) => {
    if (!newOpen && clickingInputRef.current) {
      clickingInputRef.current = false;
      return;
    }
    clickingInputRef.current = false;
    if (newOpen && beforeOpen && !beforeOpen()) {
      return;
    }
    if (newOpen) {
      // Start the highlight on the current value; cmdk falls back to the
      // first row when this is empty.
      setActiveValue(!clearOnSelect && value ? value : '');
    }
    if (newOpen && prefill && !clearOnSelect && selectedOption) {
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

  const showAddNew =
    searchValue.trim().length > 0 &&
    !hideAddNew &&
    !searchValueExists &&
    addable;
  // Rows the arrow keys can land on, in render order.
  const navigableValues = React.useMemo(
    () => [
      ...(showAddNew && !loading && !errorMessage ? [ADD_NEW_ITEM_VALUE] : []),
      ...(loading ? [] : filteredOptions.map(option => option.value)),
    ],
    [showAddNew, loading, errorMessage, filteredOptions]
  );

  // Keep the highlight on a row that is actually rendered as results change.
  React.useEffect(() => {
    if (!open) {
      setActiveValue('');
      return;
    }
    if (activeValue && navigableValues.includes(activeValue)) return;
    setActiveValue(navigableValues[0] ?? '');
  }, [open, navigableValues, activeValue]);

  // cmdk only tracks the highlighted row's element id for changes it makes
  // itself, not for a controlled `value`, so resolve it from the row's static
  // `data-value` for `aria-activedescendant`.
  React.useEffect(() => {
    const item =
      open && activeValue
        ? Array.from(
            listEl?.querySelectorAll<HTMLElement>('[cmdk-item]') ?? []
          ).find(el => el.dataset.value === activeValue)
        : undefined;
    setActiveOptionId(item?.id || undefined);
  }, [open, listEl, activeValue, navigableValues]);

  const moveActive = (step: 1 | -1) => {
    if (navigableValues.length === 0) return;
    const current = navigableValues.indexOf(activeValue);
    const next =
      current === -1
        ? step === 1
          ? 0
          : navigableValues.length - 1
        : (current + step + navigableValues.length) % navigableValues.length;
    setActiveValue(navigableValues[next]);
  };

  const selectActive = () => {
    if (activeValue === ADD_NEW_ITEM_VALUE) {
      handleAddNew();
    } else if (navigableValues.includes(activeValue)) {
      handleSelect(activeValue);
    }
  };

  const getInputDisplayValue = (): string => {
    if (clearOnSelect || open) return searchValue;
    if (!selectedOption) return '';
    return selectedLabel ?? selectedOption.label;
  };
  const inputDisplayValue = getInputDisplayValue();

  const hasSelection = Boolean(value || selectedOption);

  const deselect = () => {
    // The step clears `value`, and the label follows it (see the options
    // effect), so a step that ignored '' keeps showing its value.
    onValueChange?.('');
    if (open) {
      // Stay open on the full list so another option can be picked.
      setSearchValue('');
      debouncedSearchChange.cancel();
      onSearchChange?.('');
    } else {
      handleOpenChange(false);
    }
  };

  /**
   * NFR-024 (ATS), within the ARIA APG editable-combobox model, where both
   * keys edit text. Backspace erases character by character and deselects
   * once the text is empty. Delete deselects in one press while the input
   * still shows the selected value untouched (closed, or just opened);
   * after the user has typed, it edits the text like Backspace.
   */
  const clearFromKey = (key: 'Backspace' | 'Delete') => {
    if (!hasSelection) return false;
    const shownLabel =
      !clearOnSelect && selectedOption
        ? (selectedLabel ?? selectedOption.label)
        : '';
    const untouched =
      inputDisplayValue === '' ||
      (key === 'Delete' && inputDisplayValue === shownLabel);
    if (!untouched) return false;
    deselect();
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // A closed list must not let Enter submit the surrounding form.
    if (e.key === 'Enter' && !open) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (clearFromKey(e.key)) e.preventDefault();
      return;
    }
    createKeyboardActionHandler(
      {
        onOpen: () => handleOpenChange(true),
        onMoveDown: () => moveActive(1),
        onMoveUp: () => moveActive(-1),
        // The Radix Popover dismiss layer already closes the list on Escape.
        onEscape: () => undefined,
        onEnter: selectActive,
      },
      open
    )(e);
  };

  // Report the live input text so external adornments (e.g. a character
  // counter) reflect what's currently in the field, not just the last
  // committed selection.
  React.useEffect(() => {
    onInputValueChange?.(inputDisplayValue);
  }, [inputDisplayValue, onInputValueChange]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={modal}>
      <PopoverTrigger asChild>
        <input
          ref={inputRef}
          type="text"
          id={id}
          role="combobox"
          autoComplete="off"
          data-testid="form-combobox-input"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listEl?.id : undefined}
          aria-activedescendant={open ? activeOptionId : undefined}
          aria-invalid={ariaInvalid || isError || undefined}
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
            // Erasing the whole value (Backspace to the start, select-all
            // then delete, cut) deselects it: an empty box means no value.
            if (cleanVal === '' && hasSelection && !clearOnSelect) {
              onValueChange?.('');
            }
            if (!open) handleOpenChange(true, false);
          }}
          onMouseDown={() => {
            if (open) {
              clickingInputRef.current = true;
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            'border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 !h-11 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-none transition-[color,box-shadow] outline-none placeholder:text-slate-500 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
            applyTypography('body-medium'),
            selectedOption && 'text-slate-900',
            isError &&
              'ring-destructive/20 dark:ring-destructive/40 border-destructive',
            className
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        // The popup is only positioning around the listbox; Radix's default
        // role="dialog" (unnamed) is wrong for a combobox (WCAG 4.1.2).
        role="presentation"
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
        <Command
          value={activeValue}
          onValueChange={setActiveValue}
          shouldFilter={false}
          onMouseDown={e => e.preventDefault()}
        >
          <CommandList ref={setListEl} className="max-h-none overflow-hidden">
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
                          value={ADD_NEW_ITEM_VALUE}
                          onSelect={handleAddNew}
                          className={clsx(
                            'w-full cursor-pointer gap-1 overflow-hidden rounded-sm bg-neutral-200 p-3 text-slate-900 data-[selected=true]:bg-neutral-300',
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
                      value={LOADING_ITEM_VALUE}
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
                        // The real value, not the label: labels can repeat
                        // (e.g. two cities named "Ada"), which would leave
                        // arrow-key navigation stuck between the duplicates.
                        value={option.value}
                        onSelect={() => handleSelect(option.value)}
                        // WCAG 2.4.7: the active row is the one Enter picks,
                        // so it is drawn like the hover while the list is open.
                        className={cn(
                          'w-full min-w-0 gap-2 overflow-hidden rounded-sm p-3 hover:bg-neutral-100 hover:text-slate-900 data-[selected=true]:bg-neutral-100 data-[selected=true]:text-slate-900',
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
