import { useQuery } from '@tanstack/react-query';

import { engagementModelService } from '@/views/vacancies/services';

const ENGAGEMENT_MODELS_QUERY_KEY = (search: string) =>
  ['engagement-models', search] as const;

const useEngagementModelsQuery = (search: string = '') =>
  useQuery({
    queryKey: ENGAGEMENT_MODELS_QUERY_KEY(search),
    queryFn: () => engagementModelService.getAllEngagementModels(search),
  });

export { useEngagementModelsQuery };
