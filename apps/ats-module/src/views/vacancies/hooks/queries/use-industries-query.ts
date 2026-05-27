import { useQuery } from '@tanstack/react-query';

import { industryService } from '@/views/vacancies/services';

const INDUSTRIES_QUERY_KEY = (search: string) =>
  ['industries', search] as const;

const useIndustriesQuery = (search: string) =>
  useQuery({
    queryKey: INDUSTRIES_QUERY_KEY(search),
    queryFn: () => industryService.getIndustries(search),
  });

export { useIndustriesQuery };
