import { useCallback } from 'react';

import { tertiaryEducationService } from '@/views/vacancies/services';

import { useQuery, useQueryClient } from '@cgp/data-access';

const DELIVERY_SCHEDULES_QUERY_KEY = ['delivery-schedules'] as const;

const useDeliverySchedulesQuery = () =>
  useQuery({
    queryKey: DELIVERY_SCHEDULES_QUERY_KEY,
    queryFn: () => tertiaryEducationService.getDeliverySchedules(),
  });

const useDeliverySchedulesSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (_search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: DELIVERY_SCHEDULES_QUERY_KEY,
        queryFn: () => tertiaryEducationService.getDeliverySchedules(),
      });
      return data.data.items.content.map(item => ({
        id: item.id,
        label: item.label,
        source: item.source,
      }));
    },
    [queryClient]
  );
};

export { useDeliverySchedulesQuery, useDeliverySchedulesSearch };
