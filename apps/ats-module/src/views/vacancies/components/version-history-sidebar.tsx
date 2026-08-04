import { Monitor } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import type { VersionHistorySidebarProps } from '@/views/vacancies/types';
import {
  formatVersionListDate,
  isSystemActor,
  resolveVersionActor,
} from '@/views/vacancies/utils';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@cgp/ui-kit/components/ui/avatar';
import { cn } from '@cgp/ui-kit/lib/utils';

/**
 * Left-hand version list — click a row to select it, which drives both the
 * Activity Log panel and which version the Download button exports.
 *
 * Row layout follows Figma (BFyxZ6AzbRZgVvjLzRFwv3, nodes 4229:229405
 * selected / 4229:229412 default): a 116px row inset 28px, the version number
 * set large (Fonts/h5 — Bold 32/40, letterSpacing -0.75% of 32px = -0.24px)
 * with the uppercase date right-aligned on the same line, then a 16px gap and
 * a 20px avatar + the updater's name (Fonts/body-medium — Medium 14/20).
 * Selected rows take the brand-green/100 fill and tint only the number —
 * the date and name stay basic/900 in both states.
 */
export default function VersionHistorySidebar({
  versions,
  selectedVersionNumber,
  onSelectVersion,
  createdBy,
}: Readonly<VersionHistorySidebarProps>) {
  const { t } = useTranslation('ats');
  const sortedVersions = [...versions].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );

  return (
    // Figma's sidebar is 471 of the 1628px content width (29%); keeping it
    // proportional rather than a fixed 471px stops it dominating narrower
    // viewports, with a floor so the 32px number and date still fit one line.
    //
    // The sidebar frame (node 4229:229403) carries NO border at all — its
    // className is `bg-white overflow-clip shadow-[0px_4px_4px_...]`, a soft
    // elevation shadow, not a hard rule. A `border-r` was added here without
    // a matching source in the design, which is what read as an inconsistent
    // "extra" line against the header's genuine `border-b` (confirmed on
    // node 4229:229200) when the two were compared side by side.
    <nav className="flex w-[29%] min-w-75 shrink-0 flex-col overflow-y-auto bg-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
      {sortedVersions.map(version => {
        const isSelected = version.versionNumber === selectedVersionNumber;
        const actor = resolveVersionActor(version, createdBy);
        const isSystem = isSystemActor(actor);
        const actorLabel = isSystem ? t('versionHistory.systemLabel') : actor;

        return (
          <button
            key={version.versionNumber}
            type="button"
            aria-pressed={isSelected}
            // The number alone carries version identity visually (as in
            // Figma); the full "Version N" phrasing stays in the accessible
            // name so screen readers and tests aren't left with a bare digit.
            aria-label={t('versionHistory.sidebar.versionLabel', {
              number: version.versionNumber,
            })}
            onClick={() => onSelectVersion(version.versionNumber)}
            className={cn(
              'flex cursor-pointer flex-col gap-4 border-b border-[#e5e5e5] px-7 py-5 text-left transition-colors',
              isSelected ? 'bg-[#e6eeee]' : 'hover:bg-[#f8fafc]'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  'text-[32px] leading-10 font-bold tracking-[-0.24px]',
                  isSelected ? 'text-[#075056]' : 'text-[#0f172a]'
                )}
              >
                {version.versionNumber}
              </span>
              <span className="text-sm leading-5 font-medium whitespace-nowrap text-[#0f172a]">
                {formatVersionListDate(version.updatedAt)}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Avatar
                className={cn(
                  'size-5 shrink-0',
                  isSystem ? 'bg-[#f1f5f9]' : 'bg-[#0f172a]'
                )}
              >
                {!isSystem && version.profilePicture && (
                  <AvatarImage src={version.profilePicture} alt="" />
                )}
                <AvatarFallback className="bg-transparent text-[10px] font-bold text-white">
                  {isSystem ? (
                    <Monitor
                      className="size-3 text-[#475569]"
                      strokeWidth={1.75}
                    />
                  ) : (
                    actorLabel.slice(0, 1).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              {/* min-w-0 + flex-1 are what actually let `truncate` bite: a
                  flex item defaults to min-width:auto, so a long email would
                  otherwise refuse to shrink and wrap onto a second line. */}
              <span className="min-w-0 flex-1 truncate text-sm leading-5 font-medium text-[#0f172a]">
                {actorLabel}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
