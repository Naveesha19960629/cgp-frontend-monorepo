import { ChevronLeft } from 'lucide-react';

import { useTranslation } from 'react-i18next';

interface VacancyTemplatePageHeaderProps {
  headingKey: string;
  refNumber?: string;
  onBack: () => void;
}

/** Shared header for the create/edit template pages — only the back arrow navigates; the title is plain text. */
export default function VacancyTemplatePageHeader({
  headingKey,
  refNumber,
  onBack,
}: Readonly<VacancyTemplatePageHeaderProps>) {
  const { t } = useTranslation('ats');

  return (
    <header className="flex items-center justify-between px-7 pt-6">
      <div className="flex items-center gap-2 text-2xl leading-8 font-bold tracking-[-0.144px] text-slate-900">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={onBack}
          className="flex cursor-pointer items-center rounded-md focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:outline-none"
        >
          <ChevronLeft className="size-6" />
        </button>
        <span>{t(headingKey)}</span>
      </div>
      {/* System-generated Template ID (#T…), display-only (AC 3). */}
      {refNumber && (
        <span className="text-xs font-medium text-slate-400">{refNumber}</span>
      )}
    </header>
  );
}
