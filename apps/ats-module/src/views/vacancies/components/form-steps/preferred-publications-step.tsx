import { ChevronUpIcon, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import { useStepGuard } from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cgp/ui-kit/components/ui/collapsible';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';

const MAX_PUBLISHER_LENGTH = 250;
const HUNDRED_YEARS_AGO = new Date(new Date().getFullYear() - 100, 0, 1);
const HUNDRED_YEARS_FROM_NOW = new Date(new Date().getFullYear() + 100, 11, 31);

interface PublicationEntry {
  id: string;
  isOpen: boolean;
  acceptedPublisher: string;
  publishedDateFrom?: string;
  publishedDateTo?: string;
  openDatePopover?: 'publishedDateFrom' | 'publishedDateTo' | null;
}

function PublicationCard({
  index,
  publication,
  onUpdate,
  fieldsDisabled,
}: Readonly<{
  index: number;
  publication: PublicationEntry;
  onUpdate: (index: number, updates: Partial<PublicationEntry>) => void;
  fieldsDisabled: boolean;
}>) {
  return (
    <Collapsible
      open={publication.isOpen}
      onOpenChange={open => onUpdate(index, { isOpen: open })}
    >
      <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-base font-bold text-slate-900">
            Publication {String(index + 1).padStart(2, '0')}
          </span>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-slate-400 transition-colors hover:text-slate-600"
              aria-label={publication.isOpen ? 'Collapse' : 'Expand'}
            >
              <ChevronUpIcon
                className={cn(
                  'size-5 transition-transform',
                  !publication.isOpen && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
        </div>

        {/* Collapsible body */}
        <CollapsibleContent>
          <div
            className={cn(
              'flex flex-col gap-5 border-t border-slate-200 px-6 py-5',
              fieldsDisabled && 'pointer-events-none opacity-60'
            )}
          >
            {/* Row 1: Accepted Publisher | Published Date From | Published Date To */}
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Accepted Publisher</Label>
                  <CharacterCount
                    currentLength={publication.acceptedPublisher.length}
                    maxLength={MAX_PUBLISHER_LENGTH}
                  />
                </div>
                <Input
                  value={publication.acceptedPublisher}
                  onChange={e =>
                    onUpdate(index, { acceptedPublisher: e.target.value })
                  }
                  maxLength={MAX_PUBLISHER_LENGTH}
                  placeholder="Enter accepted publisher"
                  className="h-11"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Published Date From</Label>
                </div>
                <Popover
                  modal
                  open={publication.openDatePopover === 'publishedDateFrom'}
                  onOpenChange={open =>
                    onUpdate(index, {
                      openDatePopover:
                        !fieldsDisabled && open ? 'publishedDateFrom' : null,
                    })
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={fieldsDisabled}
                      className={cn(
                        'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                        !publication.publishedDateFrom && 'text-slate-500',
                        publication.publishedDateFrom && 'text-zinc-800',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                        'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                        applyTypography('body-medium'),
                        'shadow-none!'
                      )}
                    >
                      {publication.publishedDateFrom
                        ? formatDate(publication.publishedDateFrom)
                        : 'Select published date from'}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-zinc-800"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        publication.publishedDateFrom
                          ? new Date(publication.publishedDateFrom)
                          : undefined
                      }
                      defaultMonth={
                        (publication.publishedDateFrom &&
                          new Date(publication.publishedDateFrom)) ||
                        (publication.publishedDateTo &&
                          new Date(publication.publishedDateTo)) ||
                        new Date()
                      }
                      onSelect={date => {
                        onUpdate(index, {
                          publishedDateFrom: date
                            ? date.toISOString()
                            : undefined,
                        });
                        onUpdate(index, { openDatePopover: null });

                        if (publication.publishedDateTo && date) {
                          const toDate = new Date(publication.publishedDateTo);
                          if (toDate < date) {
                            onUpdate(index, { publishedDateTo: undefined });
                          }
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
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Published Date To</Label>
                </div>
                <Popover
                  modal
                  open={publication.openDatePopover === 'publishedDateTo'}
                  onOpenChange={open =>
                    onUpdate(index, {
                      openDatePopover:
                        !fieldsDisabled && open ? 'publishedDateTo' : null,
                    })
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={fieldsDisabled}
                      className={cn(
                        'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                        !publication.publishedDateTo && 'text-slate-500',
                        publication.publishedDateTo && 'text-zinc-800',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                        'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                        applyTypography('body-medium'),
                        'shadow-none!'
                      )}
                    >
                      {publication.publishedDateTo
                        ? formatDate(publication.publishedDateTo)
                        : 'Select published date to'}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-zinc-800"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        publication.publishedDateTo
                          ? new Date(publication.publishedDateTo)
                          : undefined
                      }
                      defaultMonth={
                        (publication.publishedDateTo &&
                          new Date(publication.publishedDateTo)) ||
                        (publication.publishedDateFrom &&
                          new Date(publication.publishedDateFrom)) ||
                        new Date()
                      }
                      onSelect={date => {
                        onUpdate(index, {
                          publishedDateTo: date
                            ? date.toISOString()
                            : undefined,
                        });
                        onUpdate(index, { openDatePopover: null });
                      }}
                      disabled={date => {
                        const fromDate = publication.publishedDateFrom
                          ? new Date(publication.publishedDateFrom)
                          : undefined;
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
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function PreferredPublicationsStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: contextForm, onCancel } = useVacancyForm();
  const savedPublications = contextForm.preferredPublications;

  const [isEnabled, setIsEnabled] = useState(
    savedPublications?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    savedPublications?.dataTakenFromCandidate ?? false
  );
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  // TODO: Persist state on tab navigation — not yet wired because VacancyForm
  // has no `preferredPublications` field. To activate:
  //   1. Add `preferredPublications` to VacancyForm in types.ts
  //   2. Add its default value to DEFAULT_FORM in vacancy-form-context.tsx
  //   3. Uncomment the block below and add to the React import: useEffect, useRef
  //      and add to the file import: useVacancyForm from vacancy-form-context
  //
  // const { setForm, stepPersistRef } = useVacancyForm();
  // const _publicationsRef = useRef<() => void>(() => {});
  // useEffect(() => {
  //   _publicationsRef.current = () => {
  //     setForm(prev => ({
  //       ...prev,
  //       preferredPublications: { isEnabled, dataTakenFromCandidate, publications },
  //     }));
  //   };
  // }, [isEnabled, dataTakenFromCandidate, publications, setForm]);
  // useEffect(() => {
  //   stepPersistRef.current = () => _publicationsRef.current();
  //   return () => {
  //     stepPersistRef.current = null;
  //   };
  // }, [stepPersistRef]);

  const [publications, setPublications] = useState<PublicationEntry[]>(
    savedPublications?.publications && savedPublications.publications.length > 0
      ? savedPublications.publications
      : [
          {
            id: '1',
            isOpen: true,
            acceptedPublisher: '',
            publishedDateFrom: undefined,
            publishedDateTo: undefined,
          },
        ]
  );

  const handleNext = () => {
    onNext({
      preferredPublications: {
        isEnabled,
        dataTakenFromCandidate,
        publications,
      },
    });
  };

  useStepGuard(
    isEnabled &&
      !dataTakenFromCandidate &&
      !publications.some(p => p.acceptedPublisher.trim().length > 0)
  );

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  const handleToggle = () => {
    if (isEnabled) {
      setConfirmDisableOpen(true);
    } else {
      setIsEnabled(true);
    }
  };

  const updatePublication = (
    index: number,
    updates: Partial<PublicationEntry>
  ) => {
    setPublications(prev =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  const addPublication = () => {
    const newId = String(Date.now());
    setPublications(prev => [
      ...prev,
      {
        id: newId,
        isOpen: true,
        acceptedPublisher: '',
        publishedDateFrom: undefined,
        publishedDateTo: undefined,
      },
    ]);
  };

  const handleDisable = () => {
    setPublications([
      {
        id: '1',
        isOpen: true,
        acceptedPublisher: '',
        publishedDateFrom: undefined,
        publishedDateTo: undefined,
      },
    ]);
    setDataTakenFromCandidate(false);
    setIsEnabled(false);
    setConfirmDisableOpen(false);
    SuccessToast({
      title: 'Section Disabled',
      description:
        'Preferred Publications section has been disabled successfully.',
    });
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        {/* ── Informational Banner ──────────────────────────────────────── */}
        <MessageBox
          fields={[
            t('preferredPublications.fieldList.publisher'),
            t('preferredPublications.fieldList.publishedDateFrom'),
            t('preferredPublications.fieldList.publishedDateTo'),
          ]}
        />

        {/* ── Section header: back arrow + title + toggle ───────────────── */}
        <div className="flex items-center justify-between px-7 py-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Back"
              className="text-slate-700 transition-colors hover:text-slate-900"
              onClick={onBack}
            >
              <ArrowLeft2 size={24} />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Preferred Publications
            </h2>
          </div>
          <SwitchPrimitive.Root
            checked={isEnabled}
            onCheckedChange={handleToggle}
            className={cn(
              'focus-visible:ring-ring/50 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
              isEnabled ? 'bg-brand-primary-500' : 'bg-slate-300'
            )}
          >
            <SwitchPrimitive.Thumb
              className={cn(
                'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </SwitchPrimitive.Root>
        </div>

        {/* ── Checkbox: data from candidate profile ─────────────────────── */}
        <div
          className={cn(
            'flex items-start gap-3 px-7 pb-8',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Checkbox
            id="publicationsDataTakenFromCandidate"
            checked={dataTakenFromCandidate}
            onCheckedChange={value => setDataTakenFromCandidate(!!value)}
            className="mt-0.5"
          />
          <Label
            htmlFor="publicationsDataTakenFromCandidate"
            className="cursor-pointer text-sm leading-snug font-medium text-slate-900"
          >
            If selected, no manual input is required, and data will be taken
            from the candidate profile
          </Label>
        </div>

        {/* ── Publication cards ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 px-6">
          {publications.map((publication, index) => (
            <PublicationCard
              key={publication.id}
              index={index}
              publication={publication}
              onUpdate={updatePublication}
              fieldsDisabled={fieldsDisabled}
            />
          ))}
        </div>

        {/* ── Add entry button ──────────────────────────────────────────── */}
        <div
          className={cn(
            'flex justify-end px-6 py-4',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            aria-label="Add entry"
            className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
            onClick={addPublication}
          >
            <PlusIcon className="size-4 text-neutral-600!" />
          </Button>
        </div>

        {/* ── Step footer ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
          <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="h-12 w-48" onClick={handleNext}>
            Next
          </Button>
        </div>
      </div>

      {/* ── Disable Confirmation Dialog ───────────────────────────────────── */}
      <DisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        title="Are you sure?"
        message="Are you sure you want to disable this section? Disabling this section will permanently remove all added data. This action cannot be undone"
        cancelLabel="Cancel"
        disableLabel="Disable"
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={handleDisable}
      />
    </>
  );
}
