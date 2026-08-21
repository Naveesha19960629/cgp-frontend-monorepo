import { Add, SearchNormal1 } from 'iconsax-reactjs';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TemplateSortOrder } from '@/views/vacancies/types';
import { SEARCH_DEBOUNCE_MS } from '@/views/vacancies/utils/constants';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { Input } from '@cgp/ui-kit/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cgp/ui-kit/components/ui/select';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';

const sanitize = (value: string) =>
  removeEmoji(value).trimStart().replace(/ {2,}/g, ' ');

interface TemplatesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortOrder: TemplateSortOrder;
  onSortOrderChange: (value: TemplateSortOrder) => void;
  onCreate: () => void;
}

export default function TemplatesToolbar({
  search,
  onSearchChange,
  sortOrder,
  onSortOrderChange,
  onCreate,
}: Readonly<TemplatesToolbarProps>) {
  const { t } = useTranslation('ats');

  // Local input state keeps the field responsive while the API call is
  // debounced (render-time derived-state pattern, see VacancyFilteringSection).
  const [localSearch, setLocalSearch] = useState(search);
  const [prevPropSearch, setPrevPropSearch] = useState(search);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (search !== prevPropSearch) {
    setPrevPropSearch(search);
    setLocalSearch(search);
  }

  const handleSearchChange = (value: string) => {
    const clean = sanitize(value);
    setLocalSearch(clean);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(
      () => onSearchChange(clean),
      SEARCH_DEBOUNCE_MS
    );
  };

  const handleSearchBlur = () => {
    const trimmed = localSearch.trim();
    clearTimeout(searchTimerRef.current);
    setLocalSearch(trimmed);
    onSearchChange(trimmed);
  };

  useEffect(() => () => clearTimeout(searchTimerRef.current), []);

  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
      <Select
        value={sortOrder}
        onValueChange={value => onSortOrderChange(value as TemplateSortOrder)}
      >
        <SelectTrigger className="h-12 w-fit gap-2 rounded-lg border-slate-300 bg-white px-4 text-base font-medium text-slate-600 shadow-none [&_svg]:opacity-100">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NEWEST">{t('templates.sort.newest')}</SelectItem>
          <SelectItem value="OLDEST">{t('templates.sort.oldest')}</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative w-99.5 max-w-full">
        <SearchNormal1 className="absolute top-1/2 left-4 size-6 -translate-y-1/2 text-slate-900" />
        <Input
          placeholder={t('templates.searchPlaceholder')}
          value={localSearch}
          onChange={e => handleSearchChange(e.target.value)}
          onBlur={handleSearchBlur}
          className="h-12 w-full rounded-lg border-slate-300 bg-white pl-13 text-sm font-medium shadow-none placeholder:text-slate-400"
        />
      </div>

      <Button
        className="h-12 w-46 shrink-0 gap-1 rounded-lg"
        onClick={onCreate}
      >
        <Add className="size-5 stroke-2" />
        {t('templates.createButton')}
      </Button>
    </div>
  );
}
