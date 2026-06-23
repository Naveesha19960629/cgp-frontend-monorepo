import { SearchNormal1 } from 'iconsax-reactjs';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DataTableFacetedFilter,
  type VacancyFilteringSectionProps,
} from '@/views/vacancies';
import {
  useCareerPathsQuery,
  useDisciplinesQuery,
} from '@/views/vacancies/hooks';
import { SEARCH_DEBOUNCE_MS } from '@/views/vacancies/utils';

import { Input } from '@cgp/ui-kit/components/ui/input';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';

const STATUS_VALUES = [
  { value: 'Draft', labelKey: 'vacancies.table.filter.statusOptions.draft' },
  {
    value: 'Unpublished',
    labelKey: 'vacancies.table.filter.statusOptions.unpublished',
  },
  { value: 'Live', labelKey: 'vacancies.table.filter.statusOptions.live' },
  {
    value: 'Expired',
    labelKey: 'vacancies.table.filter.statusOptions.expired',
  },
  { value: 'Onhold', labelKey: 'vacancies.table.filter.statusOptions.onHold' },
];

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
}: VacancyFilteringSectionProps) {
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

  // Career path filter search — separate display vs query state so the
  // CommandInput stays responsive while the API call is debounced.
  const [careerPathInput, setCareerPathInput] = useState('');
  const [careerPathSearch, setCareerPathSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(
      () => setCareerPathSearch(careerPathInput),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [careerPathInput]);

  // Discipline filter search — same pattern.
  const [disciplineInput, setDisciplineInput] = useState('');
  const [disciplineSearch, setDisciplineSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(
      () => setDisciplineSearch(disciplineInput),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [disciplineInput]);

  const { data: careerPathsData, isLoading: isCareerPathsLoading } =
    useCareerPathsQuery(careerPathSearch);
  const { data: disciplinesData, isLoading: isDisciplinesLoading } =
    useDisciplinesQuery(disciplineSearch);

  const careerPathItems = Array.isArray(careerPathsData?.data?.items?.content)
    ? careerPathsData.data.items.content
    : [];
  const disciplineItems = Array.isArray(disciplinesData?.data?.items?.content)
    ? disciplinesData.data.items.content
    : [];

  const careerPathOptions = useMemo(
    () =>
      careerPathItems.map(item => ({
        value: item.id,
        label: item.label,
      })) ?? [],
    [careerPathItems]
  );

  const disciplineOptions = useMemo(
    () =>
      disciplineItems.map(item => ({
        value: item.id,
        label: item.label,
      })) ?? [],
    [disciplineItems]
  );

  const statusOptions = useMemo(
    () => STATUS_VALUES.map(s => ({ value: s.value, label: t(s.labelKey) })),
    [t]
  );

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
        isLoading={isCareerPathsLoading}
      />
      <DataTableFacetedFilter
        title={t('vacancies.table.filter.discipline')}
        options={disciplineOptions}
        selectedValues={selectedDisciplines}
        onSelectionChange={values => onDisciplineChange(values.join(','))}
        searchValue={disciplineInput}
        onSearchChange={value => setDisciplineInput(sanitize(value))}
        isLoading={isDisciplinesLoading}
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
