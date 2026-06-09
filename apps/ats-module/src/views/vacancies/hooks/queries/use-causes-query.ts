import { useQuery } from '@tanstack/react-query';

import { causeService } from '@/views/vacancies';

const CAUSES_QUERY_KEY = (search: string) => ['causes', search] as const;

const useCausesQuery = (search: string = '') =>
  useQuery({
    queryKey: CAUSES_QUERY_KEY(search),
    queryFn: () => causeService.getAllCauses(search),
  });

export { useCausesQuery };
