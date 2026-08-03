import { ChevronLeft, Download } from 'lucide-react';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import {
  VacancyLoadingState,
  VersionHistoryActivityLog,
  VersionHistorySidebar,
} from '@/views/vacancies/components';
import { useVacancyVersionHistoryQuery } from '@/views/vacancies/hooks';
import {
  buildVersionHistoryPdfBlob,
  formatDisplayDate,
} from '@/views/vacancies/utils';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Spinner } from '@cgp/ui-kit/components/ui/spinner';

const VACANCIES_LIST_ROUTE = '/dashboard/ats/vacancies';

// The header's meta icons are the design's own vuesax *bold* (filled) glyphs,
// exported from Figma (node 4229:229200) rather than substituted with
// lucide's outline equivalents — the filled/outline difference is visible at
// this size. They carry the design's #475569 fill internally, matching the
// meta text they sit beside.
const META_ICONS = {
  calendar: new URL(
    '../../../assets/images/icon-calendar-bold.svg',
    import.meta.url
  ).href,
  clock: new URL('../../../assets/images/icon-clock-bold.svg', import.meta.url)
    .href,
  user: new URL('../../../assets/images/icon-user-bold.svg', import.meta.url)
    .href,
  versions: new URL(
    '../../../assets/images/icon-versions-bold.svg',
    import.meta.url
  ).href,
} as const;

const META_ICON_SIZE = 20;

