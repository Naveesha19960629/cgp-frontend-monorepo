import { ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';

import { ArrowLeft2, Calendar as CalenderIcon } from 'iconsax-reactjs';

import { useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import MessageBox from '@/components/message-box';
import { StepDisableDialog } from '@/views/vacancies';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCreateIndustryMutation,
  useIndustriesQuery,
  usePreferredPatentsForm,
} from '@/views/vacancies/hooks';
import { industryService } from '@/views/vacancies/services';
import type {
  PatentStatus,
  StepProps,
  preferredPatentsSchema,
} from '@/views/vacancies/types';
import { resolveUserCreatedIndustries } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import type { Option } from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cgp/ui-kit/components/ui/collapsible';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cgp/ui-kit/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';
import { format } from 'date-fns';

const HUNDRED_YEARS_AGO = new Date(new Date().getFullYear() - 100, 0, 1);
const HUNDRED_YEARS_FROM_NOW = new Date(new Date().getFullYear() + 100, 11, 31);

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

function PatentCard({
  index,
  form,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<preferredPatentsSchema>;
  onRemove: () => void;
}) {
  const { t } = useTranslation('ats');
  const [hasMaxError, setHasMaxError] = useState(false);
  const [industriesSearch, setIndustriesSearch] = useState('');
  const [openDatePopover, setOpenDatePopover] = useState<
    'fromDate' | 'toDate' | null
  >(null);

  const { data: industriesResponse, isLoading: isIndustriesLoading } =
    useIndustriesQuery(industriesSearch);
  const industriesData = industriesResponse?.data.items.content ?? [];

  const isOpen = form.watch(`patents.${index}.isOpen`);
  const isEnabled = form.watch('isEnabled');

  const STATUS_OPTIONS: Option[] = [
    { value: 'PATENT_PENDING', label: t('preferredPatents.statusPending') },
    { value: 'PATENT_ISSUED', label: t('preferredPatents.statusIssued') },
  ];

  return (
    <Collapsible
      // release with hardcoded "true" with isOpen when multiple entry allowed
      open={true}
      onOpenChange={open => form.setValue(`patents.${index}.isOpen`, open)}
    >
      <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-base font-bold text-slate-900">
            {t('preferredPatents.patentTitle', {
              number: String(index + 1).padStart(2, '0'),
            })}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRemove}
              // remove disabled = true and hidden from UI when multiple entry allowed
              disabled={true}
              className="hidden text-slate-400 transition-colors hover:text-red-500"
              aria-label={t('preferredPatents.removePatent')}
            >
              <Trash2 className="size-5" />
            </button>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                aria-label={
                  isOpen
                    ? t('preferredPatents.collapse')
                    : t('preferredPatents.expand')
                }
              >
                <ChevronUp
                  className={cn(
                    'size-5 transition-transform',
                    !isOpen && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Collapsible body */}
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-5 px-5 pb-5">
            {/* Related Industry */}
            <FormField
              control={form.control}
              name={`patents.${index}.relatedIndustries`}
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-col gap-1.5 space-y-0">
                    <FormLabel className="flex justify-between">
                      <p
                        className={hasMaxError ? 'text-destructive' : undefined}
                      >
                        {t('preferredPatents.relatedIndustry')}
                      </p>
                      <CharacterCount
                        maxLength={100}
                        currentLength={industriesSearch.length}
                      />
                    </FormLabel>
                    <FormControl>
                      <MultipleSelector
                        value={
                          field.value?.map(i => ({
                            value: i.value,
                            label: i.label,
                            source: i.source,
                          })) ?? []
                        }
                        errorMessage={t(
                          'preferredPatents.validation.maxExceeded',
                          {
                            max: 10,
                            defaultValue: 'Exceeded maximum of 10 selections.',
                          }
                        )}
                        onErrorStateChange={setHasMaxError}
                        onChange={options => {
                          field.onChange(
                            options.map(opt => ({
                              value: opt.value,
                              label: opt.label,
                              source: (opt.source as string) ?? 'USER_CREATED',
                            }))
                          );
                        }}
                        options={industriesData.map(i => ({
                          value: i.id,
                          label: i.label,
                          source: i.source,
                        }))}
                        onSearchSync={value => {
                          setIndustriesSearch(value);
                          return industriesData.map(i => ({
                            value: i.id,
                            label: i.label,
                            source: i.source,
                          }));
                        }}
                        keepSelectedInList
                        creatable
                        triggerSearchOnFocus
                        hideClearAllButton
                        maxSelected={10}
                        disabled={!isEnabled}
                        inputProps={{ maxLength: 100 }}
                        loading={isIndustriesLoading}
                        placeholder={t(
                          'preferredPatents.relatedIndustryPlaceholder'
                        )}
                        loadingIndicator={
                          <p className="px-3 pb-3 text-left">
                            {t('common.loading')}
                          </p>
                        }
                        emptyIndicator={
                          <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                            <div className="flex flex-col items-start">
                              <img
                                src={multiSelectInfoAvatar}
                                alt={t('common.noData')}
                              />
                              <div className="mt-3 w-61 text-left">
                                <p className="font-bold text-slate-900">
                                  {t('common.noDataTitle')}
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                  {t('common.noDataDescription')}
                                </p>
                              </div>
                            </div>
                          </div>
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name={`patents.${index}.statuses`}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0">
                  <FormLabel className="text-sm font-semibold text-slate-900">
                    {t('preferredPatents.status')}
                  </FormLabel>
                  <FormControl>
                    <MultipleSelector
                      value={
                        field.value?.map(s => ({
                          value: s.value,
                          label: s.label,
                        })) ?? []
                      }
                      showArrow
                      onChange={options => {
                        field.onChange(
                          options.map(opt => ({
                            value: opt.value as PatentStatus,
                            label: opt.label,
                          }))
                        );
                      }}
                      options={STATUS_OPTIONS}
                      hideClearAllButton
                      keepSelectedInList
                      disabled={!isEnabled}
                      placeholder={t('preferredPatents.statusPlaceholder')}
                      loadingIndicator={
                        <p className="px-3 pb-3 text-left">
                          {t('common.loading')}
                        </p>
                      }
                      emptyIndicator={
                        <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                          <div className="flex flex-col items-start">
                            <img
                              src={multiSelectInfoAvatar}
                              alt={t('common.noData')}
                            />
                            <div className="mt-3 w-61 text-left">
                              <p className="font-bold text-slate-900">
                                {t('common.noDataTitle')}
                              </p>
                              <p className="text-sm font-semibold text-slate-700">
                                {t('common.noDataDescription')}
                              </p>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex w-full gap-4">
              {/* From date */}
              <FormField
                control={form.control}
                name={`patents.${index}.fromDate`}
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col gap-1 space-y-0">
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      {t('preferredPatents.from')}
                    </FormLabel>
                    <Popover
                      modal
                      open={openDatePopover === 'fromDate'}
                      onOpenChange={open =>
                        setOpenDatePopover(
                          isEnabled && open ? 'fromDate' : null
                        )
                      }
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!isEnabled}
                            className={cn(
                              'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                              !field.value && 'text-slate-500',
                              field.value && 'text-zinc-800',
                              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                              'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                              'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                              applyTypography('body-medium'),
                              'shadow-none!'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'do MMM yyyy')
                            ) : (
                              <span>
                                {t('preferredPatents.fromPlaceholder')}
                              </span>
                            )}
                            <CalenderIcon
                              variant="Linear"
                              size={20}
                              className="text-zinc-800"
                            />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          defaultMonth={
                            field.value ??
                            form.getValues(`patents.${index}.toDate`) ??
                            new Date()
                          }
                          onSelect={date => {
                            field.onChange(date);
                            setOpenDatePopover(null);
                            const toDate = form.getValues(
                              `patents.${index}.toDate`
                            );
                            if (toDate && date && toDate < date) {
                              form.setValue(
                                `patents.${index}.toDate`,
                                undefined
                              );
                            }
                          }}
                          disabled={date =>
                            date > new Date() || date < HUNDRED_YEARS_AGO
                          }
                          captionLayout="dropdown"
                          startMonth={HUNDRED_YEARS_AGO}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* To date */}
              <FormField
                control={form.control}
                name={`patents.${index}.toDate`}
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col gap-1 space-y-0">
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      {t('preferredPatents.to')}
                    </FormLabel>
                    <Popover
                      modal
                      open={openDatePopover === 'toDate'}
                      onOpenChange={open =>
                        setOpenDatePopover(isEnabled && open ? 'toDate' : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!isEnabled}
                            className={cn(
                              'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                              !field.value && 'text-slate-500',
                              field.value && 'text-zinc-800',
                              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                              'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                              'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                              applyTypography('body-medium'),
                              'shadow-none!'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'do MMM yyyy')
                            ) : (
                              <span>{t('preferredPatents.toPlaceholder')}</span>
                            )}
                            <CalenderIcon
                              variant="Linear"
                              size={20}
                              className="text-zinc-800"
                            />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          defaultMonth={
                            field.value ??
                            form.getValues(`patents.${index}.fromDate`) ??
                            new Date()
                          }
                          onSelect={date => {
                            field.onChange(date);
                            setOpenDatePopover(null);
                          }}
                          disabled={date => {
                            const fromDate = form.getValues(
                              `patents.${index}.fromDate`
                            );
                            return (
                              date < HUNDRED_YEARS_AGO ||
                              date > HUNDRED_YEARS_FROM_NOW ||
                              (fromDate != null && date < fromDate)
                            );
                          }}
                          captionLayout="dropdown"
                          startMonth={HUNDRED_YEARS_AGO}
                          endMonth={HUNDRED_YEARS_FROM_NOW}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function PreferredPatentsStep({ onNext, onBack }: StepProps) {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();

  const { form: contextForm } = useVacancyForm();
  const { form, fields, append, remove, replace } = usePreferredPatentsForm(
    contextForm.patents
  );

  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync } = useCreateIndustryMutation();

  const handleConfirmDisable = () => {
    form.setValue('isEnabled', false);
    form.setValue('dataTakenFromCandidate', false);
    replace([
      {
        relatedIndustries: [],
        statuses: [],
        fromDate: undefined,
        toDate: undefined,
        isOpen: true,
      },
    ]);
    setShowDisableConfirm(false);
  };

  const handleConfirmEmptyData = () => {
    replace([
      {
        relatedIndustries: [],
        statuses: [],
        fromDate: undefined,
        toDate: undefined,
        isOpen: true,
      },
    ]);
    setShowEmptyConfirm(false);
    onNext({
      patents: {
        isEnabled: false,
        dataTakenFromCandidate: form.getValues('dataTakenFromCandidate'),
        patents: [],
      },
    });
  };

  const handleSubmit = async (data: preferredPatentsSchema) => {
    if (data.isEnabled && !data.dataTakenFromCandidate) {
      const hasData = data.patents.some(
        p =>
          p.relatedIndustries.length > 0 ||
          p.statuses.length > 0 ||
          p.fromDate != null ||
          p.toDate != null
      );
      if (!hasData) {
        setShowEmptyConfirm(true);
        return;
      }
    }
    const hasUserCreated = data.patents
      .flatMap(p => p.relatedIndustries)
      .some(i => i.source === 'USER_CREATED');

    if (hasUserCreated) {
      setIsSubmitting(true);
      try {
        const updatedPatents = await resolveUserCreatedIndustries(
          data.patents,
          mutateAsync,
          industryService.getIndustries
        );
        form.setValue('patents', updatedPatents);
        onNext({
          patents: {
            isEnabled: data.isEnabled,
            dataTakenFromCandidate: data.dataTakenFromCandidate,
            patents: updatedPatents,
          },
        });
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    onNext({
      patents: {
        isEnabled: data.isEnabled,
        dataTakenFromCandidate: data.dataTakenFromCandidate,
        patents: data.patents,
      },
    });
  };

  const handleCancel = () => {
    void navigate('/dashboard/ats/vacancies');
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={e => {
            void form.handleSubmit(handleSubmit)(e);
          }}
          className="flex flex-1 flex-col"
        >
          <MessageBox
            fields={[
              t('preferredPatents.fieldList.patentTitle'),
              t('preferredPatents.fieldList.patentApplicationNumber'),
              t('preferredPatents.fieldList.relatedIndustry'),
              t('preferredPatents.fieldList.status'),
              t('preferredPatents.fieldList.issueDate'),
              t('preferredPatents.fieldList.fillingDate'),
              t('preferredPatents.fieldList.otherInventors'),
              t('preferredPatents.fieldList.patentURL'),
            ]}
          />

          {/* Section header: back arrow + title + toggle */}
          <div className="flex items-center justify-between px-7 py-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="text-slate-700 transition-colors hover:text-slate-900"
                aria-label={t('preferredPatents.back')}
              >
                <ArrowLeft2 size={24} />
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {t('preferredPatents.title')}
              </h2>
            </div>

            {/* Toggle switch */}
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  size="lg"
                  onCheckedChange={checked => {
                    if (!checked) {
                      const hasChecked = form.getValues(
                        'dataTakenFromCandidate'
                      );
                      const patents = form.getValues('patents');
                      const hasData = patents.some(
                        p =>
                          p.relatedIndustries.length > 0 ||
                          p.statuses.length > 0 ||
                          p.fromDate != null ||
                          p.toDate != null
                      );
                      if (hasData || hasChecked) {
                        setShowDisableConfirm(true);
                      } else {
                        field.onChange(false);
                      }
                    } else {
                      field.onChange(true);
                    }
                  }}
                />
              )}
            />
          </div>

          {/* Checkbox: data from candidate profile */}
          <div className="flex items-center gap-3 px-7 pb-8">
            <FormField
              control={form.control}
              name="dataTakenFromCandidate"
              render={({ field }) => (
                <>
                  <Checkbox
                    id="data-from-candidate"
                    checked={field.value}
                    disabled={!form.watch('isEnabled')}
                    onCheckedChange={field.onChange}
                  />
                  <label
                    htmlFor="data-from-candidate"
                    className="cursor-pointer text-sm font-medium text-slate-900"
                  >
                    {t('preferredPatents.dataTakenFromCandidate')}
                  </label>
                </>
              )}
            />
          </div>

          {/* Patent cards */}
          <div className="flex flex-col gap-4 px-6">
            {fields.map((field, index) => (
              <PatentCard
                key={field.id}
                index={index}
                form={form}
                onRemove={() => remove(index)}
              />
            ))}
          </div>

          {/* Add patent button */}
          <div className="flex justify-end px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              disabled
              className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
              onClick={() =>
                append({
                  relatedIndustries: [],
                  statuses: [],
                  fromDate: undefined,
                  toDate: undefined,
                  isOpen: true,
                })
              }
            >
              <Plus className="size-4 text-neutral-600!" />
            </Button>
          </div>

          {/* Footer: Cancel + Next */}
          <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-48"
              onClick={handleCancel}
            >
              {t('preferredPatents.cancelButton')}
            </Button>
            <Button type="submit" className="h-12 w-48" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('preferredPatents.nextButton')
              )}
            </Button>
          </div>
        </form>
      </Form>

      <StepDisableDialog
        open={showDisableConfirm}
        onOpenChange={setShowDisableConfirm}
        onConfirm={handleConfirmDisable}
      />

      <StepDisableDialog
        open={showEmptyConfirm}
        onOpenChange={setShowEmptyConfirm}
        onConfirm={handleConfirmEmptyData}
        title={t('preferredPatents.emptyDisableDialog.title')}
        description={t('preferredPatents.emptyDisableDialog.message')}
        confirmLabel={t('preferredPatents.emptyDisableDialog.disable')}
      />
    </>
  );
}
