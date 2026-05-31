import { Check, ChevronDown } from 'lucide-react';

import * as React from 'react';

import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@cgp/ui-kit/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { cn } from '@cgp/ui-kit/lib/utils';

interface DataTableFacetedFilterProps {
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function DataTableFacetedFilter({
  title,
  options,
  selectedValues,
  onSelectionChange,
  searchValue,
  onSearchChange,
}: DataTableFacetedFilterProps) {
  const selectedSet = new Set(selectedValues);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-auto gap-2 rounded-lg border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-600 shadow-none hover:bg-white hover:text-slate-600"
        >
          {title}
          <ChevronDown className="size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[221px] rounded-lg p-0 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.16)]"
        align="start"
      >
        <Command
          shouldFilter={!onSearchChange}
          className="**:data-[slot=command-input-wrapper]:h-12"
        >
          <CommandInput
            placeholder={`Search ${title?.toLowerCase()}...`}
            {...(onSearchChange
              ? { value: searchValue, onValueChange: onSearchChange }
              : {})}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="p-0">
              {options.map(option => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const newSet = new Set(selectedSet);
                      if (isSelected) {
                        newSet.delete(option.value);
                      } else {
                        newSet.add(option.value);
                      }
                      onSelectionChange(Array.from(newSet));
                    }}
                    className="gap-2 px-3 py-3"
                  >
                    <div
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-[6px] border',
                        isSelected
                          ? 'border-[#075056] bg-[#075056] text-white'
                          : 'border-slate-300 bg-white'
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                    {option.icon && (
                      <option.icon className="text-muted-foreground size-4" />
                    )}
                    <span className="text-sm font-medium text-slate-500">
                      {option.label}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
