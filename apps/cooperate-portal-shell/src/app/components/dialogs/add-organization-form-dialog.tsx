import clsx from 'clsx';

import { Add, ArrowLeft2, Warning2 } from 'iconsax-reactjs';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import bgImage from '@cgp/ui-kit/assets/images/form-dialog-background.svg';
import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Combobox } from '@cgp/ui-kit/components/combobox';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cgp/ui-kit/components/ui/form';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Popover, PopoverTrigger } from '@cgp/ui-kit/components/ui/popover';
import { applyTypography } from '@cgp/ui-kit/lib/typography';

import { useLocationsQuery } from '../../hooks/queries/use-location-query';
import { useOrganizationForm } from '../../hooks/use-organization-form';
import type { LocationOption } from '../../types/organization';
import { removeEmoji } from '../../utils/emoji-filter';

interface AddOrganizationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrganizationAdded: (organization: {
    id: string;
    name: string;
    location: string;
    organizationWebSite?: string;
    source: 'USER_CREATED';
  }) => void;
  organizationName: string;
}

export default function AddOrganizationFormDialog({
  open,
  onOpenChange,
  onOrganizationAdded,
  organizationName,
}: Readonly<AddOrganizationFormDialogProps>) {
  const { t } = useTranslation();
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

  const [locationsSearch, setLocationsSearch] = useState('');
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery(locationsSearch);

  const locationOptions: LocationOption[] = locationsData ?? [];

  const { form, onSubmit } = useOrganizationForm(data => {
    setLocationsSearch('');
    const newOrganization = {
      id: crypto.randomUUID(),
      name: `${data.name.trim()}, ${data.location.label}`,
      location: data.location.id,
      organizationWebSite: data.organizationWebSite,
      source: 'USER_CREATED' as const,
    };
    onOrganizationAdded(newOrganization);
    onOpenChange(false);
    SuccessToast({
      title: t('licensesAndCertificate.dialog.addOrganisationSuccessTitle'),
      description: t(
        'licensesAndCertificate.dialog.addOrganisationSuccessDescription'
      ),
    });
  });

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  useEffect(() => {
    if (open && organizationName) {
      const cleaned = removeEmoji(organizationName);
      const truncated = cleaned.slice(0, 200);
      form.setValue('name', truncated);
      setWasNameTruncated(cleaned.length > 200);
    } else if (!open) {
      setWasNameTruncated(false);
    }
  }, [open, organizationName, form]);

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        showCloseButton={false}
        alignRight={true}
        className="fixed! top-4! right-0! bottom-0! left-0! flex h-auto! w-full! max-w-none! translate-x-0! translate-y-0! flex-col gap-7 rounded-t-2xl bg-white px-4 pt-6 sm:px-7 sm:pt-7 sm:pb-7 md:inset-4! md:w-auto! md:max-w-full! md:rounded-2xl lg:inset-x-auto! lg:right-4! lg:bottom-4! lg:w-216.25! lg:max-w-[845.5px]! lg:rounded-2xl"
        style={{
          backgroundImage: `url("${bgImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
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
              <p className={clsx(applyTypography('h4'), 'text-slate-900')}>
                {t('licensesAndCertificate.dialog.addOrganisationTitle')}
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
              {t('licensesAndCertificate.dialog.addOrganisationTitle')}
            </DialogTitle>
            <DialogDescription className="hidden">
              {t('licensesAndCertificate.dialog.addOrganisationDescription')}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="w-full flex-1 overflow-hidden rounded-2xl bg-white">
          <ScrollAreaWithShadow className="h-full max-w-full p-3 sm:p-5">
            <Form {...form}>
              <form
                id="add-organization-form"
                className="space-y-6"
                onSubmit={onSubmit}
              >
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <FormItem className="gap-1">
                        <FormLabel className="flex w-full items-center justify-between">
                          <span className="flex items-center gap-1">
                            {t(
                              'licensesAndCertificate.dialog.organisationNameLabel'
                            )}
                            <span className="text-rose-600">*</span>
                          </span>
                          <CharacterCount
                            currentLength={field.value?.length || 0}
                            maxLength={200}
                          />
                        </FormLabel>
                        <FormControl>
                          <Popover
                            open={openTruncationTooltip}
                            onOpenChange={setOpenTruncationTooltip}
                          >
                            <div
                              className={clsx(
                                'border-input focus-within:border-ring focus-within:ring-ring/50 flex h-11 w-full items-center gap-2 rounded-md border bg-transparent px-3 shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]',
                                fieldState.error && 'border-destructive'
                              )}
                            >
                              <input
                                placeholder={t(
                                  'licensesAndCertificate.dialog.organisationNamePlaceholder'
                                )}
                                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                                maxLength={200}
                                {...field}
                                onChange={e => {
                                  field.onChange(removeEmoji(e.target.value));
                                }}
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
                                  className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-50 w-[286px] max-w-none translate-x-4 rounded-lg border-none bg-slate-700 p-3 shadow-lg"
                                  onMouseEnter={handleTruncationMouseEnter}
                                  onMouseLeave={handleTruncationMouseLeave}
                                >
                                  <p className="text-sm leading-5 font-semibold text-white">
                                    {t(
                                      'general.orgNameTruncated',
                                      'The Organisation name you previously added exceeds the 200 character limit. Only the first 200 characters are displayed here, and the remaining characters have been removed'
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="gap-1">
                        <FormLabel>
                          {t(
                            'licensesAndCertificate.dialog.organisationLocationLabel'
                          )}{' '}
                          <span className="text-rose-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Combobox
                            options={locationOptions.map(o => ({
                              value: o.id,
                              label: o.label,
                            }))}
                            value={field.value?.id ?? ''}
                            loading={isLocationsLoading}
                            placeholder={t(
                              'licensesAndCertificate.dialog.organisationLocationPlaceholder'
                            )}
                            onSearchChange={value =>
                              setLocationsSearch(removeEmoji(value))
                            }
                            onValueChange={val => {
                              const option = locationOptions.find(
                                o => o.id === val
                              );
                              if (option) field.onChange(option);
                            }}
                            addable={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organizationWebSite"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel className="flex w-full items-center justify-between">
                          <span>
                            {t(
                              'licensesAndCertificate.dialog.organisationUrlLabel'
                            )}
                          </span>
                          <CharacterCount
                            currentLength={field.value?.length || 0}
                            maxLength={200}
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              'licensesAndCertificate.dialog.organisationUrlPlaceholder'
                            )}
                            className="h-11 shadow-none"
                            maxLength={200}
                            {...field}
                            onChange={e => {
                              field.onChange(removeEmoji(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </ScrollAreaWithShadow>
        </div>

        <div className="flex w-full shrink-0 justify-end gap-4">
          <Button
            variant="secondary"
            className="flex-1 bg-neutral-200 text-neutral-600 hover:bg-neutral-200 sm:max-w-48.25"
            type="button"
            onClick={() => handleDialogChange(false)}
          >
            {t('licensesAndCertificate.dialog.cancel')}
          </Button>
          <Button
            className="flex-1 sm:max-w-48.25"
            type="submit"
            form="add-organization-form"
          >
            {t('general.addNow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
