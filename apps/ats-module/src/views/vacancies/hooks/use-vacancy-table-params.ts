import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

const sortOrderOptions = ['asc', 'desc'] as const;

const useVacancyTableParams = () =>
  useQueryStates({
    page: parseAsInteger.withDefault(0),
    size: parseAsInteger.withDefault(12),
    sortBy: parseAsString.withDefault(''),
    sortOrder: parseAsStringLiteral(sortOrderOptions).withDefault('asc'),
    search: parseAsString.withDefault(''),
    careerPath: parseAsString.withDefault(''),
    discipline: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
  });

export { useVacancyTableParams };
