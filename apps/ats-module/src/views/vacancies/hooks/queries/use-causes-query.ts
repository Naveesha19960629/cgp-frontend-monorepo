import { causeService } from '@/views/vacancies';

import { useQuery } from '@cgp/data-access';

const CAUSES_QUERY_KEY = (search: string) => ['causes', search] as const;

const useCausesQuery = (search: string = '') =>
  useQuery({
    queryKey: CAUSES_QUERY_KEY(search),
    queryFn: () => causeService.getAllCauses(search),
  });

export { useCausesQuery };
