import { ChevronLeftIcon, XIcon } from 'lucide-react';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useAddSchoolMutation,
  useSchoolLocationsSearch,
} from '@/views/vacancies/hooks';
import type { AddSchoolDialogProps } from '@/views/vacancies/types';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import MultipleSelector from '@cgp/ui-kit/components/multiple-selector';
import type { Option } from '@cgp/ui-kit/components/multiple-selector';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Dialog, DialogContent } from '@cgp/ui-kit/components/ui/dialog';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';

function validateUrl(
  url: string,
  t: (key: string) => string
): string | undefined {
  if (!url) return undefined;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return t('secondaryEducation.addSchoolDialog.schoolUrlInvalid');
  }
  try {
    new URL(url);
  } catch {
    return t('secondaryEducation.addSchoolDialog.schoolUrlFormat');
  }
  return undefined;
}

export function AddSchoolDialog({
  open,
  initialName,
  onClose,
  onAdded,
}: Readonly<AddSchoolDialogProps>) {
  const { t } = useTranslation('ats');

  const [name, setName] = useState('');
  const [location, setLocation] = useState<Option[]>([]);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | undefined>();

  // Adjust state during rendering when the dialog opens — this is the
  // React-recommended pattern for resetting state on a prop change
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setName(initialName);
    setLocation([]);
    setUrl('');
    setUrlError(undefined);
    setPrevOpen(true);
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const addSchoolMutation = useAddSchoolMutation();
  const searchLocations = useSchoolLocationsSearch();

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError(validateUrl(value, t));
  };

  const handleAdd = async () => {
    const urlValidation = validateUrl(url, t);
    if (urlValidation) {
      setUrlError(urlValidation);
      return;
    }
    try {
      const result = await addSchoolMutation.mutateAsync({
        displayValue: name,
        locationId: location[0]?.id,
        url: url || undefined,
      });
      onAdded({
        id: result.data.pendingId,
        label: name,
        source: 'PENDING',
      });
      SuccessToast({
        title: t('secondaryEducation.addSchoolDialog.success.title'),
        description: t('secondaryEducation.addSchoolDialog.success.message'),
      });
      onClose();
    } catch (error) {
      ErrorToast({
        title: t(
          error instanceof TypeError
            ? 'notifications.networkError.title'
            : 'notifications.apiError.save.title'
        ),
        description: t(
          error instanceof TypeError
            ? 'notifications.networkError.message'
            : 'notifications.apiError.save.message'
        ),
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
              onClick={onClose}
            >
              <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-bold text-slate-900">
              {t('secondaryEducation.addSchoolDialog.title')}
            </h2>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
            onClick={onClose}
          >
            <XIcon className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 py-2">
          {/* Row 1: School Name | School Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label>
                  {t('secondaryEducation.addSchoolDialog.schoolName')}
                  <span className="ml-0.5 text-red-500">*</span>
                </Label>
                <CharacterCount currentLength={name.length} maxLength={200} />
              </div>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={200}
                placeholder={t(
                  'secondaryEducation.addSchoolDialog.schoolNamePlaceholder'
                )}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>
                {t('secondaryEducation.addSchoolDialog.schoolLocation')}
                <span className="ml-0.5 text-red-500">*</span>
              </Label>
              <MultipleSelector
                value={location}
                onSearch={searchLocations}
                onChange={opts => setLocation(opts.slice(-1))}
                maxSelected={1}
                onMaxSelected={() => {}}
                triggerSearchOnFocus
                placeholder={t(
                  'secondaryEducation.addSchoolDialog.schoolLocationPlaceholder'
                )}
              />
            </div>
          </div>

          {/* Row 2: School URL */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label>
                  {t('secondaryEducation.addSchoolDialog.schoolUrl')}
                </Label>
                <CharacterCount currentLength={url.length} maxLength={200} />
              </div>
              <Input
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                maxLength={200}
                placeholder={t(
                  'secondaryEducation.addSchoolDialog.schoolUrlPlaceholder'
                )}
              />
              {urlError && <p className="text-xs text-red-500">{urlError}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="secondary" className="h-12 w-36" onClick={onClose}>
            {t('secondaryEducation.addSchoolDialog.cancel')}
          </Button>
          <Button
            className="h-12 w-36"
            onClick={() => void handleAdd()}
            disabled={
              !name.trim() ||
              !location.length ||
              !!urlError ||
              addSchoolMutation.isPending
            }
          >
            {t('secondaryEducation.addSchoolDialog.addNow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
