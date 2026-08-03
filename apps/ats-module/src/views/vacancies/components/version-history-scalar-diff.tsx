import { ArrowRight } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import type { VersionHistoryScalarDiffProps } from '@/views/vacancies/types';

/**
 * Two side-by-side boxes holding a field's previous and updated values,
 * joined by an arrow — Figma's "Question Text Updated" / "Option Value
 * Updated" pattern (BFyxZ6AzbRZgVvjLzRFwv3, node 4229:229804). Longer
 * free-text field values get their own box each instead of sharing the
 * compact single-line InlineDiffRow, which Figma reserves for short
 * vacancy-level fields (status, title, schedule/expiration dates).
 */
export default function VersionHistoryScalarDiff({
  field,
  before,
  after,
}: Readonly<VersionHistoryScalarDiffProps>) {
  const { t } = useTranslation('ats');

  return (
    <div className="flex items-center gap-5">
      <div className="min-w-0 flex-1 rounded-lg border border-[#d4d4d4] bg-white p-7">
        <p className="text-base font-bold wrap-break-word text-[#0f172a]">
          {before}
        </p>
        <p className="mt-1 text-sm font-medium text-[#475569]">
          {t('versionHistory.changeTypes.previousValue', { field })}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-[#475569]" />
      <div className="min-w-0 flex-1 rounded-lg border border-[#059669] bg-white p-7">
        <p className="text-base font-bold wrap-break-word text-[#047857]">
          {after}
        </p>
        <p className="mt-1 text-sm font-medium text-[#475569]">
          {t('versionHistory.changeTypes.updatedValue', { field })}
        </p>
      </div>
    </div>
  );
}
