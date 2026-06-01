import { useQuery } from '@tanstack/react-query';

import { jobTitleService } from '@/views/vacancies/services';

const JOB_TITLES_QUERY_KEY = (search: string) =>
  ['job-titles', search] as const;

const useJobTitlesQuery = (search: string = '') =>
  useQuery({
    queryKey: JOB_TITLES_QUERY_KEY(search),
    queryFn: () => jobTitleService.getAllJobTitles(search),
  });

export { useJobTitlesQuery };
