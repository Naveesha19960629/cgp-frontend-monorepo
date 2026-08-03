import { useTranslation } from 'react-i18next';

import type { VersionHistoryChangeSummaryProps } from '@/views/vacancies/types';

import { cn } from '@cgp/ui-kit/lib/utils';

const VARIANT_VERB_CLASS: Record<
  VersionHistoryChangeSummaryProps['variant'],
  string
> = {
  added: 'text-[#047857]',
  removed: 'text-[#be123c]',
  updated: 'text-[#047857]',
};

/**
 * The header line above a change's values:
 * "Section Name - Secondary Education │ Added New 2 Schools".
 *
 * Per Figma (BFyxZ6AzbRZgVvjLzRFwv3, node 4229:229322) the weights and colours
 * are mixed rather than uniform: the "Section Name - " prefix is semibold and
 * the section itself bold (both slate/700), and only the *verb* of the summary
 * carries the accent colour — the rest of it stays slate/700 bold. The rule
 * between them is a 16px-tall hairline.
 */
export default function VersionHistoryChangeSummary({
  sectionName,
  verb,
  detail,
  variant,
}: Readonly<VersionHistoryChangeSummaryProps>) {
  const { t } = useTranslation('ats');

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm leading-5 text-[#334155]">
      <span>
        <span className="font-semibold">
          {t('versionHistory.sectionNameLabel')}
        </span>
        <span className="font-bold">{sectionName}</span>
      </span>
      <span aria-hidden className="h-4 w-px shrink-0 bg-[#e5e5e5]" />
      <span className="font-bold">
        <span className={cn(VARIANT_VERB_CLASS[variant])}>{verb}</span>
        {detail ? ` ${detail}` : null}
      </span>
    </div>
  );
}
