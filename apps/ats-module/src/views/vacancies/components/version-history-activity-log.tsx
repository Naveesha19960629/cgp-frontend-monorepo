import { useTranslation } from 'react-i18next';

import TemplateEmptyStateMessage from '@/views/vacancies/components/template-empty-state-message';
import VersionHistoryChangeEntry from '@/views/vacancies/components/version-history-change-entry';
import type { VersionHistoryActivityLogProps } from '@/views/vacancies/types';
import { resolveVersionEntries } from '@/views/vacancies/utils';

/**
 * The right-hand panel of the Version History page: an "Activity Log"
 * heading, then every tracked change for the selected version — or the
 * "No Activity Available" empty state when the version has none.
 *
 * Attribution is resolved by the shared resolveVersionEntries() helper (see
 * utils/version-history-helpers.ts) so this panel and the downloaded PDF can
 * never disagree about who performed a change.
 */
export default function VersionHistoryActivityLog({
  version,
  createdBy,
}: Readonly<VersionHistoryActivityLogProps>) {
  const { t } = useTranslation('ats');

  const entries = resolveVersionEntries(version, createdBy);

  if (entries.length === 0) {
    return (
      <TemplateEmptyStateMessage
        title={t('versionHistory.activityLog.emptyState.title')}
        description={t('versionHistory.activityLog.emptyState.description')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Figma node 4229:229229 — Fonts/h6 (Bold 24/32, letterSpacing -0.6%
          of 24px = -0.144px), 28px above the first entry. */}
      <p className="text-2xl leading-8 font-bold tracking-[-0.144px] text-[#0f172a]">
        {t('versionHistory.activityLog.heading')}
      </p>
      <div className="flex flex-col gap-7">
        {entries.map((entry, index) => (
          <VersionHistoryChangeEntry
            // Entries are a point-in-time snapshot with no stable id, and
            // never reorder within a single render.
            key={index}
            entry={entry}
          />
        ))}
      </div>
    </div>
  );
}
