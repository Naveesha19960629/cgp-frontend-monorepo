import { useQuery } from '@tanstack/react-query';

import { roleService } from '@/views/vacancies/services';

const ROLES_QUERY_KEY = (
  search: string,
  careerPathId?: string,
  levelId?: string
) => ['job-roles', search, careerPathId ?? '', levelId ?? ''] as const;

const useRolesQuery = (
  search: string = '',
  careerPathId?: string,
  levelId?: string,
  enabled: boolean = true
) =>
  useQuery({
    queryKey: ROLES_QUERY_KEY(search, careerPathId, levelId),
    queryFn: () => roleService.getAllRoles(search, careerPathId, levelId),
    enabled,
  });

export { useRolesQuery };
