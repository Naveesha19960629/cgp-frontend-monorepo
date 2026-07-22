import SimpleConfirmDialog from '@/views/vacancies/components/simple-confirm-dialog';
import type { VacancyEditCancelDialogProps } from '@/views/vacancies/types';

export default function VacancyEditCancelDialog({
  open,
  onOpenChange,
  onConfirm,
}: Readonly<VacancyEditCancelDialogProps>) {
  return (
    <SimpleConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      titleKey="vacancyEditCancelDialog.title"
      descriptionKey="vacancyEditCancelDialog.description"
      cancelLabelKey="vacancyEditCancelDialog.noButton"
      confirmLabelKey="vacancyEditCancelDialog.yesButton"
    />
  );
}
