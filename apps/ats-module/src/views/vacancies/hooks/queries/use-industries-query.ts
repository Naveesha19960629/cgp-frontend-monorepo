import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { industryService } from '@/views/vacancies/services';

const INDUSTRIES_QUERY_KEY = ['industries'] as const;

const useIndustriesQuery = (search: string) =>
  useQuery({
    queryKey: [...INDUSTRIES_QUERY_KEY, search],
    queryFn: () => industryService.getIndustries(search),
  });

const useIndustriesSearch = () => {
  const queryClient = useQueryClient();
  return useCallback(
    async (search: string) => {
      const data = await queryClient.fetchQuery({
        queryKey: [...INDUSTRIES_QUERY_KEY, search],
        queryFn: () => industryService.getIndustries(search),
      });
      return data.data.items.content.map(item => ({
        value: item.id,
        label: item.label,
        source: item.source ?? 'MASTER',
      }));
    },
    [queryClient]
  );
};

export { useIndustriesQuery, useIndustriesSearch };
