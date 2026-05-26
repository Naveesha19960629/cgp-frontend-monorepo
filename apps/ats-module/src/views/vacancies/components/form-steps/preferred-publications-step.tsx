import { ChevronLeftIcon, ChevronUpIcon, PlusIcon } from 'lucide-react';

import { Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useState } from 'react';

import MessageBox from '@/app/components/message-box';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';

const MAX_PUBLISHER_LENGTH = 250;

export default function PreferredPublicationsStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  const [acceptedPublisher, setAcceptedPublisher] = useState('');
  const [publishedDateFrom, setPublishedDateFrom] = useState<
    string | undefined
  >(undefined);
  const [publishedDateTo, setPublishedDateTo] = useState<string | undefined>(
    undefined
  );

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  const handleToggle = () => {
    if (isEnabled) {
      setConfirmDisableOpen(true);
    } else {
      setIsEnabled(true);
    }
  };

  const handleDisable = () => {
    setAcceptedPublisher('');
    setPublishedDateFrom(undefined);
    setPublishedDateTo(undefined);
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
    <div className="flex flex-col gap-4 pb-6">
      {/* ── Informational Banner ────────────────────────────────────────── */}
      <div className="px-6">
        <MessageBox
          title="Build the Application Form"
          message={
            <>
              <span className="text-brand-primary-500 font-bold">
                Certain fields
              </span>{' '}
              in this section are always collected from candidates to support
              consistent candidate profiles. Any fields you don&apos;t select
              won&apos;t be collected
            </>
          }
        />
      </div>

      {/* ── Section Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6">
        <button
          type="button"
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
          onClick={onBack}
        >
          <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="flex-1 text-xl font-bold text-slate-900">
          Preferred Publications
        </h2>
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

      <div className="flex flex-col gap-4 px-6">
        {/* dataTakenFromCandidate — grayed when toggle off */}
        <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
          <div className="flex items-start gap-2">
            <Checkbox
              id="publicationsDataTakenFromCandidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={value => setDataTakenFromCandidate(!!value)}
              className="mt-0.5"
            />
            <Label
              htmlFor="publicationsDataTakenFromCandidate"
              className="cursor-pointer leading-snug"
            >
              If selected, no manual input is required, and data will be taken
              from the candidate profile
            </Label>
          </div>
        </div>

        {/* ── Publication Card ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-slate-200 bg-white">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Publication 01
            </h3>
            <ChevronUpIcon className="h-5 w-5 text-slate-300" />
          </div>

          {/* Card body */}
          <div
            className={cn(
              'flex flex-col gap-5 border-t border-slate-200 px-6 py-5',
              fieldsDisabled && 'pointer-events-none opacity-60'
            )}
          >
            {/* Row 1: Accepted Publisher | Published Date From | Published Date To */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Accepted Publisher</Label>
                  <CharacterCount
                    currentLength={acceptedPublisher.length}
                    maxLength={MAX_PUBLISHER_LENGTH}
                  />
                </div>
                <Input
                  value={acceptedPublisher}
                  onChange={e => setAcceptedPublisher(e.target.value)}
                  maxLength={MAX_PUBLISHER_LENGTH}
                  placeholder="Enter accepted publisher"
                  className="h-11"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Published Date From</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-11 w-full justify-between text-left font-normal',
                        !publishedDateFrom && 'text-slate-500'
                      )}
                    >
                      {publishedDateFrom
                        ? formatDate(publishedDateFrom)
                        : 'Select published date from'}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-slate-400"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        publishedDateFrom
                          ? new Date(publishedDateFrom)
                          : undefined
                      }
                      onSelect={date =>
                        setPublishedDateFrom(
                          date ? date.toISOString() : undefined
                        )
                      }
                      disabled={date => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Published Date To</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-11 w-full justify-between text-left font-normal',
                        !publishedDateTo && 'text-slate-500'
                      )}
                    >
                      {publishedDateTo
                        ? formatDate(publishedDateTo)
                        : 'Select published date to'}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-slate-400"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        publishedDateTo ? new Date(publishedDateTo) : undefined
                      }
                      onSelect={date =>
                        setPublishedDateTo(
                          date ? date.toISOString() : undefined
                        )
                      }
                      disabled={date =>
                        publishedDateFrom
                          ? date <= new Date(publishedDateFrom)
                          : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* ── Add Entry button (outside card, bottom-right) ─────────── */}
        <div
          className={cn(
            'flex justify-end',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Button
            variant="outline"
            size="icon"
            aria-label="Add entry"
            className="h-9 w-9 rounded-md text-slate-400"
            disabled
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="mt-auto flex justify-end gap-4 border-t border-slate-200 px-6 pt-4">
        <Button variant="secondary" className="h-12 w-44" onClick={onBack}>
          Cancel
        </Button>
        <Button className="h-12 w-44" onClick={() => onNext()}>
          Next
        </Button>
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
    </div>
  );
}
