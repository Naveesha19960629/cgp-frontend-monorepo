import { useQuery } from '@tanstack/react-query';

import { maritalStatusService } from '@/views/vacancies/services';

const MARITAL_STATUSES_QUERY_KEY = ['maritalStatuses'] as const;

const useMaritalStatusesQuery = () => {
  return useQuery({
    queryKey: MARITAL_STATUSES_QUERY_KEY,
    queryFn: maritalStatusService.getMaritalStatuses,
  });
};

export { useMaritalStatusesQuery };
