import { useQuery } from '@tanstack/react-query';

import { skillService } from '@/views/vacancies';

const SKILLS_QUERY_KEY = (search: string) => ['skills', search] as const;

const useSkillsQuery = (search: string = '') =>
  useQuery({
    queryKey: SKILLS_QUERY_KEY(search),
    queryFn: () => skillService.getAllSkills(search),
  });

export { useSkillsQuery };
