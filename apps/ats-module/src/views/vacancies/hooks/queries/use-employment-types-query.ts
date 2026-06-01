import { useQuery } from '@tanstack/react-query';

import { employmentTypeService } from '@/views/vacancies/services';

const EMPLOYMENT_TYPES_QUERY_KEY = (search: string) =>
  ['employment-types', search] as const;

const useEmploymentTypesQuery = (search: string = '') =>
  useQuery({
    queryKey: EMPLOYMENT_TYPES_QUERY_KEY(search),
    queryFn: () => employmentTypeService.getAllEmploymentTypes(search),
  });

export { useEmploymentTypesQuery };
