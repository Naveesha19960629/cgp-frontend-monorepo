import { SearchNormal1 } from 'iconsax-reactjs';

import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  DataTableFacetedFilter,
  type VacancyFilteringSectionProps,
} from '@/views/vacancies';
import {
  useCareerPathsQuery,
  useDisciplinesQuery,
} from '@/views/vacancies/hooks';

import { Input } from '@cgp/ui-kit/components/ui/input';

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
  const [careerPathSearch, setCareerPathSearch] = React.useState('');
  const [disciplineSearch, setDisciplineSearch] = React.useState('');

  const { data: careerPathsData, isLoading: isCareerPathsLoading } =
    useCareerPathsQuery(careerPathSearch);
  const { data: disciplinesData, isLoading: isDisciplinesLoading } =
    useDisciplinesQuery(disciplineSearch);

  const careerPathOptions = React.useMemo(
    () =>
      careerPathsData?.data.items.content.map(item => ({
        value: item.id,
        label: item.label,
      })) ?? [],
    [careerPathsData]
  );

  const disciplineOptions = React.useMemo(
    () =>
      disciplinesData?.data.items.content.map(item => ({
        value: item.id,
        label: item.label,
      })) ?? [],
    [disciplinesData]
  );

  const statusOptions = React.useMemo(
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
    <div className="flex flex-wrap items-center gap-3">
      <DataTableFacetedFilter
        title={t('vacancies.table.filter.careerPath')}
        options={careerPathOptions}
        selectedValues={selectedCareerPaths}
        onSelectionChange={values => onCareerPathChange(values.join(','))}
        searchValue={careerPathSearch}
        onSearchChange={setCareerPathSearch}
        isLoading={isCareerPathsLoading}
      />
      <DataTableFacetedFilter
        title={t('vacancies.table.filter.discipline')}
        options={disciplineOptions}
        selectedValues={selectedDisciplines}
        onSelectionChange={values => onDisciplineChange(values.join(','))}
        searchValue={disciplineSearch}
        onSearchChange={setDisciplineSearch}
        isLoading={isDisciplinesLoading}
      />
      <DataTableFacetedFilter
        title={t('vacancies.table.filter.status')}
        options={statusOptions}
        selectedValues={selectedStatuses}
        onSelectionChange={values => onStatusChange(values.join(','))}
        hideSearch
      />
      <div className="relative">
        <SearchNormal1 className="absolute top-1/2 left-4 size-6 -translate-y-1/2 text-slate-900" />
        <Input
          placeholder={t('vacancies.table.filter.searchPlaceholder')}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="h-12 w-99.5 rounded-lg border-slate-300 bg-white pl-13 text-sm font-medium shadow-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
