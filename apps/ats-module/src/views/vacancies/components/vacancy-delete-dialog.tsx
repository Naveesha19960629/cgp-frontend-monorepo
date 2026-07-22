import SimpleDeleteConfirmDialog from '@/views/vacancies/components/simple-delete-confirm-dialog';
import type { VacancyDeleteDialogProps } from '@/views/vacancies/types';

export default function VacancyDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: Readonly<VacancyDeleteDialogProps>) {
  return (
    <SimpleDeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
      titleKey="vacancies.deleteDialog.title"
      descriptionKey="vacancies.deleteDialog.message"
      cancelLabelKey="vacancies.deleteDialog.cancel"
      confirmLabelKey="vacancies.deleteDialog.confirm"
    />
  );
}