export default function VacancyIdVersionHistoryPage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<
    number | null
  >(null);

  const { data: queryResponse, isLoading } = useVacancyVersionHistoryQuery(
    id || ''
  );
  const versionHistoryData = queryResponse?.success
    ? queryResponse.data
    : undefined;

  const sortedVersions = useMemo(
    () =>
      [...(versionHistoryData?.versions ?? [])].sort(
        (a, b) => b.versionNumber - a.versionNumber
      ),
    [versionHistoryData]
  );
  const latestVersionNumber = sortedVersions[0]?.versionNumber;
  const effectiveSelectedVersionNumber =
    selectedVersionNumber ?? latestVersionNumber;
  const selectedVersion = sortedVersions.find(
    version => version.versionNumber === effectiveSelectedVersionNumber
  );

  const handleBack = () => {
    void navigate(VACANCIES_LIST_ROUTE);
  };

  const handleDownload = async () => {
    if (!versionHistoryData || !selectedVersion) return;

    setIsDownloading(true);
    try {
      // The PDF now draws its own version-list sidebar (matching the
      // on-screen one) with the selected version highlighted, so it needs
      // every version, not just the selected one's data.
      const blob = await buildVersionHistoryPdfBlob(versionHistoryData, {
        selectedVersionNumber: selectedVersion.versionNumber,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${versionHistoryData.vacancyTitle}-Version-${selectedVersion.versionNumber}-History.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      SuccessToast({
        title: t('versionHistory.notifications.success.title'),
        description: t('versionHistory.notifications.success.message'),
      });
    } catch (downloadError) {
      console.error('[VersionHistory] Download failed:', downloadError);
      ErrorToast({
        title: t('versionHistory.notifications.error.title'),
        description: t('versionHistory.notifications.error.message'),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!id) {
    return (
      <div className="flex min-h-full items-center justify-center px-7 py-5">
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-bold text-slate-900">
            {t('common.error.title')}
          </p>
          <p className="text-sm text-slate-600">
            {t('versionHistory.invalidId')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Figma BFyxZ6AzbRZgVvjLzRFwv3, node 4229:229200: gray/100 fill with a
          neutral/200 bottom rule, 28px inset all round, a 28px gap under the
          breadcrumb and a 16px gap under the title. Note Figma reports
          letterSpacing as a PERCENT — h6's "-0.6" is -0.6% of 24px
          (-0.144px) and h4's "-0.75" is -0.75% of 36px (-0.27px), not px.
          The rule's color is the design's literal #e5e5e5 at full opacity,
          but a CSS 1px solid border of that color renders visibly heavier in
          a browser than Figma's own hairline (Figma anti-aliases vector
          strokes; browsers draw a crisp full-opacity line) — confirmed
          against a live render, not a token mismatch — so the opacity is
          dialed back to read as the same subtle hairline. */}
      <header className="flex items-start justify-between gap-4 border-b border-[#e5e5e5]/60 bg-[#f8fafc] px-7 py-7">
        <div className="flex flex-col">
          {/* The back chevron matches Figma's breadcrumb (node 4229:229204)
              — restored on the page only, per explicit request; the PDF's
              breadcrumb deliberately stays chevron-less (it's not an
              interactive control there). */}
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={handleBack}
            className="flex cursor-pointer items-center gap-2 self-start rounded-md text-2xl leading-8 font-bold tracking-[-0.144px] text-[#0f172a] focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:outline-none"
          >
            <ChevronLeft className="size-6 shrink-0" />
            <span>{t('versionHistory.heading')}</span>
          </button>
          {versionHistoryData && (
            <>
              <p className="mt-7 text-[36px] leading-10 font-bold tracking-[-0.27px] text-[#0f172a]">
                {versionHistoryData.vacancyTitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-base leading-6 font-semibold text-[#475569]">
                <span className="flex items-center gap-1">
                  <img
                    src={META_ICONS.calendar}
                    alt=""
                    width={META_ICON_SIZE}
                    height={META_ICON_SIZE}
                    className="shrink-0"
                  />
                  {t('versionHistory.meta.created', {
                    date: formatDisplayDate(versionHistoryData.createdAt),
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <img
                    src={META_ICONS.clock}
                    alt=""
                    width={META_ICON_SIZE}
                    height={META_ICON_SIZE}
                    className="shrink-0"
                  />
                  {t('versionHistory.meta.lastUpdated', {
                    date: formatDisplayDate(versionHistoryData.lastUpdatedAt),
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <img
                    src={META_ICONS.user}
                    alt=""
                    width={META_ICON_SIZE}
                    height={META_ICON_SIZE}
                    className="shrink-0"
                  />
                  {versionHistoryData.createdBy}
                </span>
                <span className="flex items-center gap-1">
                  <img
                    src={META_ICONS.versions}
                    alt=""
                    width={META_ICON_SIZE}
                    height={META_ICON_SIZE}
                    className="shrink-0"
                  />
                  {t('versionHistory.meta.versionsCount', {
                    count: versionHistoryData.totalVersions,
                  })}
                </span>
              </div>
            </>
          )}
        </div>

        <Button
          size="icon"
          variant="outline"
          className="size-11 rounded-lg border-slate-300"
          onClick={() => void handleDownload()}
          disabled={isDownloading || !selectedVersion}
          aria-label={t('versionHistory.download')}
        >
          {isDownloading ? (
            <Spinner className="size-5 text-slate-500" />
          ) : (
            <Download className="size-5! text-slate-500" />
          )}
        </Button>
      </header>

      {/* VacancyLoadingState sizes itself with h-full and no width — this
          resolves correctly as a plain flex-grow block (matching every other
          page that uses it, e.g. edit-vacancy-template-page.tsx), but did
          NOT reliably resolve as a stretched child inside a nested flex ROW
          (the sidebar/content layout below), which left it uncentered
          vertically — sitting flush against the top with dead space below,
          not the "other pages" look it was supposed to match. Loading gets
          its own single-level flex-1 wrapper instead of sharing the row. */}
      {isLoading && (
        <div className="min-h-0 flex-1">
          <VacancyLoadingState />
        </div>
      )}
      {!isLoading && (
        <div className="flex min-h-0 flex-1">
          {versionHistoryData ? (
            <>
              <VersionHistorySidebar
                versions={sortedVersions}
                selectedVersionNumber={effectiveSelectedVersionNumber ?? -1}
                onSelectVersion={setSelectedVersionNumber}
                createdBy={versionHistoryData.createdBy}
              />
              {/* Figma node 4229:229227 — the Activity Log sits on a plain
                  white panel, inset 28px (node 4229:229228 starts at x=500
                  in a panel beginning at x=472). */}
              <div className="flex-1 overflow-y-auto bg-white p-7">
                <VersionHistoryActivityLog
                  version={selectedVersion}
                  createdBy={versionHistoryData.createdBy}
                />
              </div>
            </>
          ) : (
            <div className="flex min-h-full flex-1 items-center justify-center px-7 py-5">
              <div className="flex flex-col items-center gap-3">
                <p className="text-lg font-bold text-slate-900">
                  {t('common.error.title')}
                </p>
                <p className="text-sm text-slate-600">
                  {t('versionHistory.notifications.error.message')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
