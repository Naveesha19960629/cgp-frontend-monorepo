import { Search } from 'lucide-react';

import * as React from 'react';

import {
  useCareerPathsQuery,
  useDisciplinesQuery,
} from '@/views/vacancies/hooks';

import { Input } from '@cgp/ui-kit/components/ui/input';

import { DataTableFacetedFilter } from './data-table-faceted-filter';

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Unpublished', label: 'Unpublished' },
  { value: 'Live', label: 'Live' },
  { value: 'Active', label: 'Active' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Onhold', label: 'On Hold' },
];

interface VacancyFilteringSectionProps {
  search: string;
  onSearchChange: (value: string) => void;
  careerPathFilter: string;
  onCareerPathChange: (value: string) => void;
  disciplineFilter: string;
  onDisciplineChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

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

  const selectedCareerPaths = careerPathFilter
    ? careerPathFilter.split(',')
    : [];
  const selectedDisciplines = disciplineFilter
    ? disciplineFilter.split(',')
    : [];
  const selectedStatuses = statusFilter ? statusFilter.split(',') : [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DataTableFacetedFilter
        title="Career Path"
        options={careerPathOptions}
        selectedValues={selectedCareerPaths}
        onSelectionChange={values => onCareerPathChange(values.join(','))}
        searchValue={careerPathSearch}
        onSearchChange={setCareerPathSearch}
        isLoading={isCareerPathsLoading}
      />
      <DataTableFacetedFilter
        title="Discipline"
        options={disciplineOptions}
        selectedValues={selectedDisciplines}
        onSelectionChange={values => onDisciplineChange(values.join(','))}
        searchValue={disciplineSearch}
        onSearchChange={setDisciplineSearch}
        isLoading={isDisciplinesLoading}
      />
      <DataTableFacetedFilter
        title="Status"
        options={STATUS_OPTIONS}
        selectedValues={selectedStatuses}
        onSelectionChange={values => onStatusChange(values.join(','))}
      />
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="h-12 w-48 rounded-lg border-slate-200 pl-9"
        />
      </div>
    </div>
  );
}
