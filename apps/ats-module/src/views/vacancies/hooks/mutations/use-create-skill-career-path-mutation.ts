import { useMutation, useQueryClient } from '@tanstack/react-query';

import { skillService } from '@/views/vacancies/services';

const useCreateSkillCareerPathMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      skillName,
      careerPathName,
    }: {
      skillName: string;
      careerPathName: string;
    }) => skillService.createSkillCareerPath(skillName, careerPathName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
};

export { useCreateSkillCareerPathMutation };
