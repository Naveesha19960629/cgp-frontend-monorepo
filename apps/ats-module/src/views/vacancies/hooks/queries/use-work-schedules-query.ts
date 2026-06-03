import { useQuery } from '@tanstack/react-query';

import { workScheduleService } from '@/views/vacancies/services';

const WORK_SCHEDULES_QUERY_KEY = (search: string) =>
  ['work-schedules', search] as const;

const useWorkSchedulesQuery = (search: string = '') =>
  useQuery({
    queryKey: WORK_SCHEDULES_QUERY_KEY(search),
    queryFn: () => workScheduleService.getAllWorkSchedules(search),
  });

export { useWorkSchedulesQuery };
