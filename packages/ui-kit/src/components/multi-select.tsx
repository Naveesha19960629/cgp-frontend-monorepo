'use client';

import { Check, ChevronDownIcon, Plus, X } from 'lucide-react';

import { Edit2, ImportCurve } from 'iconsax-reactjs';

import * as React from 'react';
import { forwardRef, useEffect } from 'react';

import { FieldTooltip } from '@cgp/ui-kit/components/field-tooltip';
import { Badge } from '@cgp/ui-kit/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@cgp/ui-kit/components/ui/command';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@cgp/ui-kit/components/ui/popover';
import { ScrollArea } from '@cgp/ui-kit/components/ui/scroll-area';
import { cn, removeEmoji } from '@cgp/ui-kit/lib/utils';
import { Command as CommandPrimitive, useCommandState } from 'cmdk';

export interface Option {
  value: string;
  label: string;
  disable?: boolean;
  /** fixed option that can't be removed. */
  fixed?: boolean;
  /**
   * Discipline-style chip icon (matches `disciplines-section` badges): import vs manual.
   */
  chipIcon?: 'import' | 'manual';
  /** `alt` text for the chip icon image. */
  chipIconAlt?: string;
  /** Same pattern as `FieldTooltip` on the discipline label: hover popover with title + optional image. */
  chipTooltipTitle?: string;
  /** Shown in the chip tooltip for import icons only; manual (pencil) chips never show an image. */
  chipTooltipImage?: string;
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined;
}
interface GroupOption {
  [key: string]: Option[];
}

interface MultipleSelectorProps {
  value?: Option[];
  defaultOptions?: Option[];
  /** manually controlled options */
  options?: Option[];
  placeholder?: string;
  /** Loading component. */
  loadingIndicator?: React.ReactNode;
  /** Externally controlled loading state. Shows loadingIndicator and hides emptyIndicator while true. */
  loading?: boolean;
  /** Empty component. */
  emptyIndicator?: React.ReactNode;
  /** Debounce time for async search. Only work with `onSearch`. */
  delay?: number;
  /**
   * Only work with `onSearch` prop. Trigger search when `onFocus`.
   * For example, when user click on the input, it will trigger the search to get initial options.
   **/
  triggerSearchOnFocus?: boolean;
  /** async search */
  onSearch?: (value: string) => Promise<Option[]>;
  /**
   * sync search. This search will not showing loadingIndicator.
   * The rest props are the same as async search.
   * i.e.: creatable, groupBy, delay.
   **/
  onSearchSync?: (value: string) => Option[];
  onChange?: (options: Option[]) => void;
  /** Limit the maximum number of selected options. */
  maxSelected?: number;
  /** When the number of selected options exceeds the limit, the onMaxSelected will be called. */
  onMaxSelected?: (maxLimit: number) => void;
  /** Hide the placeholder when there are options selected. */
  hidePlaceholderWhenSelected?: boolean;
  disabled?: boolean;
  /** Group the options base on provided key. */
  groupBy?: string;
  className?: string;
  badgeClassName?: string;
  /**
   * First item selected is a default behavior by cmdk. That is why the default is true.
   * This is a workaround solution by add a dummy item.
   *
   * @reference: https://github.com/pacocoursey/cmdk/issues/171
   */
  selectFirstItem?: boolean;
  /** Allow user to create option when there is no option matched. */
  creatable?: boolean;
  /** Props of `Command` */
  commandProps?: React.ComponentPropsWithoutRef<typeof Command>;
  /** Props of `CommandInput` */
  inputProps?: Omit<
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
    'value' | 'placeholder' | 'disabled'
  >;
  /** hide the clear all button. */
  hideClearAllButton?: boolean;
  /**
   * Keep already-selected options visible in the dropdown list.
   * Selected items are shown with a checkmark and clicking them deselects them.
   */
  keepSelectedInList?: boolean;
  /** Inline error message displayed between the input and the selected badges. */
  errorMessage?: string;
  /** Callback fired when the internal max-selected error state changes. */
  onErrorStateChange?: (hasError: boolean) => void;
}

