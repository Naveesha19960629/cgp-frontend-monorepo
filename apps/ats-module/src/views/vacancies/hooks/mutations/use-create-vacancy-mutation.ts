import { useMutation } from '@tanstack/react-query';

import { vacancyService } from '@/views/vacancies/services';
import type { ScheduleVacancyPayload } from '@/views/vacancies/types';

const useCreateVacancyMutation = () =>
  useMutation({
    mutationFn: (schedule: ScheduleVacancyPayload) =>
      vacancyService.createVacancy({ schedule }),
  });

export { useCreateVacancyMutation };
