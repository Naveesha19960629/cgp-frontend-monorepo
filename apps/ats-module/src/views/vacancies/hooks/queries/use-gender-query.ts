import { useQuery } from '@tanstack/react-query';

import { fetchGenders } from '@/views/vacancies/services/gender.service';

const GENDERS_QUERY_KEY = ['genders'] as const;

const useGendersQuery = () => {
  return useQuery({
    queryKey: GENDERS_QUERY_KEY,
    queryFn: fetchGenders,
  });
};

export { useGendersQuery };
