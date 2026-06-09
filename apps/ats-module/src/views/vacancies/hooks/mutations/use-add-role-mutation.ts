import { useMutation, useQueryClient } from '@tanstack/react-query';

import { roleService } from '@/views/vacancies/services';
import type { CreateRolePayload } from '@/views/vacancies/types';

const useAddRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => roleService.addRole(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['job-roles'] });
    },
  });
};

export { useAddRoleMutation };
