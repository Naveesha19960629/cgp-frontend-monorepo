import { useQuery } from '@tanstack/react-query';

import { genderService } from '@/views/vacancies';

const GENDERS_QUERY_KEY = ['genders'] as const;

const useGendersQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: GENDERS_QUERY_KEY,
    queryFn: genderService.getGenders,
    enabled: options?.enabled ?? true,
  });
};

export { useGendersQuery };
