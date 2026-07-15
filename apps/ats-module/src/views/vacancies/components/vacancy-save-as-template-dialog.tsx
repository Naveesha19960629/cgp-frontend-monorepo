import { Loader2 } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import type { VacancySaveAsTemplateDialogProps } from '@/views/vacancies/types';
import { TEMPLATE_NAME_MAX_LENGTH } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@cgp/ui-kit/components/ui/dialog';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn, removeEmoji } from '@cgp/ui-kit/lib/utils';

const saveAsTemplateAvatar = new URL(
  '../../../assets/images/save-as-template-avatar.png',
  import.meta.url
).href;

// Matches the Figma "Feedback Pop up" frame (node 4229:228310) background.
const GRADIENT_BACKGROUND =
  'linear-gradient(90deg, rgb(254, 244, 238) 2.46%, rgb(248, 242, 236) 34.38%, rgb(233, 244, 240) 65.56%, rgb(238, 247, 245) 100%)';

export default function VacancySaveAsTemplateDialog({
  open,
  onOpenChange,
  templateName,
  onTemplateNameChange,
  onConfirm,
  isSaving = false,
}: VacancySaveAsTemplateDialogProps) {
  const { t } = useTranslation('ats');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">
        {t('vacancySaveAsTemplateDialog.title')}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {t('vacancySaveAsTemplateDialog.description')}
      </DialogDescription>
      <DialogContent
        className="flex w-[92vw] flex-col items-center gap-7 rounded-2xl bg-white p-7 sm:w-130 sm:max-w-130"
        showCloseButton
        style={{ backgroundImage: GRADIENT_BACKGROUND }}
      >
        <div className="flex flex-col items-center justify-center">
          <img src={saveAsTemplateAvatar} height={100} width={100} alt="" />
          <h2
            className={cn(
              applyTypography('h4'),
              'mt-3.5 text-center text-slate-900'
            )}
          >
            {t('vacancySaveAsTemplateDialog.title')}
          </h2>
          <p className="mt-2 text-center text-sm/5 font-normal whitespace-pre-line text-slate-900">
            {t('vacancySaveAsTemplateDialog.description')}
          </p>
        </div>
        <div className="w-full rounded-2xl border border-[rgba(7,80,86,0.14)] bg-white p-4 shadow-[0px_4px_90px_0px_rgba(0,0,0,0.14)]">
          <div className="flex w-full flex-col gap-1">
            <Label className="flex w-full items-center justify-between">
              <span className="flex items-center gap-1">
                {t('vacancySaveAsTemplateDialog.nameLabel')}
                <span className="text-rose-600">*</span>
              </span>
              <CharacterCount
                currentLength={templateName.length}
                maxLength={TEMPLATE_NAME_MAX_LENGTH}
              />
            </Label>
            <Input
              value={templateName}
              onChange={e => onTemplateNameChange(removeEmoji(e.target.value))}
              maxLength={TEMPLATE_NAME_MAX_LENGTH}
              disabled={isSaving}
              className="h-11 shadow-none"
              placeholder={t('vacancySaveAsTemplateDialog.namePlaceholder')}
            />
          </div>
        </div>
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className={cn(
              'h-14 flex-1 rounded-lg bg-neutral-200 text-neutral-600 hover:bg-neutral-200',
              applyTypography('h5')
            )}
          >
            {t('vacancySaveAsTemplateDialog.noButton')}
          </Button>
          <Button
            type="button"
            disabled={isSaving || !templateName.trim()}
            onClick={onConfirm}
            className={cn('h-14 flex-1 rounded-lg', applyTypography('h5'))}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t('vacancySaveAsTemplateDialog.yesButton')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
