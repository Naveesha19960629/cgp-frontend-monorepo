import SimpleDeleteConfirmDialog from '@/views/vacancies/components/simple-delete-confirm-dialog';
import type { TemplateDeleteDialogProps } from '@/views/vacancies/types';

export default function TemplateDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: Readonly<TemplateDeleteDialogProps>) {
  return (
    <SimpleDeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
      titleKey="templates.deleteDialog.title"
      descriptionKey="templates.deleteDialog.message"
      cancelLabelKey="templates.deleteDialog.cancel"
      confirmLabelKey="templates.deleteDialog.confirm"
    />
  );
}
