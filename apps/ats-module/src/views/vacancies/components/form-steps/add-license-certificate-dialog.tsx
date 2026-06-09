import clsx from 'clsx';

import { Add, ArrowLeft2 } from 'iconsax-reactjs';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  AddLicenseCertDialogProps,
  LicenseCertType,
} from '@/views/vacancies/types';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { ScrollAreaWithShadow } from '@cgp/ui-kit/components/scroll-area-with-shadow';
import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@cgp/ui-kit/components/ui/dialog';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cgp/ui-kit/components/ui/select';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';

export function AddLicenseCertDialog({
  open,
  initialName,
  onClose,
  onAdded,
}: Readonly<AddLicenseCertDialogProps>) {
  const { t } = useTranslation('ats');

  const [certType, setCertType] = useState<LicenseCertType | ''>('');
  const [name, setName] = useState('');
  const [typeError, setTypeError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();

  // Reset state when dialog opens — React-recommended pattern for resetting
  // state on a prop change without a useEffect.
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    const cleaned = removeEmoji(initialName).slice(0, 200);
    setName(cleaned);
    setCertType('');
    setTypeError(undefined);
    setNameError(undefined);
    setPrevOpen(true);
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  const nameLabel =
    certType === 'LICENSE'
      ? t('licenseCertificates.addLicenseCertDialog.nameLicense')
      : certType === 'CERTIFICATION'
        ? t('licenseCertificates.addLicenseCertDialog.nameCertification')
        : t('licenseCertificates.addLicenseCertDialog.nameDefault');

  const namePlaceholder =
    certType === 'LICENSE'
      ? t('licenseCertificates.addLicenseCertDialog.namePlaceholderLicense')
      : certType === 'CERTIFICATION'
        ? t(
            'licenseCertificates.addLicenseCertDialog.namePlaceholderCertification'
          )
        : t('licenseCertificates.addLicenseCertDialog.namePlaceholderDefault');

  const handleAdd = () => {
    let hasError = false;

    if (!certType) {
      setTypeError(t('licenseCertificates.addLicenseCertDialog.typeRequired'));
      hasError = true;
    }

    if (!name.trim()) {
      setNameError(t('licenseCertificates.addLicenseCertDialog.nameRequired'));
      hasError = true;
    }

    if (hasError) return;

    const tempId = `__pending_license_cert_${Date.now()}`;
    onAdded({
      value: tempId,
      label: name,
      source: 'PENDING_TEMP',
      certType: certType as LicenseCertType,
    });
    SuccessToast({
      title: t('licenseCertificates.addLicenseCertDialog.success.title'),
      description: t(
        'licenseCertificates.addLicenseCertDialog.success.message'
      ),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed! top-4! right-0! bottom-0! left-0! flex h-auto! w-full! max-w-none! translate-x-0! translate-y-0! flex-col gap-7 rounded-t-2xl bg-white px-4 pt-6 duration-200 sm:px-7 sm:pt-7 sm:pb-7 md:inset-4! md:w-auto! md:max-w-full! md:rounded-2xl lg:inset-x-auto! lg:right-4! lg:bottom-4! lg:w-216.25! lg:max-w-[845.5px]! lg:rounded-2xl"
      >
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <ArrowLeft2
                size="24"
                className="text-brand-primary-400 cursor-pointer"
                variant="Linear"
                onClick={() => handleDialogChange(false)}
              />
              <p className={clsx('text-2xl font-bold text-slate-900')}>
                {t('licenseCertificates.addLicenseCertDialog.title')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              type="button"
              onClick={() => handleDialogChange(false)}
            >
              <Add className="size-6 rotate-45 text-slate-900" />
            </Button>
            <DialogTitle className="hidden">
              {t('licenseCertificates.addLicenseCertDialog.title')}
            </DialogTitle>
            <DialogDescription className="hidden">
              {t('licenseCertificates.addLicenseCertDialog.title')}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="w-full flex-1 overflow-hidden rounded-2xl bg-white">
          <ScrollAreaWithShadow className="h-full max-w-full p-3 sm:p-5">
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
              {/* Type */}
              <div className="flex flex-col gap-1">
                <Label className="flex w-full items-center justify-between leading-5">
                  <span className="flex items-center gap-1">
                    {t('licenseCertificates.addLicenseCertDialog.type')}
                    <span className="text-rose-600">*</span>
                  </span>
                </Label>
                <Select
                  value={certType}
                  onValueChange={val => {
                    setCertType(val as LicenseCertType);
                    if (val) setTypeError(undefined);
                  }}
                >
                  <SelectTrigger className="!h-11 w-full shadow-none">
                    <SelectValue
                      placeholder={t(
                        'licenseCertificates.addLicenseCertDialog.typePlaceholder'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LICENSE">
                      {t(
                        'licenseCertificates.addLicenseCertDialog.licenseLabel'
                      )}
                    </SelectItem>
                    <SelectItem value="CERTIFICATION">
                      {t(
                        'licenseCertificates.addLicenseCertDialog.certificationLabel'
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {typeError && (
                  <p className="text-xs text-red-500">{typeError}</p>
                )}
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <Label className="flex w-full items-center justify-between">
                  <span className="flex items-center gap-1">
                    {nameLabel}
                    <span className="text-rose-600">*</span>
                  </span>
                  <CharacterCount currentLength={name.length} maxLength={200} />
                </Label>
                <Input
                  className="h-11 shadow-none"
                  maxLength={200}
                  placeholder={namePlaceholder}
                  value={name}
                  onChange={e => {
                    const val = removeEmoji(e.target.value);
                    setName(val);
                    if (val.trim()) setNameError(undefined);
                  }}
                />
                {nameError && (
                  <p className="text-xs text-red-500">{nameError}</p>
                )}
              </div>
            </div>
          </ScrollAreaWithShadow>
        </div>

        <div className="flex w-full shrink-0 justify-end gap-4">
          <Button
            variant="secondary"
            className="flex-1 bg-neutral-200 text-neutral-600 hover:bg-neutral-200 sm:max-w-48.25"
            type="button"
            onClick={() => handleDialogChange(false)}
          >
            {t('licenseCertificates.addLicenseCertDialog.cancel')}
          </Button>
          <Button
            className="flex-1 sm:max-w-48.25"
            type="button"
            disabled={!certType || !name.trim()}
            onClick={handleAdd}
          >
            {t('licenseCertificates.addLicenseCertDialog.addNow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
