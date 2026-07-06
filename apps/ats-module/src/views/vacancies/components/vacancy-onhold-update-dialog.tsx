import { Loader2 } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import type { VacancyOnholdUpdateDialogProps } from '@/views/vacancies/types';

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

const cancelAvatar = new URL(
  '../../../assets/images/delete-confirm-avator.svg',
  import.meta.url
).href;

export default function VacancyOnholdUpdateDialog({
  open,
  onOpenChange,
  onConfirm,
  isPublishDateChanged,
  hasApplicants,
  isConfirming = false,
}: Readonly<VacancyOnholdUpdateDialogProps>) {
  const { t } = useTranslation('ats');

  const variant = isPublishDateChanged
    ? hasApplicants
      ? 'scheduleChanged'
      : 'scheduleChangedNoApplicants'
    : hasApplicants
      ? 'scheduleUnchanged'
      : 'scheduleUnchangedNoApplicants';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">
        {t(`vacancyOnholdUpdateDialog.${variant}.title`)}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {t(`vacancyOnholdUpdateDialog.${variant}.description`)}
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
          <img src={cancelAvatar} height={99} width={99} alt="" />
          <h2
            className={cn(
              applyTypography('h4'),
              'mt-3.5 text-center text-slate-900'
            )}
          >
            {t(`vacancyOnholdUpdateDialog.${variant}.title`)}
          </h2>
          <p className="mt-2 text-center text-sm/5 font-normal whitespace-pre-line text-slate-900">
            {t(`vacancyOnholdUpdateDialog.${variant}.description`)}
          </p>
        </div>
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className={cn(
              'h-12 flex-1 rounded-lg bg-neutral-200 text-neutral-600 hover:bg-neutral-200',
              applyTypography('h5')
            )}
          >
            {t('vacancyOnholdUpdateDialog.noButton')}
          </Button>
          <Button
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
            className={cn(
              'h-12 flex-1 rounded-lg bg-[#be123c] text-white hover:bg-[#be123c]',
              applyTypography('h5')
            )}
          >
            {isConfirming && <Loader2 className="size-4 animate-spin" />}
            {t('vacancyOnholdUpdateDialog.yesButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
