import { ChevronLeft } from 'lucide-react';

import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { StepHeaderProps } from '@/views/vacancies/types';

import { cn } from '@cgp/ui-kit/lib/utils';

export default function StepHeader({
  title,
  isEnabled,
  onBack,
  onToggle,
}: Readonly<StepHeaderProps>) {
  const { t } = useTranslation('ats');
  const titleId = useId();

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex size-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
          aria-label={t('common.back')}
        >
          <ChevronLeft className="size-4" />
        </button>
        <h2 id={titleId} className="text-lg font-bold text-slate-900">
          {title}
        </h2>
      </div>

      <button
        type="button"
        role="switch"
        // Named by the step title: "<section>, switch, on" (WCAG 4.1.2).
        aria-labelledby={titleId}
        aria-checked={isEnabled}
        onClick={onToggle}
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
  );
}
