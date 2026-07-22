import SimpleConfirmDialog from '@/views/vacancies/components/simple-confirm-dialog';
import type { TemplateCancelDialogProps } from '@/views/vacancies/types';

/**
 * "Are you sure?" confirmation shown when the recruiter cancels the Create/Edit
 * Vacancy Template form with unsaved changes (DQCGP-2202). "No" keeps them on
 * the form; "Yes" discards the changes and leaves.
 */
export default function TemplateCancelDialog({
  open,
  onOpenChange,
  onConfirm,
}: Readonly<TemplateCancelDialogProps>) {
  return (
    <SimpleConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      titleKey="templateCancelDialog.title"
      descriptionKey="templateCancelDialog.description"
      cancelLabelKey="templateCancelDialog.noButton"
      confirmLabelKey="templateCancelDialog.yesButton"
    />
  );
}
