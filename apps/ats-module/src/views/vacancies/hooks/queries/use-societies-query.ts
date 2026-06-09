import { useQuery } from '@tanstack/react-query';

import { societyService } from '@/views/vacancies/services';

const SOCIETIES_QUERY_KEY = (search: string) => ['societies', search] as const;

const useSocietiesQuery = (search: string, enabled = true) =>
  useQuery({
    queryKey: SOCIETIES_QUERY_KEY(search),
    queryFn: () => societyService.getSocieties(search),
    enabled,
  });

export { useSocietiesQuery };
