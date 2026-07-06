import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

const sortOrderOptions = ['NEWEST', 'OLDEST'] as const;

/**
 * URL-synced state for the Templates list: page (1-indexed), size, search, and
 * sort direction. `sortOrder` maps to the backend `sortOrder` query param.
 */
const useVacancyTemplatesTableParams = () =>
  useQueryStates({
    page: parseAsInteger.withDefault(1),
    size: parseAsInteger.withDefault(12),
    search: parseAsString.withDefault(''),
    sortOrder: parseAsStringLiteral(sortOrderOptions).withDefault('NEWEST'),
  });

export { useVacancyTemplatesTableParams };
