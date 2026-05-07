// import { DialogTitle } from 'radix-ui';
import { useTranslation } from 'react-i18next';

import Avator from '@cgp/ui-kit/assets/images/delete-confirm-avator.svg';
import bgImage from '@cgp/ui-kit/assets/images/form-dialog-background.svg';
import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@cgp/ui-kit/components/ui/dialog';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';

interface CancelConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  messageType?:
    | 'jobApplication'
    | 'formCancel'
    | 'deleteMedia'
    | 'deleteProfilePicture';
}

export default function CancelConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  messageType = 'jobApplication',
}: CancelConfirmationDialogProps) {
  const { t } = useTranslation();

  const handleYes = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleNo = () => {
    onOpenChange(false);
  };

  const getMessage = () => {
    switch (messageType) {
      case 'jobApplication':
        return t('cancelConfirmationDialog.jobApplicationMessage');
      case 'formCancel':
        return t('cancelConfirmationDialog.formCancelMessage');
      case 'deleteMedia':
        return t('cancelConfirmationDialog.deleteMediaMessage');
      case 'deleteProfilePicture':
        return t('cancelConfirmationDialog.deleteProfilePictureMessage');
      default:
        return t('cancelConfirmationDialog.jobApplicationMessage');
    }
  };

  const getDialogTitle = () => {
    return messageType === 'deleteMedia' ||
      messageType === 'deleteProfilePicture'
      ? t('cancelConfirmationDialog.deleteConfirmation')
      : t('cancelConfirmationDialog.cancelConfirmation');
  };

  const getDialogDescription = () => {
    return messageType === 'deleteMedia' ||
      messageType === 'deleteProfilePicture'
      ? t('cancelConfirmationDialog.deleteConfirmationDescription')
      : t('cancelConfirmationDialog.cancelConfirmationDescription');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogTitle className="sr-only">{getDialogTitle()}</DialogTitle>
        <DialogDescription className="sr-only">
          {getDialogDescription()}
        </DialogDescription>
        <DialogContent
          className="flex w-85.5 flex-col items-center gap-7 bg-white p-7 sm:w-99"
          showCloseButton={true}
          style={{
            backgroundImage: `url("${bgImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="flex flex-col items-center justify-center">
            {/* Avatar with tick */}
            <img src={Avator} height={99} width={99} />
            <h2
              className={cn(
                applyTypography('h4'),
                'mt-3.5 text-center text-slate-900'
              )}
            >
              {t('cancelConfirmationDialog.title')}
            </h2>

            <p className="mt-2 w-63.25 text-center text-sm/5 font-normal whitespace-pre-line text-slate-900">
              {getMessage()}
            </p>
            {/* Buttons */}
          </div>
          <div className="flex w-full gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleNo}
              className={cn(
                'h-12 flex-1 rounded-lg bg-neutral-200 text-neutral-600 hover:bg-neutral-200',
                applyTypography('h5')
              )}
            >
              {messageType === 'deleteProfilePicture'
                ? t('cancelConfirmationDialog.no')
                : t('cancelConfirmationDialog.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleYes}
              className={cn(
                'h-12 flex-1 rounded-lg bg-[#be123c] hover:bg-[#be123c]',
                applyTypography('h5')
              )}
            >
              {messageType === 'deleteProfilePicture'
                ? t('cancelConfirmationDialog.yes')
                : t('cancelConfirmationDialog.delete')}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
