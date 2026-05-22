import { genderService } from '@/views/vacancies';

import { useQuery } from '@cgp/data-access';

const GENDERS_QUERY_KEY = ['genders'] as const;

const useGendersQuery = () => {
  return useQuery({
    queryKey: GENDERS_QUERY_KEY,
    queryFn: genderService.getGenders,
  });
};

export { useGendersQuery };
