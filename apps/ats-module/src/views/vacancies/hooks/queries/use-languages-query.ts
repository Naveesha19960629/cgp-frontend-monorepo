import { useQuery } from '@tanstack/react-query';

import { languageService } from '@/views/vacancies';

const LANGUAGES_QUERY_KEY = (search: string) => ['languages', search] as const;

const useLanguagesQuery = (search: string = '') =>
  useQuery({
    queryKey: LANGUAGES_QUERY_KEY(search),
    queryFn: () => languageService.getAllLanguages(search),
  });

export { useLanguagesQuery };
