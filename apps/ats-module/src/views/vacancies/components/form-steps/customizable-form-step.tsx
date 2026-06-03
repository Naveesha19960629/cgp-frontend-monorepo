import { ChevronUp, Copy, Trash2 } from 'lucide-react';

import { ArrowLeft2 } from 'iconsax-reactjs';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { StepProps } from '@/views/vacancies/types';

import { Input } from '@cgp/ui-kit/components/ui/input';
import { cn } from '@cgp/ui-kit/lib/utils';

import StepFooter from './step-footer';

export default function CustomizableFormStep({ onNext, onBack }: StepProps) {
  const { t } = useTranslation('ats');
  const [isEnabled, setIsEnabled] = useState(true);

  return (
    <div>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-slate-700 transition-colors hover:text-slate-900"
            aria-label={t('common.back')}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Customizable Form
          </h2>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => setIsEnabled(value => !value)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            isEnabled ? 'bg-teal-600' : 'bg-slate-200'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <div className="px-7 py-6">
        <div className="space-y-8">
          <div>
            <Input
              placeholder="Section Title"
              className="h-8 rounded-none border-x-0 border-t-0 px-0 text-slate-900 shadow-none placeholder:text-slate-300 focus-visible:ring-0"
              style={{
                fontSize: '20px',
                lineHeight: '24px',
                fontWeight: 700,
                letterSpacing: '-0.6%',
              }}
            />
            <div className="mt-6 border-b border-slate-200" />
          </div>

          <div>
            <h3
              className="mb-6 text-slate-900"
              style={{
                fontSize: '24px',
                lineHeight: '24px',
                fontWeight: 700,
                letterSpacing: '-0.144px',
              }}
            >
              Form Builder
            </h3>

            <div className="rounded-xl border border-neutral-300 bg-white px-5 py-5 shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
              <div className="mb-6 flex items-center justify-between">
                <p
                  className="text-slate-900"
                  style={{
                    fontSize: '18px',
                    lineHeight: '24px',
                    fontWeight: 700,
                  }}
                >
                  Form 01
                </p>

                <div className="flex items-center gap-3 text-slate-400">
                  <button
                    type="button"
                    aria-label="Copy form"
                    className="transition-colors hover:text-slate-700"
                  >
                    <Copy className="size-5" />
                  </button>

                  <button
                    type="button"
                    aria-label="Delete form"
                    className="transition-colors hover:text-red-600"
                  >
                    <Trash2 className="size-5" />
                  </button>

                  <button
                    type="button"
                    aria-label="Collapse form"
                    className="transition-colors hover:text-slate-700"
                  >
                    <ChevronUp className="size-5" />
                  </button>
                </div>
              </div>

              <Input
                placeholder="Form Title"
                className="h-8 rounded-none border-x-0 border-t-0 px-0 text-slate-900 shadow-none placeholder:text-slate-300 focus-visible:ring-0"
                style={{
                  fontSize: '20px',
                  lineHeight: '24px',
                  fontWeight: 700,
                  letterSpacing: '-0.6%',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <StepFooter onNext={onNext} onCancel={onBack} />
    </div>
  );
}
