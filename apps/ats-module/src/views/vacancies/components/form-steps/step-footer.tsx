import { useTranslation } from 'react-i18next';

import type { StepFooterProps } from '@/views/vacancies/types';

import { Button } from '@cgp/ui-kit/components/ui/button';

export default function StepFooter({
  onNext,
  onCancel,
}: Readonly<StepFooterProps>) {
  const { t } = useTranslation('ats');

  return (
    <div className="sticky bottom-0 z-20 flex justify-end gap-4 border-t border-slate-200 bg-white px-8 py-5">
      <Button variant="secondary" className="h-12 w-44" onClick={onCancel}>
        {t('common.cancel')}
      </Button>
      <Button
        className="h-12 w-44 bg-teal-700 hover:bg-teal-800"
        onClick={onNext}
      >
        {t('common.next')}
      </Button>
    </div>
  );
}
