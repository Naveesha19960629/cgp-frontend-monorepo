import type { DisableDialogProps } from '@/views/vacancies/types';

import deleteConfirmAvatar from '@cgp/ui-kit/assets/images/delete-confirm-avator.svg';
import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@cgp/ui-kit/components/ui/dialog';

export default function DisableDialog({
  open,
  onOpenChange,
  title,
  message,
  cancelLabel,
  disableLabel,
  onCancel,
  onDisable,
}: Readonly<DisableDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="w-99 overflow-hidden rounded-2xl border-0 p-7 text-center"
        style={{
          background:
            'linear-gradient(90deg, rgb(254,244,238) 2%, rgb(248,242,236) 34%, rgb(233,244,240) 66%, rgb(238,247,245) 100%)',
        }}
      >
        <div className="relative mx-auto mb-3 h-25 w-25 overflow-hidden rounded-full">
          <img
            src={deleteConfirmAvatar}
            className="absolute inset-0 size-full"
            alt=""
          />
        </div>
        <DialogTitle className="mb-2 text-center text-xl font-bold text-slate-900">
          {title}
        </DialogTitle>
        <p className="mb-7 text-center text-sm text-slate-900">{message}</p>
        <div className="flex gap-3">
          <Button
            className="h-12 flex-1 rounded-lg bg-[#e5e5e5] font-bold text-[#525252] hover:bg-[#d4d4d4]"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            className="h-12 flex-1 rounded-lg bg-[#be123c] font-bold text-white hover:bg-[#9f1239]"
            onClick={onDisable}
          >
            {disableLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
