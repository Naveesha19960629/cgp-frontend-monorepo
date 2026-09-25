import { Check, ChevronDown } from 'lucide-react';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DataTableFacetedFilterProps } from '@/views/vacancies/types';

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
import { useListHighlight } from '@cgp/ui-kit/hooks/use-list-highlight';
import { getKeyboardAction } from '@cgp/ui-kit/lib/keyboard-actions';
import { cn } from '@cgp/ui-kit/lib/utils';

export default function DataTableFacetedFilter({
  title,
  options,
  selectedValues,
  onSelectionChange,
  searchValue,
  onSearchChange,
  isLoading,
  hideSearch = false,
}: Readonly<DataTableFacetedFilterProps>) {
  const { t } = useTranslation('ats');
  const selectedSet = new Set(selectedValues);
  const commandRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  // As in the form multi-selects: drawn, and picked by Enter, once the user
  // moves it with the arrow keys.
  const highlight = useListHighlight({ open, search: searchValue ?? '' });

  // NFR-024 (ATS): Backspace or Delete clears the whole filter, as they
  // clear a clearable Select: on the focused button, or in the open list
  // once its search is empty. Until then they edit the search text.
  // Enter or a click still picks or unpicks one option.
  const clearFromKey = (event: React.KeyboardEvent) => {
    if (selectedValues.length === 0) return;
    if (getKeyboardAction(event, false) !== 'clear') return;
    event.preventDefault();
    onSelectionChange([]);
    setAnnouncement(t('vacancies.table.filter.cleared', { title }));
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    highlight.onKeyDown(event);
    if (event.key === 'Enter' && !highlight.shown) {
      event.preventDefault();
      return;
    }
    if (event.target instanceof HTMLInputElement && event.target.value) return;
    clearFromKey(event);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onKeyDown={clearFromKey}
          className="h-12 gap-2 rounded-lg border-slate-300 bg-white px-4! py-3 text-base font-medium text-slate-600 shadow-none hover:bg-white hover:text-slate-600"
        >
          {title}
          <ChevronDown className="size-4 shrink-0 text-shadow-zinc-800" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="h-62 w-55.25 rounded-lg p-0 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.16)]"
        align="start"
        aria-label={title}
        // With no search box, focus the list itself. Otherwise focus stays on
        // the popover and its arrow keys and Enter never reach cmdk (WCAG 2.1.1).
        onOpenAutoFocus={event => {
          if (!hideSearch) return;
          event.preventDefault();
          commandRef.current?.focus();
        }}
      >
        <Command
          ref={commandRef}
          onKeyDown={handleListKeyDown}
          shouldFilter={!onSearchChange}
          className="**:data-[slot=command-input-wrapper]:h-12"
        >
          {!hideSearch && (
            <CommandInput
              placeholder={t('vacancies.table.filter.filterSearchPlaceholder', {
                title: title?.toLowerCase(),
              })}
              {...(onSearchChange
                ? { value: searchValue, onValueChange: onSearchChange }
                : {})}
            />
          )}
          <CommandList
            className={cn(
              'overflow-auto pt-3 pb-3',
              !isLoading && options.length > 0 && 'px-3'
            )}
          >
            <CommandEmpty>
              {isLoading
                ? t('vacancies.table.filter.loading')
                : t('vacancies.table.filter.noResults')}
            </CommandEmpty>
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
                      setAnnouncement('');
                    }}
                    className={cn(
                      'group gap-2 rounded-sm px-3 py-3',
                      highlight.shown && 'data-[selected=true]:bg-accent'
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-[6px] border',
                        isSelected
                          ? 'border-[#075056] bg-[#075056] text-white'
                          : 'border-slate-300 bg-white'
                      )}
                    >
                      {isSelected && <Check className="size-3.5" />}
                    </div>
                    {option.icon && (
                      <option.icon className="text-muted-foreground size-4" />
                    )}
                    <span
                      className={cn(
                        'text-sm font-medium text-slate-500',
                        highlight.shown &&
                          'group-data-[selected=true]:text-slate-900'
                      )}
                    >
                      {option.label}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      {/* Always mounted: a live region that appears with its text is not
          announced. sr-only takes it out of the toolbar's flex gap. */}
      <output aria-live="polite" className="sr-only">
        {announcement}
      </output>
    </Popover>
  );
}
