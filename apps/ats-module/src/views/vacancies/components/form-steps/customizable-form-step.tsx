import { ArrowLeft2, ArrowUp2, Simcard2, Trash } from 'iconsax-reactjs';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { StepProps } from '@/views/vacancies/types';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { Switch } from '@cgp/ui-kit/components/ui/switch';

export default function CustomizableFormStep({ onNext, onBack }: StepProps) {
  const { t } = useTranslation('ats');
  const [isEnabled, setIsEnabled] = useState(true);
  const [sectionTitle, setSectionTitle] = useState('');
  const [formTitle, setFormTitle] = useState('');

  const isSectionTitleError = sectionTitle.length > 200;
  const isFormTitleError = formTitle.length > 150;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between px-7 pt-7 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-slate-700 transition-colors hover:text-slate-900"
            aria-label={t('common.back')}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-[-0.1px] text-slate-900">
            {t('customizableForm.title')}
          </h2>
        </div>

        <Switch checked={isEnabled} onCheckedChange={setIsEnabled} size="lg" />
      </div>

      {/* Content area */}
      <div className="px-7 pb-6">
        {/* Section Title */}
        <div className="mt-2">
          <input
            type="text"
            placeholder={t('customizableForm.sectionTitlePlaceholder')}
            value={sectionTitle}
            onChange={e => setSectionTitle(e.target.value)}
            className="w-full border-0 border-b border-slate-200 bg-transparent px-0 pb-3 text-[24px] leading-8 font-bold tracking-[-0.144px] text-slate-900 placeholder:text-slate-300 focus:border-slate-300 focus:ring-0 focus:outline-none"
          />
          {isSectionTitleError && (
            <p className="mt-3 text-[13px] text-[#FF4A55]">
              {t('customizableForm.errors.maxLengthExceeded', { max: 200 })}
            </p>
          )}
        </div>

        {/* Form Builder heading */}
        <h3 className="mt-10 mb-6 text-lg leading-6 font-bold text-slate-900">
          {t('customizableForm.formBuilderTitle')}
        </h3>

        {/* Form card */}
        <div className="rounded-xl border border-neutral-300 bg-white p-5 shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
          {/* Form 01 header row */}
          <div className="flex items-center justify-between">
            <p className="text-base leading-6 font-bold text-slate-900">
              Form 01
            </p>

            <div className="flex items-center gap-3 text-slate-400">
              <button
                type="button"
                aria-label="Duplicate form"
                className="transition-colors hover:text-slate-700"
              >
                <Simcard2 size={24} />
              </button>

              <button
                type="button"
                aria-label="Delete form"
                className="transition-colors hover:text-red-600"
              >
                <Trash size={24} />
              </button>

              <button
                type="button"
                aria-label="Collapse form"
                className="transition-colors hover:text-slate-700"
              >
                <ArrowUp2 size={24} />
              </button>
            </div>
          </div>

          {/* Form Title */}
          <div className="mt-8">
            <input
              type="text"
              placeholder={t('customizableForm.formTitlePlaceholder')}
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full border-0 border-b border-slate-200 bg-transparent px-0 pb-3 text-[24px] leading-8 font-bold tracking-[-0.144px] text-slate-900 placeholder:text-slate-300 focus:border-slate-300 focus:ring-0 focus:outline-none"
            />
            {isFormTitleError && (
              <p className="mt-3 text-[13px] text-[#FF4A55]">
                {t('customizableForm.errors.maxLengthExceeded', { max: 150 })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button variant="secondary" className="h-12 w-48" onClick={onBack}>
          {t('common.cancel')}
        </Button>
        <Button className="h-12 w-48" onClick={() => onNext()}>
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
