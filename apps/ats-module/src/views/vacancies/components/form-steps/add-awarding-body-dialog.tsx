import clsx from 'clsx';

import { Add, ArrowLeft2, Warning2 } from 'iconsax-reactjs';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTertiaryAwardingBodyLocationsQuery } from '@/views/vacancies/hooks';
import type { AddAwardingBodyDialogProps } from '@/views/vacancies/types';
import { isUrlFormatValid, isUrlProtocolValid } from '@/views/vacancies/utils';

import { AutocompleteCombobox } from '@cgp/ui-kit/components/autocomplete-combobox';
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
import { Popover, PopoverTrigger } from '@cgp/ui-kit/components/ui/popover';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';

function validateUrl(
  url: string,
  t: (key: string) => string
): string | undefined {
  if (!url) return undefined;
  if (!isUrlProtocolValid(url)) {
    return t('tertiaryEducation.addAwardingBodyDialog.urlInvalid');
  }
  if (!isUrlFormatValid(url)) {
    return t('tertiaryEducation.addAwardingBodyDialog.urlFormat');
  }
  return undefined;
}

export function AddAwardingBodyDialog({
  open,
  initialName,
  onClose,
  onAdded,
}: Readonly<AddAwardingBodyDialogProps>) {
  const { t } = useTranslation('ats');

  const [name, setName] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | undefined>();
  const [wasNameTruncated, setWasNameTruncated] = useState(false);
  const [openTruncationTooltip, setOpenTruncationTooltip] = useState(false);
  const truncationCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTruncationMouseEnter = () => {
    if (truncationCloseTimeoutRef.current) {
      clearTimeout(truncationCloseTimeoutRef.current);
      truncationCloseTimeoutRef.current = null;
    }
    setOpenTruncationTooltip(true);
  };

  const handleTruncationMouseLeave = () => {
    truncationCloseTimeoutRef.current = setTimeout(() => {
      setOpenTruncationTooltip(false);
    }, 300);
  };

  // Adjust state during rendering when the dialog opens — this is the
  // React-recommended pattern for resetting state on a prop change
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    const cleaned = removeEmoji(initialName);
    const truncated = cleaned.slice(0, 200);
    setName(truncated);
    setWasNameTruncated(cleaned.length > 200);
    setSelectedLocation(null);
    setLocationSearch('');
    setUrl('');
    setUrlError(undefined);
    setPrevOpen(true);
  } else if (!open && prevOpen) {
    setWasNameTruncated(false);
    setPrevOpen(false);
  }

  const { data: locationsResponse, isLoading: isLocationLoading } =
    useTertiaryAwardingBodyLocationsQuery(locationSearch);
  const locationData = locationsResponse?.data.items.content ?? [];

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError(validateUrl(value, t));
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  const handleAdd = () => {
    const urlValidation = validateUrl(url, t);
    if (urlValidation) {
      setUrlError(urlValidation);
      return;
    }
    const tempId = `__pending_awarding_body_${Date.now()}`;
    onAdded({
      value: tempId,
      label: name,
      source: 'PENDING_TEMP',
      locationId: selectedLocation?.value,
      url: url || undefined,
    });
    SuccessToast({
      title: t('tertiaryEducation.addAwardingBodyDialog.success.title'),
      description: t('tertiaryEducation.addAwardingBodyDialog.success.message'),
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
                {t('tertiaryEducation.addAwardingBodyDialog.title')}
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
              {t('tertiaryEducation.addAwardingBodyDialog.title')}
            </DialogTitle>
            <DialogDescription className="hidden">
              {t('tertiaryEducation.addAwardingBodyDialog.title')}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="w-full flex-1 overflow-hidden rounded-2xl bg-white">
          <ScrollAreaWithShadow className="h-full max-w-full p-3 sm:p-5">
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
              {/* Awarding Body Name */}
              <div className="flex flex-col gap-1">
                <div className="flex w-full items-center justify-between">
                  <Label className="flex items-center gap-1">
                    {t('tertiaryEducation.addAwardingBodyDialog.name')}
                    <span className="text-rose-600">*</span>
                  </Label>
                  <CharacterCount currentLength={name.length} maxLength={200} />
                </div>
                <Popover
                  open={openTruncationTooltip}
                  onOpenChange={setOpenTruncationTooltip}
                >
                  <div
                    className={clsx(
                      'border-input focus-within:border-ring focus-within:ring-ring/50 flex h-11 w-full items-center gap-2 rounded-md border bg-transparent px-3 shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]'
                    )}
                  >
                    <input
                      placeholder={t(
                        'tertiaryEducation.addAwardingBodyDialog.namePlaceholder'
                      )}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                      maxLength={200}
                      value={name}
                      onChange={e => setName(removeEmoji(e.target.value))}
                    />
                    {wasNameTruncated && (
                      <PopoverTrigger
                        asChild
                        onMouseEnter={handleTruncationMouseEnter}
                        onMouseLeave={handleTruncationMouseLeave}
                      >
                        <button
                          type="button"
                          className="shrink-0 cursor-pointer"
                          aria-label="Name truncation warning"
                          onClick={() =>
                            setOpenTruncationTooltip(prev => !prev)
                          }
                        >
                          <div className="relative size-5 overflow-hidden rounded-full bg-rose-600">
                            <Warning2
                              size={28}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
                            />
                          </div>
                        </button>
                      </PopoverTrigger>
                    )}
                  </div>
                  {wasNameTruncated && (
                    <PopoverPrimitive.Portal>
                      <PopoverPrimitive.Content
                        side="bottom"
                        align="end"
                        alignOffset={8}
                        sideOffset={8}
                        arrowPadding={8}
                        className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-50 w-71.5 max-w-none translate-x-4 rounded-lg border-none bg-slate-700 p-3 shadow-lg"
                        onMouseEnter={handleTruncationMouseEnter}
                        onMouseLeave={handleTruncationMouseLeave}
                      >
                        <p className="text-sm leading-5 font-semibold text-white">
                          {t(
                            'tertiaryEducation.addAwardingBodyDialog.nameTruncatedMessage',
                            'The awarding body/institute name you previously added exceeds the 200 character limit. Only the first 200 characters are displayed here, and the remaining characters have been removed'
                          )}
                        </p>
                        <PopoverPrimitive.Arrow
                          asChild
                          width={24}
                          height={10}
                          className="translate-x-4"
                        >
                          <svg
                            width="24"
                            height="12"
                            viewBox="0 0 24 12"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M0 0H24L13.67 10.74C13.12 11.5 10.88 11.5 10.33 10.74L0 0Z"
                              fill="#334155"
                            />
                          </svg>
                        </PopoverPrimitive.Arrow>
                      </PopoverPrimitive.Content>
                    </PopoverPrimitive.Portal>
                  )}
                </Popover>
              </div>

              {/* Awarding Body Location */}
              <div className="flex flex-col gap-1">
                <Label className="flex items-center gap-1">
                  {t('tertiaryEducation.addAwardingBodyDialog.location')}
                  <span className="text-rose-600">*</span>
                </Label>
                <AutocompleteCombobox
                  options={locationData.map(l => ({
                    value: l.id,
                    label: l.label,
                  }))}
                  value={selectedLocation?.label ?? ''}
                  selectedValue={selectedLocation?.value}
                  onInputChange={v => {
                    if (!v) setSelectedLocation(null);
                  }}
                  onSearchChange={setLocationSearch}
                  onSelect={option => setSelectedLocation(option)}
                  loading={isLocationLoading}
                  placeholder={t(
                    'tertiaryEducation.addAwardingBodyDialog.locationPlaceholder'
                  )}
                />
              </div>

              {/* Awarding Body URL */}
              <div className="flex flex-col gap-1">
                <div className="flex w-full items-center justify-between">
                  <Label>
                    {t('tertiaryEducation.addAwardingBodyDialog.url')}
                  </Label>
                  <CharacterCount currentLength={url.length} maxLength={200} />
                </div>
                <Input
                  value={url}
                  onChange={e => handleUrlChange(removeEmoji(e.target.value))}
                  maxLength={200}
                  className="h-11 shadow-none"
                  placeholder={t(
                    'tertiaryEducation.addAwardingBodyDialog.urlPlaceholder'
                  )}
                />
                {urlError && <p className="text-xs text-red-500">{urlError}</p>}
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
            {t('tertiaryEducation.addAwardingBodyDialog.cancel')}
          </Button>
          <Button
            className="flex-1 sm:max-w-48.25"
            type="button"
            onClick={handleAdd}
            disabled={!name.trim() || !selectedLocation || !!urlError}
          >
            {t('tertiaryEducation.addAwardingBodyDialog.addNow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
