import { SearchNormal1 } from 'iconsax-reactjs';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DataTableFacetedFilter,
  type VacancyFilteringSectionProps,
} from '@/views/vacancies';
import { useVacancyFilterOptionsQuery } from '@/views/vacancies/hooks';
import { SEARCH_DEBOUNCE_MS } from '@/views/vacancies/utils';

import { Input } from '@cgp/ui-kit/components/ui/input';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';

const sanitize = (value: string) =>
  removeEmoji(value).trimStart().replace(/ {2,}/g, ' ');

export default function VacancyFilteringSection({
  search,
  onSearchChange,
  careerPathFilter,
  onCareerPathChange,
  disciplineFilter,
  onDisciplineChange,
  statusFilter,
  onStatusChange,
}: Readonly<VacancyFilteringSectionProps>) {
  const { t } = useTranslation('ats');

  // Main search — local input state keeps the field responsive while the
  // API call is debounced. We use the render-time derived-state pattern
  // (React docs recommendation) instead of useEffect to avoid cascading renders.
  // Because clearTimeout cancels every pending timer on each keystroke, only the
  // final typed value is ever sent upstream, so the prop echo always matches
  // localSearch and setLocalSearch becomes a no-op in that case.
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

  // Per-dropdown local search for client-side filtering of returned options.
  const [careerPathInput, setCareerPathInput] = useState('');
  const [disciplineInput, setDisciplineInput] = useState('');

  // Single API call for all filter options, synced with the committed main search.
  // `search` prop is the URL-committed value — the same term sent to the vacancy table query.
  const { data: filterOptionsData, isLoading: isFilterOptionsLoading } =
    useVacancyFilterOptionsQuery(search);

  const allCareerPathOptions = useMemo(
    () =>
      filterOptionsData?.data.careerPaths.map(item => ({
        value: item.id,
        label: item.label,
      })) ?? [],
    [filterOptionsData]
  );

  const allDisciplineOptions = useMemo(
    () =>
      filterOptionsData?.data.disciplines.map(item => ({
        value: item.id,
        label: item.label,
      })) ?? [],
    [filterOptionsData]
  );

  const statusOptions = useMemo(
    () =>
      filterOptionsData?.data.statuses.map(item => ({
        value: item.id,
        label: item.label,
      })) ?? [],
    [filterOptionsData]
  );

  // Client-side filter on dropdown search inputs.
  const careerPathOptions = useMemo(() => {
    if (!careerPathInput.trim()) return allCareerPathOptions;
    const lower = careerPathInput.toLowerCase();
    return allCareerPathOptions.filter(opt =>
      opt.label.toLowerCase().includes(lower)
    );
  }, [allCareerPathOptions, careerPathInput]);

  const disciplineOptions = useMemo(() => {
    if (!disciplineInput.trim()) return allDisciplineOptions;
    const lower = disciplineInput.toLowerCase();
    return allDisciplineOptions.filter(opt =>
      opt.label.toLowerCase().includes(lower)
    );
  }, [allDisciplineOptions, disciplineInput]);

  const selectedCareerPaths = careerPathFilter
    ? careerPathFilter.split(',')
    : [];
  const selectedDisciplines = disciplineFilter
    ? disciplineFilter.split(',')
    : [];
  const selectedStatuses = statusFilter ? statusFilter.split(',') : [];

  return (
    <div className="flex items-center gap-3">
      <DataTableFacetedFilter
        title={t('vacancies.table.filter.careerPath')}
        options={careerPathOptions}
        selectedValues={selectedCareerPaths}
        onSelectionChange={values => onCareerPathChange(values.join(','))}
        searchValue={careerPathInput}
        onSearchChange={value => setCareerPathInput(sanitize(value))}
        isLoading={isFilterOptionsLoading}
      />
      <DataTableFacetedFilter
        title={t('vacancies.table.filter.discipline')}
        options={disciplineOptions}
        selectedValues={selectedDisciplines}
        onSelectionChange={values => onDisciplineChange(values.join(','))}
        searchValue={disciplineInput}
        onSearchChange={value => setDisciplineInput(sanitize(value))}
        isLoading={isFilterOptionsLoading}
      />
      <DataTableFacetedFilter
        title={t('vacancies.table.filter.status')}
        options={statusOptions}
        selectedValues={selectedStatuses}
        onSelectionChange={values => onStatusChange(values.join(','))}
        hideSearch
      />
      <div className="relative w-80">
        <SearchNormal1 className="absolute top-1/2 left-4 size-6 -translate-y-1/2 text-slate-900" />
        <Input
          placeholder={t('vacancies.table.filter.searchPlaceholder')}
          value={localSearch}
          onChange={e => handleSearchChange(e.target.value)}
          onBlur={handleSearchBlur}
          className="h-12 w-full max-w-99.5 rounded-lg border-slate-300 bg-white pl-13 text-sm font-medium shadow-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