export interface MultipleSelectorRef {
  selectedValue: Option[];
  input: HTMLInputElement;
  focus: () => void;
  reset: () => void;
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

function transToGroupOption(options: Option[], groupBy?: string) {
  if (options.length === 0) {
    return {};
  }
  if (!groupBy) {
    return {
      '': options,
    };
  }

  const groupOption: GroupOption = {};
  options.forEach(option => {
    const key = (option[groupBy] as string) || '';
    if (!groupOption[key]) {
      groupOption[key] = [];
    }
    groupOption[key].push(option);
  });
  return groupOption;
}

function removePickedOption(groupOption: GroupOption, picked: Option[]) {
  const cloneOption = JSON.parse(JSON.stringify(groupOption)) as GroupOption;

  for (const [key, value] of Object.entries(cloneOption)) {
    cloneOption[key] = value.filter(
      val => !picked.find(p => p.value === val.value)
    );
  }
  return cloneOption;
}

function isOptionsExist(groupOption: GroupOption, targetOption: Option[]) {
  for (const [, value] of Object.entries(groupOption)) {
    if (
      value.some(option => targetOption.find(p => p.value === option.value))
    ) {
      return true;
    }
  }
  return false;
}

function findExistingOptionByLabel(
  groupOption: GroupOption,
  label: string
): Option | undefined {
  for (const [, items] of Object.entries(groupOption)) {
    const found = items.find(
      opt => opt.label.toLowerCase() === label.toLowerCase()
    );
    if (found) return found;
  }
  return undefined;
}

/**
 * The `CommandEmpty` of shadcn/ui will cause the cmdk empty not rendering correctly.
 * So we create one and copy the `Empty` implementation from `cmdk`.
 *
 * @reference: https://github.com/hsuanyi-chou/shadcn-ui-expansions/issues/34#issuecomment-1949561607
 **/
const CommandEmpty = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof CommandPrimitive.Empty>
>(({ className, ...props }, forwardedRef) => {
  const render = useCommandState(state => state.filtered.count === 0);

  if (!render) return null;

  return (
    <div
      ref={forwardedRef}
      className={cn('py-6 text-center text-sm', className)}
      cmdk-empty=""
      role="presentation"
      {...props}
    />
  );
});

CommandEmpty.displayName = 'CommandEmpty';

const MultipleSelector = React.forwardRef<
  MultipleSelectorRef,
  MultipleSelectorProps
>(
  (
    {
      value,
      onChange,
      placeholder,
      defaultOptions: arrayDefaultOptions = [],
      options: arrayOptions,
      delay,
      onSearch,
      onSearchSync,
      loadingIndicator,
      loading: externalLoading = false,
      emptyIndicator,
      maxSelected = Number.MAX_SAFE_INTEGER,
      onMaxSelected,
      hidePlaceholderWhenSelected,
      disabled,
      groupBy,
      className,
      badgeClassName,
      selectFirstItem = true,
      creatable = false,
      triggerSearchOnFocus = false,
      commandProps,
      inputProps,
      hideClearAllButton = false,
      keepSelectedInList = false,
      errorMessage,
      onErrorStateChange,
    }: MultipleSelectorProps,
    ref: React.Ref<MultipleSelectorRef>
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [onScrollbar, setOnScrollbar] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const showLoading = isLoading || externalLoading;
    const dropdownRef = React.useRef<HTMLDivElement>(null); // Added this

    const [dropdownWidth, setDropdownWidth] = React.useState(0);

    const [selected, setSelected] = React.useState<Option[]>(value || []);
    const [options, setOptions] = React.useState<GroupOption>(
      transToGroupOption(arrayDefaultOptions, groupBy)
    );
    const [inputValue, setInputValue] = React.useState('');
    const debouncedSearchTerm = useDebounce(inputValue, delay || 500);
    const [showMaxError, setShowMaxError] = React.useState(false);
    const [userCreatedOptions, setUserCreatedOptions] = React.useState<
      Option[]
    >([]);
    const blockNextFocusRef = React.useRef(false);

    useEffect(() => {
      onErrorStateChange?.(showMaxError);
    }, [showMaxError, onErrorStateChange]);

    React.useImperativeHandle(
      ref,
      () => ({
        selectedValue: [...selected],
        input: inputRef.current as HTMLInputElement,
        focus: () => inputRef?.current?.focus(),
        reset: () => setSelected([]),
      }),
      [selected]
    );

    const handleUnselect = React.useCallback(
      (option: Option) => {
        const newOptions = selected.filter(s => s.value !== option.value);
        setSelected(newOptions);
        onChange?.(newOptions);
        if (newOptions.length < maxSelected) {
          setShowMaxError(false);
        }
      },
      [onChange, selected, maxSelected]
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        const input = inputRef.current;
        if (input) {
          // This is not a default behavior of the <input /> field
          if (e.key === 'Escape') {
            input.blur();
          }
        }
      },
      []
    );

    useEffect(() => {
      if (value) {
        setSelected(value);
        if (value.length < maxSelected) {
          setShowMaxError(false);
        }
      }
    }, [value, maxSelected]);

    useEffect(() => {
      /** If `onSearch` is provided, do not trigger options updated. */
      if (!arrayOptions || onSearch) {
        return;
      }
      const newOption = transToGroupOption(arrayOptions || [], groupBy);
      if (JSON.stringify(newOption) !== JSON.stringify(options)) {
        setOptions(newOption);
      }
    }, [arrayDefaultOptions, arrayOptions, groupBy, onSearch, options]);

    useEffect(() => {
      /** sync search */

      const doSearchSync = () => {
        const res = onSearchSync?.(debouncedSearchTerm.trim());
        setOptions(transToGroupOption(res || [], groupBy));
      };

      // eslint-disable-next-line @typescript-eslint/require-await
      const exec = async () => {
        if (!onSearchSync || !open) return;

        if (triggerSearchOnFocus) {
          doSearchSync();
        }

        if (debouncedSearchTerm) {
          doSearchSync();
        }
      };

      void exec();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus]);

    useEffect(() => {
      /** async search */

      const doSearch = async () => {
        setIsLoading(true);
        const res = await onSearch?.(debouncedSearchTerm.trim());
        setOptions(transToGroupOption(res || [], groupBy));
        setIsLoading(false);
      };

      const exec = async () => {
        if (!onSearch || !open) return;

        if (triggerSearchOnFocus) {
          await doSearch();
        }

        if (debouncedSearchTerm) {
          await doSearch();
        }
      };

      void exec();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, groupBy, open, triggerSearchOnFocus]);

    useEffect(() => {
      if (dropdownRef.current) {
        setDropdownWidth(dropdownRef.current.offsetWidth);
      }
    }, [open]);

    const CreatableItem = (disabled = false) => {
      if (!creatable) return undefined;
      if (
        isOptionsExist(allOptionsWithCreated, [
          { value: inputValue.trim(), label: inputValue.trim() },
        ]) ||
        selected.find(s => s.value === inputValue.trim()) ||
        selected.find(
          s => s.label.toLowerCase() === inputValue.trim().toLowerCase()
        )
      ) {
        return undefined;
      }

      const Item = (
        <CommandItem
          value={inputValue.trim()}
          disabled={disabled}
          className={cn(
            'm-3 flex items-center gap-1 overflow-hidden bg-neutral-200 py-2.5 text-sm font-medium text-slate-900',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          )}
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onSelect={(value: string) => {
            if (disabled) return;
            if (selected.length >= maxSelected) {
              onMaxSelected?.(selected.length);
              setShowMaxError(true);
              blockNextFocusRef.current = true;
              setOpen(false);
              inputRef.current?.blur();
              return;
            }
            const existingOption = findExistingOptionByLabel(
              allOptionsWithCreated,
              value
            );

            if (existingOption) {
              setInputValue('');
              const newOptions = [...selected, existingOption];
              setSelected(newOptions);
              onChange?.(newOptions);
              if (newOptions.length >= maxSelected) {
                setShowMaxError(true);
              }
              return;
            }
            setInputValue('');
            const newOption = { value, label: value };
            setUserCreatedOptions(prev => [...prev, newOption]);
            const newOptions = [...selected, newOption];
            setSelected(newOptions);
            onChange?.(newOptions);
            if (newOptions.length >= maxSelected) {
              setShowMaxError(true);
            }
          }}
        >
          <Plus className="size-6 shrink-0 text-slate-900" />
          <span className="flex min-w-0 flex-1 items-center gap-1">
            <span className="shrink-0">Add</span>
            <span className="flex min-w-0 flex-1 items-center">
              <span className="shrink-0">&ldquo;</span>
              <span className="min-w-0 truncate">{inputValue.trim()}</span>
              <span className="shrink-0">&rdquo;</span>
            </span>
          </span>
        </CommandItem>
      );

      // For normal creatable
      if (!onSearch && inputValue.trim().length > 0) {
        return Item;
      }

      // For async search creatable. avoid showing creatable item before loading at first.
      if (onSearch && debouncedSearchTerm.trim().length > 0 && !isLoading) {
        return Item;
      }

      return undefined;
    };

    const allOptionsWithCreated = React.useMemo<GroupOption>(() => {
      const merged = JSON.parse(JSON.stringify(options)) as GroupOption;
      const existingValues = new Set(
        Object.values(merged)
          .flat()
          .map((o: Option) => o.value)
      );
      const newCreated = userCreatedOptions.filter(
        co => !existingValues.has(co.value)
      );
      if (newCreated.length > 0) {
        merged[''] = [...(merged[''] || []), ...newCreated];
      }
      return merged;
    }, [options, userCreatedOptions]);

    const selectables = React.useMemo<GroupOption>(() => {
      if (keepSelectedInList) {
        // Ensure all currently selected options are visible in the dropdown,
        // including user-created / PENDING options loaded from saved form data
        // that may not yet be present in the API options or userCreatedOptions.
        const allValues = new Set(
          Object.values(allOptionsWithCreated)
            .flat()
            .map(o => o.value)
        );
        const missing = selected.filter(s => !allValues.has(s.value));
        if (missing.length === 0) return allOptionsWithCreated;
        return {
          ...allOptionsWithCreated,
          '': [...(allOptionsWithCreated[''] ?? []), ...missing],
        };
      }
      return removePickedOption(allOptionsWithCreated, selected);
    }, [keepSelectedInList, allOptionsWithCreated, selected]);

    const hasSelectableOptions = React.useMemo(() => {
      const searchTerm = inputValue.trim().toLowerCase();
      return Object.values(selectables).some(items =>
        items.some(
          item => !searchTerm || item.label.toLowerCase().includes(searchTerm)
        )
      );
    }, [selectables, inputValue]);

    const EmptyItem = React.useCallback(() => {
      if (!emptyIndicator || showLoading) return undefined;

      // When options are externally/server managed, cmdk's filtered.count includes the
      // creatable item which prevents CommandEmpty from rendering. Use a plain div instead.
      if (arrayOptions !== undefined || onSearch || onSearchSync) {
        return !hasSelectableOptions ? (
          <div className="">{emptyIndicator}</div>
        ) : undefined;
      }

      return <CommandEmpty>{emptyIndicator}</CommandEmpty>;
    }, [
      arrayOptions,
      emptyIndicator,
      hasSelectableOptions,
      onSearch,
      onSearchSync,
      showLoading,
    ]);

    /** Avoid Creatable Selector freezing or lagging when paste a long string. */
    const commandFilter = React.useCallback(() => {
      if (commandProps?.filter) {
        return commandProps.filter;
      }

      if (creatable) {
        return (value: string, search: string) => {
          return value.toLowerCase().includes(search.trim().toLowerCase())
            ? 1
            : -1;
        };
      }
      // Using default filter in `cmdk`. We don't have to provide it.
      return undefined;
    }, [creatable, commandProps?.filter]);
    return (
      <>
        <Popover open={open} onOpenChange={setOpen} modal>
          <Command
            ref={dropdownRef}
            {...commandProps}
            onKeyDown={e => {
              handleKeyDown(e);
              commandProps?.onKeyDown?.(e);
            }}
            className={cn(
              'h-auto overflow-visible bg-transparent',
              commandProps?.className
            )}
            shouldFilter={
              commandProps?.shouldFilter !== undefined
                ? commandProps.shouldFilter
                : !onSearch
            } // When onSearch is provided, we don't want to filter the options. You can still override it.
            filter={commandFilter()}
          >
            <PopoverAnchor asChild>
              <div
                className={cn(
                  'border-input ring-offset-background focus-within:ring-ring flex h-11 items-center justify-between rounded-md border px-3 py-2 text-base shadow-none transition-[color,box-shadow] focus-within:ring-2 focus-within:ring-offset-2 md:text-sm',
                  {
                    'cursor-text': !disabled && selected.length !== 0,
                    'border-destructive': showMaxError && !!errorMessage,
                  },
                  className
                )}
                data-layout="wrapper"
                onClick={() => {
                  if (disabled) return;
                  inputRef?.current?.focus();
                }}
              >
                <div className="relative flex min-w-0 flex-1 flex-wrap gap-1">
                  {/* Avoid having the "Search" Icon */}
                  <CommandPrimitive.Input
                    {...inputProps}
                    ref={inputRef}
                    value={inputValue}
                    disabled={disabled}
                    onValueChange={value => {
                      const trimmedValue = removeEmoji(
                        value.trimStart().replace(/  +/g, ' ')
                      );
                      setInputValue(trimmedValue);
                      inputProps?.onValueChange?.(trimmedValue);
                    }}
                    onBlur={event => {
                      if (!onScrollbar) {
                        setOpen(false);
                      }
                      inputProps?.onBlur?.(event);
                    }}
                    onFocus={event => {
                      setOpen(true);
                      inputProps?.onFocus?.(event);
                    }}
                    placeholder={
                      hidePlaceholderWhenSelected && selected.length !== 0
                        ? ''
                        : placeholder
                    }
                    className={cn(
                      'placeholder:text-muted-foreground flex-1 self-baseline bg-transparent outline-none',
                      {
                        'w-full': hidePlaceholderWhenSelected,
                        'ml-0': selected.length !== 0,
                      },
                      inputProps?.className
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setSelected(selected.filter(s => s.fixed));
                    onChange?.(selected.filter(s => s.fixed));
                  }}
                  className={cn(
                    'size-5',
                    (hideClearAllButton ||
                      disabled ||
                      selected.length < 1 ||
                      selected.filter(s => s.fixed).length ===
                        selected.length) &&
                      'hidden'
                  )}
                >
                  <X />
                </button>
                <ChevronDownIcon
                  className={cn(
                    'text-muted-foreground/50 size-5',
                    (hideClearAllButton ||
                      disabled ||
                      selected.length >= 1 ||
                      selected.filter(s => s.fixed).length !==
                        selected.length) &&
                      'hidden'
                  )}
                />
              </div>
            </PopoverAnchor>
            <PopoverContent
              className="mt-1 max-w-[376px] border-none p-0 shadow-none"
              align="start"
              style={{ width: dropdownWidth }}
              onOpenAutoFocus={e => e.preventDefault()}
              onInteractOutside={e => {
                if (
                  e.target instanceof Element &&
                  (e.target.hasAttribute('cmdk-input') ||
                    e.target.closest('[data-layout="wrapper"]'))
                ) {
                  e.preventDefault();
                }
              }}
            >
              <div className="bg-popover text-popover-foreground animate-in z-10 w-full rounded-md border shadow-md outline-none">
                {CreatableItem(showLoading)}
                <CommandList
                  className="max-h-none overflow-visible"
                  onMouseLeave={() => {
                    setOnScrollbar(false);
                  }}
                  onMouseEnter={() => {
                    setOnScrollbar(true);
                  }}
                  onMouseUp={() => {
                    if (blockNextFocusRef.current) {
                      blockNextFocusRef.current = false;
                      return;
                    }
                    inputRef?.current?.focus();
                  }}
                >
                  {/* <ScrollArea className="[&_[data-radix-scroll-area-viewport]]:max-h-[272px] [&_[data-radix-scroll-area-viewport]>div]:max-w-full"> */}

                  <ScrollArea
                    className={cn(
                      '[&_[data-radix-scroll-area-viewport]]:max-h-[228px] [&_[data-radix-scroll-area-viewport]>div]:max-w-full',
                      !CreatableItem() &&
                        '[&_[data-radix-scroll-area-viewport]]:max-h-[272px]'
                    )}
                  >
                    {showLoading ? (
                      <div className={cn(!CreatableItem() && 'pt-3')}>
                        {loadingIndicator}
                      </div>
                    ) : (
                      <>
                        {EmptyItem()}
                        {/* Fallback: dropdown open but no options and no emptyIndicator (e.g. debounce gap) */}
                        {!hasSelectableOptions &&
                          !emptyIndicator &&
                          loadingIndicator && (
                            <div className={cn(!CreatableItem() && 'pt-3')}>
                              {loadingIndicator}
                            </div>
                          )}
                        {!selectFirstItem && (
                          <CommandItem value="-" className="hidden" />
                        )}

                        {Object.entries(selectables).map(([key, dropdowns]) => (
                          <CommandGroup
                            key={key}
                            heading={key}
                            className="pt-0 pr-3 pb-3 pl-3"
                          >
                            <>
                              {dropdowns.map(option => {
                                const isSelected =
                                  keepSelectedInList &&
                                  selected.some(s => s.value === option.value);
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    disabled={option.disable}
                                    onMouseDown={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onSelect={() => {
                                      if (option.disable) return;
                                      if (isSelected) {
                                        handleUnselect(option);
                                        return;
                                      }
                                      if (selected.length >= maxSelected) {
                                        onMaxSelected?.(selected.length);
                                        setShowMaxError(true);
                                        blockNextFocusRef.current = true;
                                        setOpen(false);
                                        inputRef.current?.blur();
                                        return;
                                      }
                                      setInputValue('');
                                      const newOptions = [...selected, option];
                                      setSelected(newOptions);
                                      onChange?.(newOptions);
                                      if (newOptions.length >= maxSelected) {
                                        setShowMaxError(true);
                                      }
                                    }}
                                    className={cn(
                                      'cursor-pointer overflow-hidden px-0 text-sm text-slate-500 not-first:py-3 first:pt-3 first:pb-3 last:pb-0 aria-[selected="true"]:bg-white aria-[selected="true"]:text-slate-500 data-[disabled="true"]:opacity-100',
                                      CreatableItem() && 'first:pt-0',
                                      option.disable &&
                                        'text-muted-foreground cursor-default hover:bg-white'
                                    )}
                                  >
                                    {option.disable && isSelected ? (
                                      <div
                                        className="bg-muted-foreground/70 ring-muted-foreground/30 mr-2 flex size-5 shrink-0 items-center justify-center rounded-[6px] ring-1"
                                        aria-hidden
                                      >
                                        <Check className="size-3.5 text-white" />
                                      </div>
                                    ) : option.disable ? (
                                      <div
                                        className="border-muted-foreground/60 bg-muted/40 mr-2 box-border flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-dashed"
                                        aria-hidden
                                      />
                                    ) : !isSelected ? (
                                      <div className="mr-2 box-border flex size-5 shrink-0 rounded-[6px] border border-slate-300 bg-white"></div>
                                    ) : (
                                      <div className="bg-brand-primary-500 mr-2 flex size-5 shrink-0 items-center justify-center rounded-[6px]">
                                        <Check className="bg-brand-primary-500 size-3.5 text-white" />
                                      </div>
                                    )}
                                    <span className="truncate">
                                      {option.label}
                                    </span>
                                  </CommandItem>
                                );
                              })}
                            </>
                          </CommandGroup>
                        ))}
                      </>
                    )}
                  </ScrollArea>
                </CommandList>
              </div>
            </PopoverContent>
          </Command>
        </Popover>
        {showMaxError && errorMessage && (
          <p className="text-destructive mt-2 text-sm font-medium">
            {errorMessage}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-3">
          {selected.map(option => {
            const useChipStyle = Boolean(option.chipIcon);
            const hasTooltip =
              useChipStyle &&
              (option.chipTooltipTitle || option.chipTooltipImage);
            const badge = (
              <Badge
                key={option.value}
                variant={useChipStyle ? 'chip' : undefined}
                className={cn(
                  useChipStyle
                    ? 'animate-fadeIn flex cursor-default items-center gap-2 pe-2 text-sm font-semibold break-all text-slate-600'
                    : 'box-border flex items-center gap-2 rounded-[8px] border border-neutral-200 bg-[linear-gradient(97deg,#E4F0F1,#F1F5F9_41.18%)] p-3 text-sm font-semibold break-all text-slate-600',
                  'data-[disabled]:bg-muted-foreground data-[disabled]:text-muted data-[disabled]:hover:bg-muted-foreground',
                  'data-[fixed]:bg-muted-foreground data-[fixed]:hover:bg-muted-foreground',
                  badgeClassName
                )}
                data-fixed={option.fixed}
                data-disabled={disabled || undefined}
              >
                {option.chipIcon ? (
                  option.chipIcon === 'import' ? (
                    <ImportCurve size={24} color="#475569" variant="Bold" />
                  ) : (
                    <Edit2 size={24} color="#475569" variant="Bold" />
                  )
                ) : null}
                <span className={cn('min-w-0', useChipStyle && 'capitalize')}>
                  {option.label}
                </span>
                <button
                  type="button"
                  className={cn(
                    'ring-offset-background focus:ring-ring ml-0 cursor-pointer rounded-full outline-none focus:ring-2 focus:ring-offset-2',
                    (disabled || option.fixed) && 'hidden'
                  )}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleUnselect(option);
                    }
                  }}
                  onMouseDown={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    handleUnselect(option);
                  }}
                >
                  <X className="text-muted-foreground hover:text-foreground size-4" />
                </button>
              </Badge>
            );
            return hasTooltip ? (
              <FieldTooltip
                key={option.value}
                title={option.chipTooltipTitle}
                image={
                  option.chipIcon === 'manual'
                    ? undefined
                    : option.chipTooltipImage
                }
                triggerClassName="inline-flex"
                contentClassName="w-fit whitespace-nowrap"
                align="start"
                alignOffset={0}
              >
                {badge}
              </FieldTooltip>
            ) : (
              badge
            );
          })}
        </div>
      </>
    );
  }
);

MultipleSelector.displayName = 'MultipleSelect';
export default MultipleSelector;
