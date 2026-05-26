import { hobbyService } from '@/views/vacancies';

import { useQuery } from '@cgp/data-access';

const HOBBIES_QUERY_KEY = (search: string) => ['hobbies', search] as const;

const useHobbiesQuery = (search: string = '') =>
  useQuery({
    queryKey: HOBBIES_QUERY_KEY(search),
    queryFn: () => hobbyService.getAllHobbies(search),
  });

export { useHobbiesQuery };
