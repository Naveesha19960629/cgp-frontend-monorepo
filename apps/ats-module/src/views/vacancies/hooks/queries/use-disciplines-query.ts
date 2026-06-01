import { useQuery } from '@tanstack/react-query';

import { disciplineService } from '@/views/vacancies/services';

const DISCIPLINES_QUERY_KEY = (search: string) =>
  ['disciplines', search] as const;

const useDisciplinesQuery = (search: string = '') =>
  useQuery({
    queryKey: DISCIPLINES_QUERY_KEY(search),
    queryFn: () => disciplineService.getAllDisciplines(search),
  });

export { useDisciplinesQuery };
