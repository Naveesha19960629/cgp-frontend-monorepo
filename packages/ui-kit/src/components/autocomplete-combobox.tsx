import { Plus } from 'lucide-react';

import * as React from 'react';
import { useTranslation } from 'react-i18next';

import noDataFoundImage from '@/assets/images/no_data_found.png';

import { Input } from '@cgp/ui-kit/components/ui/input';
import {
  type KeyboardActionHandlers,
  createKeyboardActionHandler,
} from '@cgp/ui-kit/lib/keyboard-actions';
import { cn } from '@cgp/ui-kit/lib/utils';

interface AutocompleteComboboxOption {
  value: string;
  label: string;
}

interface AutocompleteComboboxProps {
  options: AutocompleteComboboxOption[];
  value?: string;
  selectedValue?: string;
  showSelectedOnlyWhenIdle?: boolean;
  onInputChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  onSelect?: (option: AutocompleteComboboxOption) => void;
  onAddNew?: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  selectOnExactInput?: boolean;
  clearOnSelect?: boolean;
  'aria-invalid'?: boolean;
}

export function AutocompleteCombobox({
  options,
  value = '',
  selectedValue,
  showSelectedOnlyWhenIdle = false,
  onInputChange,
  onSearchChange,
  onSelect,
  onAddNew,
  placeholder = 'Type to search...',
  onFocus,
  emptyMessage: _emptyMessage = 'No option found.',
  loadingMessage = 'Searching...',
  loading = false,
  disabled = false,
  maxLength,
  className,
  selectOnExactInput = false,
  clearOnSelect = false,
  'aria-invalid': ariaInvalid,
}: Readonly<AutocompleteComboboxProps>) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const getScrollableAncestor = React.useCallback((element: HTMLElement) => {
    let currentElement: HTMLElement | null = element.parentElement;
    while (currentElement) {
      const style = window.getComputedStyle(currentElement);
      const isScrollable =
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        currentElement.scrollHeight > currentElement.clientHeight;

      if (isScrollable) {
        return currentElement;
      }

      currentElement = currentElement.parentElement;
    }

    return null;
  }, []);

  React.useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  const resetInputToCommittedValue = React.useCallback(() => {
    const committedValue = value ?? '';
    setInputValue(committedValue);
    onSearchChange?.(committedValue);
    setHighlightedIndex(-1);
  }, [onSearchChange, value]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        resetInputToCommittedValue();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [resetInputToCommittedValue]);

  const normalizedInput = inputValue.trim().toLowerCase();
  const filteredOptions = React.useMemo(() => {
    if (!normalizedInput && showSelectedOnlyWhenIdle && selectedValue) {
      const selectedOption = options.find(
        option => option.value === selectedValue
      );
      return selectedOption ? [selectedOption] : options;
    }

    if (!normalizedInput) {
      return options;
    }

    return options.filter(option =>
      option.label.toLowerCase().includes(normalizedInput)
    );
  }, [options, normalizedInput, showSelectedOnlyWhenIdle, selectedValue]);

  const exactMatchOption = options.find(
    option =>
      option.label.toLowerCase() === normalizedInput ||
      option.value.toLowerCase() === normalizedInput
  );

  const hasExactMatch = Boolean(exactMatchOption);

  const hasAddNewRow = Boolean(onAddNew);
  const canAddNew = normalizedInput.length > 0 && !hasExactMatch;
  const isNoDataState = !loading && filteredOptions.length === 0;
  const hasTypedSearch = normalizedInput.length > 0;

  React.useEffect(() => {
    const rootElement = rootRef.current;
    const dropdownElement = dropdownRef.current;

    if (!open || !rootElement || !dropdownElement) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const dropdownRect = dropdownElement.getBoundingClientRect();

      const scrollContainer =
        rootElement.closest<HTMLElement>('[data-radix-scroll-area-viewport]') ??
        getScrollableAncestor(rootElement);

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        if (dropdownRect.bottom > containerRect.bottom) {
          const scrollOffset = dropdownRect.bottom - containerRect.bottom + 12;
          scrollContainer.scrollBy({ top: scrollOffset, behavior: 'smooth' });
        }
        return;
      }

      if (dropdownRect.bottom > window.innerHeight) {
        const scrollOffset = dropdownRect.bottom - window.innerHeight + 12;
        window.scrollBy({ top: scrollOffset, behavior: 'smooth' });
      }
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    open,
    loading,
    filteredOptions.length,
    hasAddNewRow,
    getScrollableAncestor,
  ]);

  const totalItems = hasAddNewRow
    ? filteredOptions.length + 1
    : filteredOptions.length;

  const handleInputValueChange = (rawValue: string) => {
    let nextValue = rawValue;
    if (maxLength) {
      nextValue = rawValue.slice(0, maxLength);
    }

    const normalizedNextValue = nextValue.trim().toLowerCase();
    const exactMatch = options.find(
      option =>
        option.label.toLowerCase() === normalizedNextValue ||
        option.value.toLowerCase() === normalizedNextValue
    );

    if (selectOnExactInput && exactMatch) {
      handleSelect(exactMatch);
      onSearchChange?.(nextValue);
      return;
    }

    setInputValue(nextValue);
    onInputChange?.(nextValue);
    onSearchChange?.(nextValue);
    setOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = React.useCallback(
    (option: AutocompleteComboboxOption) => {
      if (clearOnSelect) {
        setInputValue('');
        onInputChange?.('');
      } else {
        setInputValue(option.label);
        onInputChange?.(option.label);
      }
      onSelect?.(option);
      setOpen(false);
      setHighlightedIndex(-1);
    },
    [onInputChange, onSelect, clearOnSelect]
  );

  const handleAddNew = React.useCallback(() => {
    const newValue = inputValue.trim();
    if (!newValue || !onAddNew) {
      return;
    }

    onAddNew(newValue);
    if (clearOnSelect) {
      setInputValue('');
      onInputChange?.('');
    }
    setOpen(false);
    setHighlightedIndex(-1);
  }, [inputValue, onAddNew, clearOnSelect, onInputChange]);

  const moveHighlightDown = React.useCallback(() => {
    setHighlightedIndex(prev =>
      totalItems <= 0 ? -1 : Math.min(prev + 1, totalItems - 1)
    );
  }, [totalItems]);

  const moveHighlightUp = React.useCallback(() => {
    setHighlightedIndex(prev => Math.max(prev - 1, -1));
  }, []);

  const handleEnterSelection = React.useCallback(() => {
    if (hasAddNewRow && highlightedIndex === 0) {
      handleAddNew();
      return;
    }

    let optionIndex = highlightedIndex;
    if (hasAddNewRow) {
      optionIndex = highlightedIndex - 1;
    }

    if (optionIndex >= 0 && optionIndex < filteredOptions.length) {
      handleSelect(filteredOptions[optionIndex]);
      return;
    }

    if (hasAddNewRow) {
      handleAddNew();
    }
  }, [
    hasAddNewRow,
    highlightedIndex,
    filteredOptions,
    handleAddNew,
    handleSelect,
  ]);

  const keyboardHandlers: KeyboardActionHandlers = React.useMemo(
    () => ({
      onOpen: () => setOpen(true),
      onMoveDown: moveHighlightDown,
      onMoveUp: moveHighlightUp,
      onEscape: () => {
        setOpen(false);
        resetInputToCommittedValue();
      },
      onEnter: handleEnterSelection,
    }),
    [
      moveHighlightDown,
      moveHighlightUp,
      handleEnterSelection,
      resetInputToCommittedValue,
    ]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) =>
      createKeyboardActionHandler(keyboardHandlers, open)(event),
    [keyboardHandlers, open]
  );

  const renderDropdownContent = () => {
    if (loading) {
      return (
        <div
          data-testid="combobox-loading"
          className="text-[14px] leading-5 font-medium text-slate-500"
        >
          {loadingMessage}
        </div>
      );
    }

    if (filteredOptions.length === 0) {
      if (!hasTypedSearch) {
        return null;
      }

      return (
        <div className="flex w-full justify-center">
          <div className="w-61.25">
            <img
              src={noDataFoundImage}
              alt="No data found"
              className="mb-4 size-18.5 object-contain"
            />
            <p className="mb-1 text-[16px] leading-6 font-semibold text-slate-900">
              {t('autocompleteCombobox.noDataTitle')}
            </p>
            <p className="text-[14px] leading-5 font-semibold text-slate-700">
              {t('autocompleteCombobox.noDataDescription')}
            </p>
            <p className="text-[14px] leading-5 font-semibold text-slate-700">
              {t('autocompleteCombobox.noDataHint')}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-0">
        {filteredOptions.map((option, index) => {
          let visualIndex = index;
          if (hasAddNewRow) {
            visualIndex = index + 1;
          }

          const isSelected =
            selectedValue !== undefined && option.value === selectedValue;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={cn(
                'h-11 w-full min-w-0 overflow-hidden rounded-[8px] px-3 py-3 text-left text-sm leading-5 font-medium text-slate-500 transition-colors hover:bg-slate-100',
                highlightedIndex === visualIndex && 'bg-slate-100',
                isSelected && 'bg-blue-50'
              )}
              title={option.label}
            >
              <span className="block w-full truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const getDropdownHeightClass = () => {
    if (loading) return 'h-[100px] overflow-y-hidden';
    if (isNoDataState) return 'h-[258px] overflow-y-hidden';
    return 'h-[272px] overflow-y-auto';
  };

  return (
    <div ref={rootRef} className={cn('relative w-full min-w-0', className)}>
      <div data-testid="combobox">
        <Input
          data-testid="combobox-input"
          aria-invalid={ariaInvalid}
          value={inputValue}
          onChange={event => handleInputValueChange(event.target.value)}
          onFocus={() => {
            setOpen(true);
            onFocus?.();
          }}
          onBlur={event => {
            const nextFocusedElement = event.relatedTarget as Node | null;
            if (
              nextFocusedElement &&
              rootRef.current?.contains(nextFocusedElement)
            ) {
              return;
            }

            setOpen(false);
            resetInputToCommittedValue();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="h-11 w-full min-w-0 shadow-none"
        />
      </div>

      {open && !disabled && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute left-0 z-50 mt-2 w-full max-w-full min-w-full overflow-x-hidden rounded-[8px] bg-white p-3 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.16)]',
            getDropdownHeightClass()
          )}
        >
          {hasAddNewRow && hasTypedSearch && (
            <button
              type="button"
              data-testid="combobox-add-new"
              onClick={handleAddNew}
              disabled={!canAddNew}
              className={cn(
                'flex h-11 w-full min-w-0 items-center gap-1 overflow-hidden rounded-[8px] bg-neutral-200 px-3 py-3 text-left text-sm leading-5 font-medium text-slate-900 transition-colors hover:bg-neutral-300',
                isNoDataState ? 'mb-6' : 'mb-3',
                highlightedIndex === 0 && 'bg-neutral-300',
                !canAddNew && 'cursor-not-allowed opacity-50'
              )}
            >
              <Plus className="size-5 shrink-0" />
              <span className="block min-w-0 flex-1 truncate">
                {canAddNew ? `Add "${inputValue.trim()}"` : 'Add New'}
              </span>
            </button>
          )}

          {renderDropdownContent()}
        </div>
      )}
    </div>
  );
}

export type { AutocompleteComboboxOption };
