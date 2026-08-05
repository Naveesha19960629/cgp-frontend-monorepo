import { useMutation } from '@tanstack/react-query';

import { notificationService } from '@/views/vacancies/services';
import type { NotifyApplicantsPayload } from '@/views/vacancies/types';

const useNotifyApplicantsMutation = () =>
  useMutation({
    mutationFn: (payload: NotifyApplicantsPayload) =>
      notificationService.notifyApplicants(payload),
  });

export { useNotifyApplicantsMutation };
