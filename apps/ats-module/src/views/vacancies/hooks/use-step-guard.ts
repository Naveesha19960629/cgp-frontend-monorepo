import { useLayoutEffect } from 'react';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';

function useStepGuard(shouldGuard: boolean): void {
  const { setStepGuard } = useVacancyForm();

  useLayoutEffect(() => {
    setStepGuard(shouldGuard);
    return () => setStepGuard(false);
  }, [shouldGuard, setStepGuard]);
}

export { useStepGuard };
