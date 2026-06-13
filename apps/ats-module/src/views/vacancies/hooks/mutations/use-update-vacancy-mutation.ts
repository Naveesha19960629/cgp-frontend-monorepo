import { useMutation } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';
import type { ScheduleVacancyPayload } from '@/views/vacancies/types';

const useUpdateVacancyMutation = () =>
  useMutation({
    mutationFn: ({
      id,
      schedule,
    }: {
      id: string;
      schedule: ScheduleVacancyPayload;
    }) => vacancyService.updateVacancy(id, { schedule }),
  });

export { useUpdateVacancyMutation };
