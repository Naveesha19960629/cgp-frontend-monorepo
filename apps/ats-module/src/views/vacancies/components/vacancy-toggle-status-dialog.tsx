import { Loader2 } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import type { VacancyToggleStatusDialogProps } from '@/views/vacancies/types';

import bgImage from '@cgp/ui-kit/assets/images/form-dialog-background.svg';
import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@cgp/ui-kit/components/ui/dialog';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';

const confirmAvatar = new URL(
  '../../../assets/images/delete-confirm-avator.svg',
  import.meta.url
).href;

export default function VacancyToggleStatusDialog({
  open,
  onOpenChange,
  action,
  onConfirm,
  onSchedule,
  isToggling = false,
}: VacancyToggleStatusDialogProps) {
  const { t } = useTranslation('ats');
  const isActivate = action === 'ACTIVATE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">
        {t('vacancies.toggleStatusDialog.title')}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {t(
          isActivate
            ? 'vacancies.toggleStatusDialog.activateMessage'
            : 'vacancies.toggleStatusDialog.deactivateMessage'
        )}
      </DialogDescription>
      <DialogContent
        className="flex w-85.5 flex-col items-center gap-7 bg-white p-7 sm:w-99"
        showCloseButton
        style={{
          backgroundImage: `url("${bgImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex flex-col items-center justify-center">
          <img src={confirmAvatar} height={99} width={99} alt="" />
          <h2
            className={cn(
              applyTypography('h4'),
              'mt-3.5 text-center text-slate-900'
            )}
          >
            {t('vacancies.toggleStatusDialog.title')}
          </h2>
          <p className="mt-2 text-center text-sm/5 font-normal whitespace-pre-line text-slate-900">
            {t(
              isActivate
                ? 'vacancies.toggleStatusDialog.activateMessage'
                : 'vacancies.toggleStatusDialog.deactivateMessage'
            )}
          </p>
        </div>
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isToggling}
            onClick={onSchedule}
            className={cn(
              'h-12 flex-1 rounded-lg bg-neutral-200 text-neutral-600 hover:bg-neutral-200',
              applyTypography('h5')
            )}
          >
            {t('vacancies.toggleStatusDialog.schedule')}
          </Button>
          <Button
            type="button"
            disabled={isToggling}
            onClick={onConfirm}
            className={cn(
              'h-12 flex-1 rounded-lg bg-[#be123c] text-white hover:bg-[#be123c]',
              applyTypography('h5')
            )}
          >
            {isToggling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t(
                isActivate
                  ? 'vacancies.toggleStatusDialog.activate'
                  : 'vacancies.toggleStatusDialog.deactivate'
              )
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
