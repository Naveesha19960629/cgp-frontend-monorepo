'use client';

import { CheckIcon } from 'lucide-react';

import * as React from 'react';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxList,
} from '@cgp/ui-kit/components/ui/combobox';
import { ScrollBar } from '@cgp/ui-kit/components/ui/scroll-area';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';
import { useDebouncedCallback } from 'use-debounce';

interface Option {
  label: string;
  id: string;
}

type LocationAutocompleteProps = {
  options: Option[];
  value: Option;
  placeholder?: string;
  EmptyIndicator?: string | React.ReactNode;
  loading?: boolean;
  isError?: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (option: Option) => void;
};

export function LocationAutocomplete({
  options,
  value,
  placeholder = 'Select a location',
  EmptyIndicator = 'No items found.',
  loading = false,
  isError = false,
  onSearchChange,
  onSelect,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = React.useState(value.label);
  const debouncedSearchChange = useDebouncedCallback(onSearchChange, 300);

  // Sync local input value when the selected value changes externally (e.g. form reset)
  const prevValueId = React.useRef(value.id);
  React.useEffect(() => {
    if (prevValueId.current !== value.id) {
      prevValueId.current = value.id;
      setInputValue(value.label);
    }
  }, [value.id, value.label]);

  return (
    <Combobox
      value={value}
      inputValue={inputValue}
      items={options}
      filteredItems={options}
      modal={true}
      itemToStringValue={(option: Option) => option.label}
      isItemEqualToValue={(a: Option, b: Option) => a.id === b.id}
      onInputValueChange={val => {
        const clean = removeEmoji(val);
        setInputValue(clean);
        debouncedSearchChange(clean);
      }}
      onValueChange={val => {
        const selectedOption = val as unknown as Option;
        if (selectedOption) {
          setInputValue(selectedOption.label);
          onSelect(selectedOption);
          onSearchChange(' ');
        }
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
        className="box-border h-11 bg-white shadow-none"
        aria-invalid={isError || undefined}
      />
      <ComboboxContent className="mt-2">
        {loading ? (
          <div className="p-3 text-sm font-medium text-slate-500">
            Searching...
          </div>
        ) : (
          <>
            <ComboboxEmpty className="p-0">{EmptyIndicator}</ComboboxEmpty>
            {options.length > 0 && (
              <ScrollAreaPrimitive.Root
                type="auto"
                className="relative m-0 overflow-hidden p-3"
                onWheelCapture={e => e.stopPropagation()}
              >
                <ScrollAreaPrimitive.Viewport className="max-h-[216px]">
                  <ComboboxList className="max-h-none overflow-y-clip p-0">
                    {(item: Option) => (
                      <ComboboxPrimitive.Item
                        key={item.id}
                        value={item}
                        className="pointer-events-auto flex w-full cursor-default items-center gap-2 rounded-sm py-3 pr-3 pl-2 text-sm font-medium text-slate-500 outline-hidden select-none data-highlighted:bg-neutral-100 data-highlighted:text-slate-900 data-selected:text-slate-900"
                      >
                        <ComboboxPrimitive.ItemIndicator
                          render={
                            <span className="flex size-4 shrink-0 items-center justify-center" />
                          }
                        >
                          <CheckIcon className="size-4" />
                        </ComboboxPrimitive.ItemIndicator>
                        {item.label}
                      </ComboboxPrimitive.Item>
                    )}
                  </ComboboxList>
                </ScrollAreaPrimitive.Viewport>
                <ScrollBar />
                <ScrollAreaPrimitive.Corner />
              </ScrollAreaPrimitive.Root>
            )}
          </>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
