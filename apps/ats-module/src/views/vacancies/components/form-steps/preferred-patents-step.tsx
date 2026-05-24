import { CalendarDays, ChevronUp, Plus, Trash2 } from 'lucide-react';

import { ArrowLeft2 } from 'iconsax-reactjs';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import MessageBox from '@/components/message-box';
import type { PreferredPatent, StepProps } from '@/views/vacancies/types';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import MultipleSelector from '@cgp/ui-kit/components/multiple-selector';
import type { Option } from '@cgp/ui-kit/components/multiple-selector';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cgp/ui-kit/components/ui/collapsible';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { cn } from '@cgp/ui-kit/lib/utils';

const STATUS_OPTIONS: Option[] = [
  { label: 'Patent Pending' },
  { label: 'Granted' },
  { label: 'Expired' },
  { label: 'Abandoned' },
];

const INDUSTRY_OPTIONS: Option[] = [
  { label: 'IT Industry' },
  { label: 'Healthcare' },
  { label: 'Finance' },
  { label: 'Manufacturing' },
  { label: 'Energy' },
];

function PatentCard({
  patent,
  index,
  onChange,
  onRemove,
}: {
  patent: PreferredPatent;
  index: number;
  onChange: (updated: PreferredPatent) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation('ats');

  const industriesAsOptions: Option[] = patent.relatedIndustries.map(i => ({
    label: i.label,
    id: i.id,
  }));

  const statusesAsOptions: Option[] = patent.statuses.map(s => ({
    label: s.label,
    id: s.id,
  }));

  const totalIndustryChars = patent.relatedIndustries.reduce(
    (sum, i) => sum + i.label.length,
    0
  );

  return (
    <Collapsible
      open={patent.isOpen}
      onOpenChange={open => onChange({ ...patent, isOpen: open })}
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
              disabled
              onClick={onRemove}
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
                  patent.isOpen
                    ? t('preferredPatents.collapse')
                    : t('preferredPatents.expand')
                }
              >
                <ChevronUp
                  className={cn(
                    'size-5 transition-transform',
                    !patent.isOpen && 'rotate-180'
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900">
                  {t('preferredPatents.relatedIndustry')}
                </label>
                <CharacterCount
                  maxLength={100}
                  currentLength={totalIndustryChars}
                />
              </div>
              <MultipleSelector
                value={industriesAsOptions}
                options={INDUSTRY_OPTIONS}
                placeholder={t('preferredPatents.relatedIndustryPlaceholder')}
                creatable
                hideClearAllButton
                onChange={options =>
                  onChange({
                    ...patent,
                    relatedIndustries: options.map(o => ({
                      label: o.label,
                      id: o.id,
                    })),
                  })
                }
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-900">
                {t('preferredPatents.status')}
              </label>
              <MultipleSelector
                value={statusesAsOptions}
                options={STATUS_OPTIONS}
                placeholder={t('preferredPatents.statusPlaceholder')}
                hideClearAllButton
                onChange={options =>
                  onChange({
                    ...patent,
                    statuses: options.map(o => ({ label: o.label, id: o.id })),
                  })
                }
              />
            </div>

            <div className="flex gap-4">
              {/* From date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  {t('preferredPatents.from')}
                </label>
                <div className="relative">
                  <Input
                    placeholder={t('preferredPatents.fromPlaceholder')}
                    value={patent.fromDate}
                    onChange={e =>
                      onChange({ ...patent, fromDate: e.target.value })
                    }
                    className="h-11 pr-10"
                  />
                  <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* To date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-900">
                  {t('preferredPatents.to')}
                </label>
                <div className="relative">
                  <Input
                    placeholder={t('preferredPatents.toPlaceholder')}
                    value={patent.toDate}
                    onChange={e =>
                      onChange({ ...patent, toDate: e.target.value })
                    }
                    className="h-11 pr-10"
                  />
                  <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
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

  const [isEnabled, setIsEnabled] = useState(true);
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(false);
  const [patents, setPatents] = useState<PreferredPatent[]>([
    {
      id: '1',
      relatedIndustries: [],
      statuses: [],
      fromDate: '',
      toDate: '',
      isOpen: true,
    },
  ]);

  const addPatent = () => {
    setPatents(prev => [
      ...prev,
      {
        id: String(Date.now()),
        relatedIndustries: [],
        statuses: [],
        fromDate: '',
        toDate: '',
        isOpen: true,
      },
    ]);
  };

  const updatePatent = (id: string, updated: PreferredPatent) => {
    setPatents(prev => prev.map(p => (p.id === id ? updated : p)));
  };

  const removePatent = (id: string) => {
    setPatents(prev => prev.filter(p => p.id !== id));
  };

  const handleCancel = () => {
    void navigate('/dashboard/ats/vacancies');
  };

  return (
    <div className="flex flex-col">
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
            <ArrowLeft2 className="size-6 stroke-2" strokeWidth="2px" />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t('preferredPatents.title')}
          </h2>
        </div>

        {/* Toggle switch */}
        <Switch
          checked={isEnabled}
          onCheckedChange={v => setIsEnabled(Boolean(v))}
        />
      </div>

      {/* Checkbox: data from candidate profile */}
      <div className="flex items-center gap-3 px-7 pb-8">
        <Checkbox
          id="data-from-candidate"
          checked={dataTakenFromCandidate}
          onCheckedChange={v => setDataTakenFromCandidate(Boolean(v))}
        />
        <label
          htmlFor="data-from-candidate"
          className="cursor-pointer text-sm font-medium text-slate-900"
        >
          {t('preferredPatents.dataTakenFromCandidate')}
        </label>
      </div>

      {/* Patent cards */}
      <div className="flex flex-col gap-4 px-6">
        {patents.map((patent, index) => (
          <PatentCard
            key={patent.id}
            patent={patent}
            index={index}
            onChange={updated => updatePatent(patent.id, updated)}
            onRemove={() => removePatent(patent.id)}
          />
        ))}
      </div>

      {/* Add patent button */}
      <div className="flex justify-end px-6 py-4">
        <Button
          variant="secondary"
          className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
          onClick={addPatent}
          disabled
        >
          <Plus className="size-4 text-neutral-600!" />
        </Button>
      </div>

      {/* Footer: Cancel + Next */}
      <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button
          variant="secondary"
          className="h-12 w-48"
          onClick={handleCancel}
        >
          {t('preferredPatents.cancelButton')}
        </Button>
        <Button className="h-12 w-48" onClick={() => onNext()}>
          {t('preferredPatents.nextButton')}
        </Button>
      </div>
    </div>
  );
}
