import { ChevronUpIcon, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import {
  useTemplateFieldVisible,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import { useStepGuard } from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate, sanitizePlainText } from '@/views/vacancies/utils';
import {
  formatLocalDate,
  getHundredYearDateBoundaries,
  isBeforeMinDate,
  parseLocalDate,
} from '@/views/vacancies/utils/date-timezone-safe';

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
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';
import { isAfter, isBefore, startOfDay } from 'date-fns';

import DisableDialog from './disable-dialog';

const MAX_PUBLISHER_LENGTH = 250;
const {
  today: TODAY,
  minDate: HUNDRED_YEARS_AGO,
  maxDate: HUNDRED_YEARS_FROM_NOW,
} = getHundredYearDateBoundaries();

// Field codes for the Publications section; used to hide the entry content
// region entirely when the template forces every field's visibility to false.
const PUBLICATION_FIELD_CODES = [
  'acceptedPublisherName',
  'publishedDateFrom',
  'publishedDateTo',
] as const;

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
  const { t } = useTranslation('ats');
  const isFieldVisible = useTemplateFieldVisible('publications');

  return (
    <Collapsible
      open={publication.isOpen}
      onOpenChange={open => onUpdate(index, { isOpen: open })}
    >
      <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span
            data-testid="preferredPublications-cardTitle-label"
            className="text-base font-bold text-slate-900"
          >
            {t('preferredPublications.cardTitle', {
              number: String(index + 1).padStart(2, '0'),
            })}
          </span>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-slate-400 transition-colors hover:text-slate-600"
              aria-label={
                publication.isOpen
                  ? t('preferredPublications.collapse')
                  : t('preferredPublications.expand')
              }
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
            <div className="quad-pub-sports:grid-cols-4 grid grid-cols-1 gap-4">
              {isFieldVisible('acceptedPublisherName') && (
                <div className="quad-pub-sports:col-span-1 flex min-w-0 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      data-testid="preferredPublications-acceptedPublisher-label"
                      className="min-w-0"
                    >
                      {t('preferredPublications.labels.acceptedPublisher')}
                    </Label>
                    <CharacterCount
                      currentLength={publication.acceptedPublisher.length}
                      maxLength={MAX_PUBLISHER_LENGTH}
                    />
                  </div>
                  <Input
                    value={publication.acceptedPublisher}
                    onChange={e => {
                      const sanitized = sanitizePlainText(e.target.value);
                      onUpdate(index, {
                        acceptedPublisher: sanitized.trimStart(),
                      });
                    }}
                    maxLength={MAX_PUBLISHER_LENGTH}
                    placeholder={t(
                      'preferredPublications.placeholders.acceptedPublisher'
                    )}
                    disabled={fieldsDisabled}
                    className="h-11"
                  />
                </div>
              )}

              {isFieldVisible('publishedDateFrom') && (
                <div className="quad-pub-sports:col-span-1 flex min-w-0 flex-col gap-1">
                  <div className="flex min-h-5 items-center">
                    <Label data-testid="preferredPublications-publishedDateFrom-label">
                      {t('preferredPublications.labels.publishedDateFrom')}
                    </Label>
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
                          'border-input flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                          !publication.publishedDateFrom && 'text-slate-500',
                          publication.publishedDateFrom && 'text-zinc-800',
                          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                          'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                          applyTypography('body-medium'),
                          'shadow-none!'
                        )}
                      >
                        <span className="min-w-0 truncate text-left">
                          {publication.publishedDateFrom
                            ? formatDate(publication.publishedDateFrom)
                            : t(
                                'preferredPublications.placeholders.publishedDateFrom'
                              )}
                        </span>
                        <CalendarIcon
                          variant="Linear"
                          size={20}
                          className="shrink-0 text-zinc-800"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          parseLocalDate(publication.publishedDateFrom) ??
                          undefined
                        }
                        defaultMonth={
                          parseLocalDate(publication.publishedDateFrom) ||
                          parseLocalDate(publication.publishedDateTo) ||
                          new Date()
                        }
                        onSelect={date => {
                          onUpdate(index, {
                            publishedDateFrom: date
                              ? formatLocalDate(date)
                              : undefined,
                          });
                          onUpdate(index, { openDatePopover: null });

                          if (publication.publishedDateTo && date) {
                            const toDate = parseLocalDate(
                              publication.publishedDateTo
                            );
                            if (toDate != null && toDate < date) {
                              onUpdate(index, { publishedDateTo: undefined });
                            }
                          }
                        }}
                        disabled={date =>
                          isAfter(startOfDay(date), TODAY) ||
                          isBeforeMinDate(date, HUNDRED_YEARS_AGO)
                        }
                        captionLayout="dropdown"
                        startMonth={HUNDRED_YEARS_AGO}
                        endMonth={TODAY}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {isFieldVisible('publishedDateTo') && (
                <div className="quad-pub-sports:col-span-1 flex min-w-0 flex-col gap-1">
                  <div className="flex min-h-5 items-center">
                    <Label data-testid="preferredPublications-publishedDateTo-label">
                      {t('preferredPublications.labels.publishedDateTo')}
                    </Label>
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
                          'border-input flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                          !publication.publishedDateTo && 'text-slate-500',
                          publication.publishedDateTo && 'text-zinc-800',
                          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                          'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                          applyTypography('body-medium'),
                          'shadow-none!'
                        )}
                      >
                        <span className="min-w-0 truncate text-left">
                          {publication.publishedDateTo
                            ? formatDate(publication.publishedDateTo)
                            : t(
                                'preferredPublications.placeholders.publishedDateTo'
                              )}
                        </span>
                        <CalendarIcon
                          variant="Linear"
                          size={20}
                          className="shrink-0 text-zinc-800"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          parseLocalDate(publication.publishedDateTo) ??
                          undefined
                        }
                        defaultMonth={
                          parseLocalDate(publication.publishedDateTo) ||
                          parseLocalDate(publication.publishedDateFrom) ||
                          new Date()
                        }
                        onSelect={date => {
                          onUpdate(index, {
                            publishedDateTo: date
                              ? formatLocalDate(date)
                              : undefined,
                          });
                          onUpdate(index, { openDatePopover: null });
                        }}
                        disabled={date => {
                          const day = startOfDay(date);
                          const fromDate = parseLocalDate(
                            publication.publishedDateFrom
                          );
                          return (
                            isBeforeMinDate(date, HUNDRED_YEARS_AGO) ||
                            isAfter(day, HUNDRED_YEARS_FROM_NOW) ||
                            (fromDate != null &&
                              isBefore(day, startOfDay(fromDate)))
                          );
                        }}
                        captionLayout="dropdown"
                        startMonth={HUNDRED_YEARS_AGO}
                        endMonth={HUNDRED_YEARS_FROM_NOW}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
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
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: contextForm, onCancel } = useVacancyForm();
  const isFieldVisible = useTemplateFieldVisible('publications');
  const hasAnyVisibleField = PUBLICATION_FIELD_CODES.some(code =>
    isFieldVisible(code)
  );
  const savedPublications = contextForm.preferredPublications;
  const vacancyStatus = contextForm.status;

  const [isEnabled, setIsEnabled] = useState(
    savedPublications?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    savedPublications?.dataTakenFromCandidate ?? false
  );
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

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

  const {
    setForm,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();
  const _publicationsRef = useRef<() => void>(() => {});
  useEffect(() => {
    _publicationsRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredPublications: {
          isEnabled,
          dataTakenFromCandidate,
          publications,
        },
      }));
    };
  }, [isEnabled, dataTakenFromCandidate, publications, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _publicationsRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredPublications: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          publications: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  const hasPublicationData = publications.some(
    p =>
      p.acceptedPublisher.trim().length > 0 ||
      p.publishedDateFrom != null ||
      p.publishedDateTo != null
  );

  const handleNext = () => {
    const isEmptyEnabledSection =
      isEnabled && !dataTakenFromCandidate && !hasPublicationData;

    if (isEmptyEnabledSection) {
      setEmptyDisableOpen(true);
      return;
    }

    onNext({
      preferredPublications: {
        isEnabled,
        dataTakenFromCandidate,
        publications,
      },
    });
  };

  useStepGuard(isEnabled && !dataTakenFromCandidate && !hasPublicationData);

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;
  const canNavigate =
    !isEnabled || dataTakenFromCandidate || hasPublicationData;

  const handleToggle = () => {
    if (isEnabled) {
      if (canNavigate) {
        setConfirmDisableOpen(true);
      } else {
        setIsEnabled(false);
      }
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
    removeCompletedStep(currentStepIndex);
    setConfirmDisableOpen(false);
    SuccessToast({
      title: t('preferredPublications.notifications.disable.title'),
      description: t('preferredPublications.notifications.disable.message'),
    });
  };

  const handleBack = () => {
    if (!canNavigate) {
      return;
    }

    stepPersistRef.current?.();
    onBack();
  };

  return (
    <>
      <div
        data-testid="preferredPublications-section-form"
        className="flex flex-1 flex-col"
      >
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
              aria-label={t('preferredPublications.back')}
              className={cn(
                'cursor-pointer text-slate-700 transition-colors hover:text-slate-900',
                !canNavigate &&
                  'cursor-not-allowed opacity-40 hover:text-slate-700'
              )}
              onClick={handleBack}
              disabled={!canNavigate}
            >
              <ArrowLeft2 size={24} />
            </button>
            <h2
              data-testid="preferredPublications-header-label"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              {t('preferredPublications.title')}
            </h2>
            {mode === 'edit' && vacancyStatus ? (
              <VacancyStatusBadge
                status={vacancyStatus}
                applicantCount={contextForm.applicantCount}
              />
            ) : null}
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            size="lg"
            data-testid="toggle-on-off-switch"
          />
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
            disabled={!isEnabled}
            onCheckedChange={value => {
              const checked = !!value;
              setDataTakenFromCandidate(checked);
              if (checked) {
                setPublications([
                  {
                    id: '1',
                    isOpen: true,
                    acceptedPublisher: '',
                    publishedDateFrom: undefined,
                    publishedDateTo: undefined,
                  },
                ]);
              }
            }}
            className="mt-0.5"
          />
          <Label
            htmlFor="publicationsDataTakenFromCandidate"
            data-testid="preferredPublications-dataTakenFromCandidate-label"
            className="cursor-pointer text-sm leading-snug font-medium text-slate-900"
          >
            {t('preferredPublications.dataTakenFromCandidate')}
          </Label>
        </div>

        {hasAnyVisibleField && (
          <>
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
                type="button"
                variant="secondary"
                size="icon"
                disabled
                aria-label={t('preferredPublications.addEntry')}
                className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
                onClick={addPublication}
              >
                <PlusIcon className="size-4 text-neutral-600!" />
              </Button>
            </div>
          </>
        )}

        {/* ── Step footer ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
          <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
            {t('preferredPublications.cancel')}
          </Button>
          <Button
            className="h-12 w-48"
            onClick={handleNext}
            disabled={!canNavigate}
          >
            {t('preferredPublications.next')}
          </Button>
        </div>
      </div>

      {/* ── Disable Confirmation Dialog ───────────────────────────────────── */}
      <DisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        title={t('preferredPublications.confirmDisableDialog.title')}
        message={t('preferredPublications.confirmDisableDialog.message')}
        cancelLabel={t('preferredPublications.confirmDisableDialog.cancel')}
        disableLabel={t('preferredPublications.confirmDisableDialog.disable')}
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={handleDisable}
      />

      <StepDisableDialog
        open={emptyDisableOpen}
        onOpenChange={setEmptyDisableOpen}
        onConfirm={() => {
          setIsEnabled(false);
          setDataTakenFromCandidate(false);
          setEmptyDisableOpen(false);
          onNext({
            preferredPublications: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              publications: [],
            },
          });
        }}
        title={t('preferredPublications.emptyDisableDialog.title')}
        description={t('preferredPublications.emptyDisableDialog.message')}
        cancelLabel={t('preferredPublications.emptyDisableDialog.cancel')}
        confirmLabel={t('preferredPublications.emptyDisableDialog.disable')}
      />
    </>
  );
}
