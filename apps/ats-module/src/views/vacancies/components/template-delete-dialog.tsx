import { Loader2 } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import type { TemplateDeleteDialogProps } from '@/views/vacancies/types';

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

const deleteAvatar = new URL(
  '../../../assets/images/delete-confirm-avator.svg',
  import.meta.url
).href;

export default function TemplateDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: TemplateDeleteDialogProps) {
  const { t } = useTranslation('ats');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">
        {t('templates.deleteDialog.title')}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {t('templates.deleteDialog.message')}
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
          <img src={deleteAvatar} height={99} width={99} alt="" />
          <h2
            className={cn(
              applyTypography('h4'),
              'mt-3.5 text-center text-slate-900'
            )}
          >
            {t('templates.deleteDialog.title')}
          </h2>
          <p className="mt-2 text-center text-sm/5 font-normal whitespace-pre-line text-slate-900">
            {t('templates.deleteDialog.message')}
          </p>
        </div>
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className={cn(
              'h-12 w-1/2 rounded-lg bg-neutral-200 text-neutral-600 hover:bg-neutral-200',
              applyTypography('h5')
            )}
          >
            {t('templates.deleteDialog.cancel')}
          </Button>
          <Button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className={cn(
              'h-12 w-1/2 rounded-lg bg-[#be123c] text-white hover:bg-[#be123c]',
              applyTypography('h5')
            )}
          >
            {isDeleting && <Loader2 className="size-4 animate-spin" />}
            {t('templates.deleteDialog.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
