import type {
  VacancyStatus,
  VacancyVersionHistoryChange,
  VacancyVersionHistoryData,
  VacancyVersionHistoryVersion,
  VersionHistoryEntry,
  VersionHistoryGridItem,
} from '@/views/vacancies/types';
import {
  DATE_DISPLAY_FORMAT,
  PDF_BOX_COLUMNS,
  PDF_BOX_GAP,
  PDF_CARD_PADDING,
  PDF_CARD_RADIUS,
  PDF_COLORS,
  PDF_CONTENT_PANEL_PADDING,
  PDF_ENTRY_GAP,
  PDF_FONT_BOLD,
  PDF_FONT_MEDIUM,
  PDF_FONT_REGULAR,
  PDF_FONT_SEMIBOLD,
  PDF_PAGE_MARGIN,
  PDF_PAGE_SIZE,
  PDF_SIDEBAR_AVATAR_DIAMETER,
  PDF_SIDEBAR_DATE_FORMAT,
  PDF_SIDEBAR_META_FONT_SIZE,
  PDF_SIDEBAR_ROW_PADDING_X,
  PDF_SIDEBAR_ROW_PADDING_Y,
  PDF_SIDEBAR_VERSION_FONT_SIZE,
  PDF_SIDEBAR_WIDTH_RATIO,
  PDF_STATUS_DISPLAY_LABELS,
  PDF_STATUS_PILL_COLORS,
  PDF_STATUS_PILL_FALLBACK_COLORS,
  PDF_SYSTEM_LABEL,
  PX_TO_PT,
  TIME_DISPLAY_FORMAT,
} from '@/views/vacancies/utils/constants';
import { formatChangeValue } from '@/views/vacancies/utils/format-date-range';
import {
  compareVersionNumbersDesc,
  formatVersionNumber,
  getSingleScalar,
  isDataTakenFromCandidateChange,
  isObjectArray,
  isSectionStatusChange,
  isSystemActor,
  normalizeStatusKey,
  parseBooleanFlag,
  pluralizeFieldName,
  resolveChangeVariant,
  resolveScalarChangeLabelKey,
  resolveVersionActor,
  resolveVersionEntries,
  shouldRenderAsGrid,
  toChipItems,
  toGridItems,
} from '@/views/vacancies/utils/version-history-helpers';

import regularFontUrl from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff?url';
import mediumFontUrl from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff?url';
import semiboldFontUrl from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff?url';
import boldFontUrl from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff?url';
import blobStream from 'blob-stream';
import { format } from 'date-fns';
import PDFDocument from 'pdfkit';

// This util renders directly into a binary PDF buffer, not JSX, so the ATS
// module's "no hardcoded strings, always useTranslation" convention (which
// targets user-facing JSX) doesn't extend to it — the PDF's static chrome
// text is plain English for v1 per versionHistoryDownloadPdfAsFigma.md
// (Open Question 3). Only the on-screen page's JSX goes through i18n. These
// mirror the `versionHistory.changeTypes.*` keys in ats.json one-for-one.
const PDF_LABELS = {
  sectionNamePrefix: 'Section Name - ',
  statusUpdated: 'Vacancy status transitioned from',
  titleChanged: 'Vacancy Title Changed',
  scheduleDateChanged: 'Scheduled Publish Date and Time Changed',
  expirationDateChanged: 'Expiration Date and Time Changed',
  verbs: {
    added: 'Added',
    removed: 'Removed',
    updated: 'Updated',
    created: 'Created',
  },
  // Only the verb above is accent-coloured; these details stay slate.
  manyItems: (count: number, field: string) => `New ${count} ${field}`,
  removedItemsDetail: (count: number, field: string) => `${count} ${field}`,
  activityLog: 'Activity Log',
  // Mirrors the on-screen empty state's copy exactly (versionHistory
  // .activityLog.emptyState.* in ats.json / Figma node 4229:229029) — kept
  // as a literal string rather than sourced from the i18n bundle since this
  // file's own static chrome text is plain English by design (see the
  // top-of-file comment); only the copy needs to match, not the mechanism.
  noActivityTitle: 'No Activity Available',
  noActivityDescription:
    'There are no activity logs recorded for this version yet. Any updates, edits, or actions related to this version will appear here once activities are performed.',
  // SECTION_ENABLED (Figma node 4229:229289) — mirrors the on-screen
  // versionHistory.changeTypes.section{Enabled,Disabled}* i18n keys exactly.
  sectionEnabled: 'Section Enabled',
  sectionDisabled: 'Section Disabled',
  sectionEnabledDescription:
    'Section was turned on — now visible to applicants',
  sectionDisabledDescription:
    'Section was turned off — no longer visible to applicants',
  // VACANCY_CREATED grouped card (Figma nodes 4229:230488/230451) — mirrors
  // the on-screen versionHistory.changeTypes.* keys exactly.
  vacancyCreated: 'Vacancy Created',
  scheduledForPublishing: 'Scheduled for publishing',
  savedAs: 'Saved as',
  createdBy: 'Created By',
  willGoLiveOn: (date: string) => `Will go Live on ${date}`,
  // "Data Taken From Candidate" (Figma node 6536:91081) — mirrors the
  // on-screen versionHistory.changeTypes.dataTakenFromCandidate* keys.
  dataTakenFromCandidateEnabled: '"No manual input required" Enabled',
  dataTakenFromCandidateDisabled: '"No manual input required" Disabled',
  dataTakenFromCandidateEnabledDescription:
    'Data will now be auto-populated from the candidate profile',
  dataTakenFromCandidateDisabledDescription:
    'Data will no longer be auto-populated from the candidate profile',
  breadcrumb: 'Version History',
} as const;

// pdfkit's standard-14 fonts (Helvetica etc.) load their AFM metrics via
// fs.readFileSync, which doesn't exist in a browser bundle — so all weights
// are fetched as real font bytes and registered directly, and `font: false`
// below skips pdfkit's own default-font init (which otherwise unconditionally
// tries to load "Helvetica" before we get a chance to register anything).
//
// WOFF (not WOFF2) specifically: pdfkit's WOFF2 subsetting path produced a
// corrupted glyf table when embedding this font in this Vite-bundled
// pipeline — the PDF had correct extractable text and correct vector shapes,
// but glyph outlines for real characters were empty/malformed (only the
// first couple of glyph slots, e.g. .notdef/space, decoded fine). Re-parsing
// the embedded subset font extracted straight from a generated PDF with a
// native fontkit build reproduced the corruption for WOFF2 and confirmed
// WOFF has none (see versionHistoryDownloadPdfAsFigma.md). WOFF1's simple
// per-table zlib inflate (tiny-inflate) has no analogous transform step to
// get wrong, unlike WOFF2's brotli decompression + bit-packed "transformed
// glyf table" reconstruction.
const fontBufferCache = new Map<string, Promise<ArrayBuffer>>();
const loadFontBuffer = (url: string): Promise<ArrayBuffer> => {
  let pending = fontBufferCache.get(url);
  if (!pending) {
    // A failed/404 response still resolves fetch() successfully — without
    // checking `.ok`, an error page's HTML bytes get handed to pdfkit as if
    // they were font data, which fails much later and far less clearly (a
    // bare "Unknown font format" thrown deep inside fontkit's format
    // sniffing, with no indication which of the 4 fonts or why). This is
    // the single most likely cause of that error surfacing in practice: a
    // stale build/deploy where the JS bundle references a font asset hash
    // that the server no longer has (a hard refresh + fresh rebuild is the
    // fix on the deployment side; this just makes the failure diagnosable
    // instead of cryptic).
    pending = fetch(url).then(response => {
      if (!response.ok) {
        throw new Error(
          `Failed to load PDF font "${url}": ${response.status} ${response.statusText}`
        );
      }
      return response.arrayBuffer();
    });
    // A rejected fetch must NOT stay cached — otherwise one transient
    // failure (or one stale-build 404) permanently breaks every subsequent
    // Download click for the rest of the page's lifetime, since the same
    // rejected promise would just be replayed forever instead of retried.
    pending.catch(() => fontBufferCache.delete(url));
    fontBufferCache.set(url, pending);
  }
  return pending;
};

type ValueBoxItem = VersionHistoryGridItem;

const statusPillColors = (status: string) => {
  const key = normalizeStatusKey(status);
  return (
    PDF_STATUS_PILL_COLORS[key as VacancyStatus] ??
    PDF_STATUS_PILL_FALLBACK_COLORS
  );
};

const statusDisplayLabel = (status: string) => {
  const key = normalizeStatusKey(status);
  return PDF_STATUS_DISPLAY_LABELS[key as VacancyStatus] ?? status;
};

const formatWith = (isoDate: string, pattern: string) => {
  const parsed = new Date(isoDate);
  return Number.isNaN(parsed.getTime()) ? isoDate : format(parsed, pattern);
};

// pdfkit's own `ellipsis: true` only applies inside its line-wrapping path,
// so combining it with `lineBreak: false` silently does nothing and a long
// value (an email in the narrow sidebar column) wraps onto a second line
// instead. Clipping the string up front is the reliable route. Three periods
// rather than "…" (U+2026): the embedded Plus Jakarta Sans latin subset is
// not guaranteed to carry that glyph, and a missing glyph renders as nothing.
const truncateToWidth = (
  doc: PDFKit.PDFDocument,
  text: string,
  maxWidth: number
): string => {
  if (doc.widthOfString(text) <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && doc.widthOfString(`${clipped}...`) > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  // Drop any trailing dot/space the cut landed on, so "…gmail." + "..." does
  // not read as four periods. A single-character test (not a `+$`-quantified
  // character class) avoids any regex backtracking risk on the loop below.
  while (clipped.length > 0 && /[.\s]/.test(clipped.at(-1) ?? '')) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}...`;
};

const formatPdfDate = (isoDate: string) =>
  formatWith(isoDate, DATE_DISPLAY_FORMAT);
const formatPdfTime = (isoDate: string) =>
  formatWith(isoDate, TIME_DISPLAY_FORMAT);
const formatPdfVersionListDate = (isoDate: string) =>
  formatWith(isoDate, PDF_SIDEBAR_DATE_FORMAT).toUpperCase();

// ---------------------------------------------------------------------------
// Layout metrics — every value below is the on-screen component's own
// Tailwind px value times PX_TO_PT (0.75, the exact CSS-px-to-PDF-pt
// conversion), so the PDF carries the SAME relative proportions as the page
// instead of an independently hand-tuned scale (which is how earlier rounds
// of this file drifted from matching it). The web class each mirrors is
// noted so a page change has an obvious PDF counterpart to update.
// ---------------------------------------------------------------------------
const SUMMARY_FONT_SIZE = 14 * PX_TO_PT; // change-summary: text-sm
const DIFF_LABEL_FONT_SIZE = 14 * PX_TO_PT; // InlineDiffRow label: text-sm
const DIFF_VALUE_FONT_SIZE = 16 * PX_TO_PT; // InlineDiffRow value: text-base
const BOX_TITLE_FONT_SIZE = 16 * PX_TO_PT; // value-box-grid title: text-base
const BOX_SUBTITLE_FONT_SIZE = 14 * PX_TO_PT; // value-box-grid subtitle: text-sm
const CHIP_FONT_SIZE = 14 * PX_TO_PT; // chip-list: text-sm
const PILL_FONT_SIZE = 12 * PX_TO_PT; // status-pill: text-xs
// gap-4 (MultiValueChange: summary -> box grid/chips) vs gap-3 (ScalarChange
// and CreatedChange: summary -> diff/value) — two different web gaps, not
// one reused constant.
const SUMMARY_TO_MULTI_GAP = 16 * PX_TO_PT;
const SUMMARY_TO_SCALAR_GAP = 12 * PX_TO_PT;
const INLINE_GAP = 12 * PX_TO_PT; // InlineDiffRow / change-summary: gap-3
const ARROW_SIZE = 16 * PX_TO_PT; // lucide ArrowRight: size-4
const AVATAR_DIAMETER = 52 * PX_TO_PT; // change-entry avatar: size-13
const PILL_HEIGHT = 20 * PX_TO_PT; // text-xs line-height(16) + py-0.5*2(4)
const CHIP_HEIGHT = 36 * PX_TO_PT; // text-sm line-height(20) + py-2*2(16)
const CHIP_PADDING_X = 12 * PX_TO_PT; // chip-list: px-3
const CHIP_GAP = 8 * PX_TO_PT; // chip-list: gap-2
const CHIP_RADIUS = 6 * PX_TO_PT; // chip-list: rounded-md
const PILL_PADDING_X = 8 * PX_TO_PT; // status-pill: px-2
const PILL_RADIUS = 6 * PX_TO_PT; // status-pill: rounded-md
const BOX_PADDING = 28 * PX_TO_PT; // value-box-grid box: p-7
const BOX_SUBTITLE_GAP = 4 * PX_TO_PT; // value-box-grid: mt-1
const SCALAR_DIFF_GAP = 20 * PX_TO_PT; // scalar-diff: gap-5 (each side of the arrow)
// Figma/the page leave gap-3 (12px) between a sidebar row's version-number
// line and its actor line.
const SIDEBAR_ROW_TEXT_GAP = 16 * PX_TO_PT; // sidebar row: gap-4
// Between the attribution row (avatar+name+date/time) and the card below it.
const ATTRIBUTION_CARD_GAP = 12 * PX_TO_PT; // change-entry: gap-3
const AVATAR_NAME_GAP = 12 * PX_TO_PT; // change-entry: gap-3
const NAME_FONT_SIZE = 16 * PX_TO_PT; // change-entry name: text-base
const DATETIME_FONT_SIZE = 16 * PX_TO_PT; // change-entry date/time: text-base
const NAME_DATETIME_GAP = 4 * PX_TO_PT; // change-entry name -> date/time: gap-1
const DATETIME_GAP = 8 * PX_TO_PT; // change-entry date-dot-time row: gap-2
const DOT_DIAMETER = 6 * PX_TO_PT; // change-entry separator dot: size-1.5
const SIDEBAR_AVATAR_TEXT_GAP = 8 * PX_TO_PT; // sidebar row: gap-2
const DIVIDER_HEIGHT = 16 * PX_TO_PT; // change-summary rule: h-4

// Header (page.tsx): breadcrumb Fonts/h6 (Bold 24px), title Fonts/h4
// (Bold 36px), meta row text-base (16px) with 20px icons.
const BREADCRUMB_FONT_SIZE = 24 * PX_TO_PT;
const TITLE_FONT_SIZE = 36 * PX_TO_PT;
const TITLE_GAP = 28 * PX_TO_PT; // title: mt-7
const META_GAP = 16 * PX_TO_PT; // meta row: mt-4
const META_FONT_SIZE = 16 * PX_TO_PT;
const META_ICON_SIZE = 20 * PX_TO_PT;
const META_ICON_TEXT_GAP = 4 * PX_TO_PT; // meta segment: gap-1
const META_SEGMENT_GAP_X = 12 * PX_TO_PT; // meta row: gap-x-3
const META_SEGMENT_GAP_Y = 8 * PX_TO_PT; // meta row: gap-y-2 (wrapped rows)
const HEADER_PADDING = 28 * PX_TO_PT; // header: px-7 py-7
const ACTIVITY_HEADING_FONT_SIZE = 24 * PX_TO_PT; // Activity Log: text-2xl

// Empty state (TemplateEmptyStateMessage, reused on-screen for "No Activity
// Available"): title text-4xl/10, description text-lg/6, gap-2 between them.
const EMPTY_STATE_TITLE_FONT_SIZE = 36 * PX_TO_PT;
const EMPTY_STATE_DESCRIPTION_FONT_SIZE = 18 * PX_TO_PT;
const EMPTY_STATE_TITLE_GAP = 8 * PX_TO_PT;

// SECTION_ENABLED (node 4229:229289): label text-base, description text-sm,
// gap-1 between them. Toggle track/knob dimensions mirror the web's ui-kit
// Switch `size="lg"` (48×24px track, 20px knob) rather than Figma's slightly
// taller 28px-tall instance of the same reusable Toggle component, so the
// PDF matches what the page actually renders (see
// version-history-toggle-switch.tsx) instead of Figma's own component pixel-
// for-pixel. The knob inset (both on/off) mirrors the ui-kit Switch's own
// 2px track padding.
const SECTION_TOGGLE_LABEL_FONT_SIZE = 16 * PX_TO_PT;
const SECTION_TOGGLE_DESCRIPTION_FONT_SIZE = 14 * PX_TO_PT;
const SECTION_TOGGLE_GAP = 4 * PX_TO_PT;
const TOGGLE_WIDTH = 48 * PX_TO_PT;
const TOGGLE_HEIGHT = 24 * PX_TO_PT;
const TOGGLE_KNOB_DIAMETER = 20 * PX_TO_PT;
const TOGGLE_KNOB_INSET = 2 * PX_TO_PT;

// "Data Taken From Candidate" checkbox (node 6536:91081): reuses
// SECTION_TOGGLE_LABEL_FONT_SIZE/SECTION_TOGGLE_DESCRIPTION_FONT_SIZE/
// SECTION_TOGGLE_GAP above (the identical header/description text pattern,
// just with a checkbox instead of a toggle switch on the right) — only the
// checkbox's own size needs new constants.
const CHECKBOX_SIZE = 28 * PX_TO_PT;
const CHECKBOX_RADIUS = 6 * PX_TO_PT;
const CHECKMARK_SIZE = 16 * PX_TO_PT; // lucide Check icon (web): size-4

// VACANCY_CREATED grouped card (nodes 4229:230488/230451): the header text
// reuses SUMMARY_FONT_SIZE (same 14px-bold role as every other header line's
// "Section Name -" prefix) and the box reuses BOX_PADDING/BOX_TITLE_FONT_SIZE
// /PDF_CARD_RADIUS (the same bordered-box pattern every other value box
// uses) — only the "Created By [avatar] {name} • Will go Live on {date}"
// meta row below the title needs its own sizing.
const VACANCY_CREATION_META_FONT_SIZE = 14 * PX_TO_PT; // text-sm
const VACANCY_CREATION_AVATAR_DIAMETER = 20 * PX_TO_PT; // size-5
const VACANCY_CREATION_META_GAP = 8 * PX_TO_PT; // gap-2
const VACANCY_CREATION_TITLE_GAP = 4 * PX_TO_PT; // gap-1 (title -> meta row)

/**
 * Everything below draws at an explicit (x, y) and returns the height it
 * consumed, rather than relying on pdfkit's flowing `doc.y`. `dry: true`
 * measures without emitting any draw operations, which is what lets each
 * entry's card background be sized before its content is painted on top —
 * pdfkit has no z-order, so a background filled afterwards would cover the
 * text. Using one dry-run-capable renderer per change type (instead of a
 * separate measure function mirroring each draw branch) means the measured
 * height cannot drift from what is actually drawn.
 */
type ContentCtx = {
  doc: PDFKit.PDFDocument;
  x: number;
  width: number;
  dry: boolean;
};

// lucide's ArrowRight (used on-screen) is a stroked shaft + open chevron
// head, not a filled triangle — matched here as two strokes rather than a
// closed/filled path so the PDF's arrow reads as the same icon, not an
// approximation of it.
const renderArrow = (
  doc: PDFKit.PDFDocument,
  x: number,
  centerY: number,
  size: number
) => {
  const headSize = size * 0.4;
  doc
    .moveTo(x, centerY)
    .lineTo(x + size, centerY)
    .lineWidth(1.4)
    .lineCap('round')
    .strokeColor(PDF_COLORS.arrow)
    .stroke();
  doc
    .moveTo(x + size - headSize, centerY - headSize)
    .lineTo(x + size, centerY)
    .lineTo(x + size - headSize, centerY + headSize)
    .lineWidth(1.4)
    .lineCap('round')
    .lineJoin('round')
    .strokeColor(PDF_COLORS.arrow)
    .stroke();
};

const renderStatusPill = (
  ctx: ContentCtx,
  x: number,
  y: number,
  label: string,
  colors: {
    bg: string;
    border: string;
    text: string;
    bgOpacity?: number;
    borderOpacity?: number;
  }
): number => {
  const { doc } = ctx;
  doc.font(PDF_FONT_SEMIBOLD).fontSize(PILL_FONT_SIZE);
  const width = doc.widthOfString(label) + PILL_PADDING_X * 2;
  if (ctx.dry) return width;

  // Explicitly set on every draw (not just when a status defines one) so a
  // translucent "expired" pill drawn earlier can never leak its opacity into
  // the next, fully-opaque status pill.
  doc
    .fillOpacity(colors.bgOpacity ?? 1)
    .strokeOpacity(colors.borderOpacity ?? 1);
  doc
    .roundedRect(x, y, width, PILL_HEIGHT, PILL_RADIUS)
    .lineWidth(1)
    .fillAndStroke(colors.bg, colors.border);
  doc.fillOpacity(1).strokeOpacity(1);
  const textHeight = doc.currentLineHeight(true);
  doc
    .fillColor(colors.text)
    .text(label, x + PILL_PADDING_X, y + (PILL_HEIGHT - textHeight) / 2, {
      lineBreak: false,
    });
  return width;
};

// Mirrors the web's ui-kit Switch (`size="lg"`) rather than Figma's own
// slightly-taller 28px instance of the same Toggle component — see the
// SECTION_TOGGLE_* constants' comment.
const renderToggleSwitch = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  isOn: boolean
) => {
  doc
    .roundedRect(x, y, TOGGLE_WIDTH, TOGGLE_HEIGHT, TOGGLE_HEIGHT / 2)
    .fillColor(isOn ? PDF_COLORS.toggleOnBg : PDF_COLORS.toggleOffBg)
    .fill();
  const knobX = isOn
    ? x + TOGGLE_WIDTH - TOGGLE_KNOB_INSET - TOGGLE_KNOB_DIAMETER
    : x + TOGGLE_KNOB_INSET;
  const knobY = y + (TOGGLE_HEIGHT - TOGGLE_KNOB_DIAMETER) / 2;
  doc
    .circle(
      knobX + TOGGLE_KNOB_DIAMETER / 2,
      knobY + TOGGLE_KNOB_DIAMETER / 2,
      TOGGLE_KNOB_DIAMETER / 2
    )
    .fillColor('#ffffff')
    .fill();
};

/**
 * A section's enabled/disabled toggle (Figma nodes 4229:229289 "Section
 * Enabled" / 10122:134392 "Section Disabled"): "Section Enabled/Disabled -
 * {sectionName}" (verb-first, no "Section Name -" prefix or divider rule — a
 * different header shape from every other change type), a description line,
 * and the toggle switch itself right-aligned against the card's own width.
 * `newValue` carries the flag as the literal string "true"/"false"
 * (confirmed from a real API response); `fieldName` is always "Section
 * Status" and carries no display value of its own. Detected by fieldName,
 * not changeType — see isSectionStatusChange's own comment.
 */
const renderSectionToggleChange = (
  ctx: ContentCtx,
  change: VacancyVersionHistoryChange,
  y: number
): number => {
  const { doc } = ctx;
  const isEnabled = parseBooleanFlag(getSingleScalar(change.newValue));
  const label = isEnabled
    ? PDF_LABELS.sectionEnabled
    : PDF_LABELS.sectionDisabled;
  const description = isEnabled
    ? PDF_LABELS.sectionEnabledDescription
    : PDF_LABELS.sectionDisabledDescription;
  // The label reads green in both states (Figma nodes 4229:229289 "Enabled"
  // and 10122:134392 "Disabled" both use #047857/`added`) — only the toggle
  // switch itself changes color with isEnabled.
  const labelColor = PDF_COLORS.added;
  const sectionSuffix = ` - ${change.sectionName}`;
  const textWidth = ctx.width - TOGGLE_WIDTH - INLINE_GAP;

  doc.font(PDF_FONT_BOLD).fontSize(SECTION_TOGGLE_LABEL_FONT_SIZE);
  const labelWidth = doc.widthOfString(label);
  const labelLineHeight = doc.currentLineHeight(true);

  doc.font(PDF_FONT_MEDIUM).fontSize(SECTION_TOGGLE_DESCRIPTION_FONT_SIZE);
  const descriptionHeight = doc.heightOfString(description, {
    width: textWidth,
  });

  const textBlockHeight =
    labelLineHeight + SECTION_TOGGLE_GAP + descriptionHeight;
  const blockHeight = Math.max(textBlockHeight, TOGGLE_HEIGHT);

  if (!ctx.dry) {
    doc
      .font(PDF_FONT_BOLD)
      .fontSize(SECTION_TOGGLE_LABEL_FONT_SIZE)
      .fillColor(labelColor)
      .text(label, ctx.x, y, { lineBreak: false });
    doc
      .font(PDF_FONT_BOLD)
      .fillColor(PDF_COLORS.body)
      .text(sectionSuffix, ctx.x + labelWidth, y, { lineBreak: false });

    doc
      .font(PDF_FONT_MEDIUM)
      .fontSize(SECTION_TOGGLE_DESCRIPTION_FONT_SIZE)
      .fillColor(PDF_COLORS.muted)
      .text(description, ctx.x, y + labelLineHeight + SECTION_TOGGLE_GAP, {
        width: textWidth,
      });

    renderToggleSwitch(
      doc,
      ctx.x + ctx.width - TOGGLE_WIDTH,
      y + (blockHeight - TOGGLE_HEIGHT) / 2,
      isEnabled
    );
  }

  return blockHeight;
};

// A simple checkmark polyline (top-left + size, matching this file's
// renderPersonIcon/renderMonitorIcon convention) — mirrors lucide's Check
// icon (used on-screen) closely enough at this size: a short leg down-left
// then a longer leg up-right.
const renderCheckmark = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  doc
    .moveTo(x + size * 0.18, y + size * 0.52)
    .lineTo(x + size * 0.42, y + size * 0.75)
    .lineTo(x + size * 0.82, y + size * 0.25)
    .lineWidth(size * 0.14)
    .lineCap('round')
    .lineJoin('round')
    .strokeColor(color)
    .stroke();
};

// "Data Taken From Candidate" checkbox (node 6536:91081 for "checked"; no
// Figma reference exists for "unchecked" — an empty bordered box is the
// standard unchecked-checkbox convention, used here as a clearly-inferred
// default).
const renderCheckboxIndicator = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  isChecked: boolean
) => {
  doc
    .roundedRect(x, y, CHECKBOX_SIZE, CHECKBOX_SIZE, CHECKBOX_RADIUS)
    .lineWidth(1)
    .fillAndStroke(
      isChecked ? PDF_COLORS.checkboxCheckedBg : '#ffffff',
      isChecked
        ? PDF_COLORS.checkboxCheckedBg
        : PDF_COLORS.checkboxUncheckedBorder
    );
  if (isChecked) {
    const inset = (CHECKBOX_SIZE - CHECKMARK_SIZE) / 2;
    renderCheckmark(doc, x + inset, y + inset, CHECKMARK_SIZE, '#ffffff');
  }
};

/**
 * "Data Taken From Candidate" (Figma node 6536:91081): "'No manual input
 * required' Enabled/Disabled - {sectionName}" header, description, and a
 * checkbox indicator right-aligned — the same shape as
 * renderSectionToggleChange above but with a checkbox instead of a toggle
 * switch, and detected by fieldName rather than changeType since this
 * arrives as a plain FIELD_VALUE_UPDATED (confirmed from a real API
 * response), not its own dedicated changeType.
 */
const renderDataTakenFromCandidateChange = (
  ctx: ContentCtx,
  change: VacancyVersionHistoryChange,
  y: number
): number => {
  const { doc } = ctx;
  const isEnabled = parseBooleanFlag(getSingleScalar(change.newValue));
  const label = isEnabled
    ? PDF_LABELS.dataTakenFromCandidateEnabled
    : PDF_LABELS.dataTakenFromCandidateDisabled;
  const description = isEnabled
    ? PDF_LABELS.dataTakenFromCandidateEnabledDescription
    : PDF_LABELS.dataTakenFromCandidateDisabledDescription;
  const labelColor = isEnabled ? PDF_COLORS.added : PDF_COLORS.muted;
  const sectionSuffix = ` - ${change.sectionName}`;
  const textWidth = ctx.width - CHECKBOX_SIZE - INLINE_GAP;

  doc.font(PDF_FONT_BOLD).fontSize(SECTION_TOGGLE_LABEL_FONT_SIZE);
  const labelWidth = doc.widthOfString(label);
  const labelLineHeight = doc.currentLineHeight(true);

  doc.font(PDF_FONT_MEDIUM).fontSize(SECTION_TOGGLE_DESCRIPTION_FONT_SIZE);
  const descriptionHeight = doc.heightOfString(description, {
    width: textWidth,
  });

  const textBlockHeight =
    labelLineHeight + SECTION_TOGGLE_GAP + descriptionHeight;
  const blockHeight = Math.max(textBlockHeight, CHECKBOX_SIZE);

  if (!ctx.dry) {
    doc
      .font(PDF_FONT_BOLD)
      .fontSize(SECTION_TOGGLE_LABEL_FONT_SIZE)
      .fillColor(labelColor)
      .text(label, ctx.x, y, { lineBreak: false });
    doc
      .font(PDF_FONT_BOLD)
      .fillColor(PDF_COLORS.body)
      .text(sectionSuffix, ctx.x + labelWidth, y, { lineBreak: false });

    doc
      .font(PDF_FONT_MEDIUM)
      .fontSize(SECTION_TOGGLE_DESCRIPTION_FONT_SIZE)
      .fillColor(PDF_COLORS.muted)
      .text(description, ctx.x, y + labelLineHeight + SECTION_TOGGLE_GAP, {
        width: textWidth,
      });

    renderCheckboxIndicator(
      doc,
      ctx.x + ctx.width - CHECKBOX_SIZE,
      y + (blockHeight - CHECKBOX_SIZE) / 2,
      isEnabled
    );
  }

  return blockHeight;
};

/**
 * "Section Name - Secondary Education │ Added New 2 Schools" — a muted
 * section label, a hairline vertical rule, then the accent-colored summary
 * (Figma node 4229:229322). Falls onto a second line when the pair is too
 * wide for the column.
 */
const renderSummaryLine = (
  ctx: ContentCtx,
  y: number,
  sectionName: string,
  verb: string,
  detail: string,
  accentColor: string
): number => {
  const { doc } = ctx;
  const detailText = detail ? ` ${detail}` : '';

  doc.font(PDF_FONT_SEMIBOLD).fontSize(SUMMARY_FONT_SIZE);
  const prefixWidth = doc.widthOfString(PDF_LABELS.sectionNamePrefix);
  const lineHeight = doc.currentLineHeight(true);
  doc.font(PDF_FONT_BOLD).fontSize(SUMMARY_FONT_SIZE);
  const sectionWidth = doc.widthOfString(sectionName);
  const verbWidth = doc.widthOfString(verb);
  const detailWidth = doc.widthOfString(detailText);

  const labelWidth = prefixWidth + sectionWidth;
  const summaryWidth = verbWidth + detailWidth;
  const fitsOneLine =
    labelWidth + INLINE_GAP * 2 + 1 + summaryWidth <= ctx.width;

  if (ctx.dry) return fitsOneLine ? lineHeight : lineHeight * 2 + 2;

  // Figma mixes weights and colours within this one line (node 4229:229322):
  // a semibold "Section Name - " prefix, the section itself bold, and only
  // the summary's VERB in the accent colour — its detail stays slate.
  doc
    .font(PDF_FONT_SEMIBOLD)
    .fontSize(SUMMARY_FONT_SIZE)
    .fillColor(PDF_COLORS.body)
    .text(PDF_LABELS.sectionNamePrefix, ctx.x, y, { lineBreak: false });
  doc
    .font(PDF_FONT_BOLD)
    .fillColor(PDF_COLORS.body)
    .text(sectionName, ctx.x + prefixWidth, y, { lineBreak: false });

  const summaryY = fitsOneLine ? y : y + lineHeight + 2;
  let summaryX = ctx.x;

  if (fitsOneLine) {
    const dividerX = ctx.x + labelWidth + INLINE_GAP;
    const dividerY = y + (lineHeight - DIVIDER_HEIGHT) / 2;
    doc
      .moveTo(dividerX, dividerY)
      .lineTo(dividerX, dividerY + DIVIDER_HEIGHT)
      .lineWidth(1)
      .strokeColor(PDF_COLORS.border)
      .stroke();
    summaryX = dividerX + INLINE_GAP;
  }

  doc
    .font(PDF_FONT_BOLD)
    .fillColor(accentColor)
    .text(verb, summaryX, summaryY, { lineBreak: false });
  if (detailText) {
    doc
      .font(PDF_FONT_BOLD)
      .fillColor(PDF_COLORS.body)
      .text(detailText, summaryX + verbWidth, summaryY, { lineBreak: false });
  }

  return fitsOneLine ? lineHeight : lineHeight * 2 + 2;
};

type InlineValue =
  | { kind: 'text'; text: string; strike?: boolean; color?: string }
  | { kind: 'status'; status: string };

const measureInlineValue = (ctx: ContentCtx, value: InlineValue): number => {
  const { doc } = ctx;
  if (value.kind === 'status') {
    const label = statusDisplayLabel(value.status);
    doc.font(PDF_FONT_SEMIBOLD).fontSize(PILL_FONT_SIZE);
    return doc.widthOfString(label) + PILL_PADDING_X * 2;
  }
  doc.font(PDF_FONT_SEMIBOLD).fontSize(DIFF_VALUE_FONT_SIZE);
  return doc.widthOfString(value.text);
};

const drawInlineValue = (
  ctx: ContentCtx,
  x: number,
  rowTop: number,
  rowHeight: number,
  value: InlineValue
): number => {
  const { doc } = ctx;
  if (value.kind === 'status') {
    const label = statusDisplayLabel(value.status);
    return renderStatusPill(
      ctx,
      x,
      rowTop + (rowHeight - PILL_HEIGHT) / 2,
      label,
      statusPillColors(value.status)
    );
  }
  doc.font(PDF_FONT_SEMIBOLD).fontSize(DIFF_VALUE_FONT_SIZE);
  const width = doc.widthOfString(value.text);
  const textHeight = doc.currentLineHeight(true);
  const textY = rowTop + (rowHeight - textHeight) / 2;
  doc
    .fillColor(value.color ?? PDF_COLORS.heading)
    .text(value.text, x, textY, { lineBreak: false });

  // The strikethrough is drawn as a vector rule rather than via pdfkit's
  // `strike: true` text option: that option derives the rule's extent from
  // the layout width, which is undefined for a `lineBreak: false` fragment,
  // so pdfkit ends up calling lineTo(NaN) and throws "unsupported number".
  if (value.strike) {
    const ruleY = textY + textHeight * 0.45;
    doc
      .moveTo(x, ruleY)
      .lineTo(x + width, ruleY)
      .lineWidth(0.8)
      .strokeColor(PDF_COLORS.heading)
      .stroke();
  }
  return width;
};

/**
 * A single-line "label   before → after" row, as Figma draws status, title
 * and schedule-date changes (nodes 4229:229249 / 4229:229270 / 4229:229398).
 * The label drops to its own line when the whole row won't fit the column.
 */
const renderInlineDiff = (
  ctx: ContentCtx,
  y: number,
  label: string,
  before: InlineValue,
  after: InlineValue
): number => {
  const { doc } = ctx;
  doc.font(PDF_FONT_SEMIBOLD).fontSize(DIFF_LABEL_FONT_SIZE);
  // An empty label means the caller already drew its own header line above
  // (the generic "Section Name - X │ Updated…" case), so it contributes no
  // width, no gap and no line of its own.
  const labelWidth = label ? doc.widthOfString(label) : 0;
  const labelGap = label ? INLINE_GAP : 0;
  const labelHeight = doc.currentLineHeight(true);

  const beforeWidth = measureInlineValue(ctx, before);
  const afterWidth = measureInlineValue(ctx, after);
  const valuesWidth =
    beforeWidth + INLINE_GAP + ARROW_SIZE + INLINE_GAP + afterWidth;
  const hasPill = before.kind === 'status' || after.kind === 'status';
  const valuesHeight = hasPill
    ? PILL_HEIGHT
    : Math.max(labelHeight, DIFF_VALUE_FONT_SIZE * 1.35);

  const fitsOneLine = labelWidth + labelGap + valuesWidth <= ctx.width;
  const labelHeightOrZero = label ? labelHeight : 0;
  // flex-wrap's `gap-3` applies the SAME gap value on both axes, so the row
  // falling onto its own line uses INLINE_GAP as the vertical gap too, not a
  // separately-tuned constant.
  const height =
    fitsOneLine || !label
      ? Math.max(labelHeightOrZero, valuesHeight)
      : labelHeight + INLINE_GAP + valuesHeight;
  const stacked = Boolean(label) && !fitsOneLine;

  if (ctx.dry) return height;

  if (label) {
    const labelY = stacked ? y : y + (height - labelHeight) / 2;
    doc
      .font(PDF_FONT_SEMIBOLD)
      .fontSize(DIFF_LABEL_FONT_SIZE)
      .fillColor(PDF_COLORS.body)
      .text(label, ctx.x, labelY, { lineBreak: false });
  }

  const rowTop = stacked ? y + labelHeight + INLINE_GAP : y;
  const rowHeight = valuesHeight;
  let cursorX = stacked ? ctx.x : ctx.x + labelWidth + labelGap;

  cursorX += drawInlineValue(ctx, cursorX, rowTop, rowHeight, before);
  cursorX += INLINE_GAP;
  renderArrow(doc, cursorX, rowTop + rowHeight / 2, ARROW_SIZE);
  cursorX += ARROW_SIZE + INLINE_GAP;
  drawInlineValue(ctx, cursorX, rowTop, rowHeight, after);

  return height;
};

const measureValueBoxHeight = (
  ctx: ContentCtx,
  width: number,
  item: ValueBoxItem
): number => {
  const { doc } = ctx;
  doc.font(PDF_FONT_BOLD).fontSize(BOX_TITLE_FONT_SIZE);
  let height =
    BOX_PADDING * 2 +
    doc.heightOfString(item.title, { width: width - BOX_PADDING * 2 });
  if (item.subtitle) {
    // value-box-grid's subtitle is font-medium, not font-semibold.
    doc.font(PDF_FONT_MEDIUM).fontSize(BOX_SUBTITLE_FONT_SIZE);
    height +=
      BOX_SUBTITLE_GAP +
      doc.heightOfString(item.subtitle, { width: width - BOX_PADDING * 2 });
  }
  return height;
};

const renderBoxGrid = (
  ctx: ContentCtx,
  y: number,
  items: ValueBoxItem[],
  borderColor: string,
  titleColor: string
): number => {
  const { doc } = ctx;
  const boxWidth =
    (ctx.width - PDF_BOX_GAP * (PDF_BOX_COLUMNS - 1)) / PDF_BOX_COLUMNS;
  let cursorY = y;

  for (let i = 0; i < items.length; i += PDF_BOX_COLUMNS) {
    const row = items.slice(i, i + PDF_BOX_COLUMNS);
    const rowHeight = Math.max(
      ...row.map(item => measureValueBoxHeight(ctx, boxWidth, item))
    );

    if (!ctx.dry) {
      row.forEach((item, col) => {
        const boxX = ctx.x + col * (boxWidth + PDF_BOX_GAP);
        doc
          .roundedRect(boxX, cursorY, boxWidth, rowHeight, PDF_CARD_RADIUS)
          .lineWidth(1)
          .fillAndStroke('#ffffff', borderColor);
        doc
          .font(PDF_FONT_BOLD)
          .fontSize(BOX_TITLE_FONT_SIZE)
          .fillColor(titleColor)
          .text(item.title, boxX + BOX_PADDING, cursorY + BOX_PADDING, {
            width: boxWidth - BOX_PADDING * 2,
          });
        if (item.subtitle) {
          doc.font(PDF_FONT_BOLD).fontSize(BOX_TITLE_FONT_SIZE);
          const titleHeight = doc.heightOfString(item.title, {
            width: boxWidth - BOX_PADDING * 2,
          });
          doc
            .font(PDF_FONT_MEDIUM)
            .fontSize(BOX_SUBTITLE_FONT_SIZE)
            .fillColor(PDF_COLORS.muted)
            .text(
              item.subtitle,
              boxX + BOX_PADDING,
              cursorY + BOX_PADDING + titleHeight + BOX_SUBTITLE_GAP,
              { width: boxWidth - BOX_PADDING * 2 }
            );
        }
      });
    }

    cursorY += rowHeight;
    if (i + PDF_BOX_COLUMNS < items.length) cursorY += PDF_BOX_GAP;
  }

  return cursorY - y;
};

const measureScalarDiffBox = (
  ctx: ContentCtx,
  width: number,
  value: string,
  caption: string
): number => {
  const { doc } = ctx;
  doc.font(PDF_FONT_BOLD).fontSize(BOX_TITLE_FONT_SIZE);
  const titleHeight = doc.heightOfString(value, {
    width: width - BOX_PADDING * 2,
  });
  doc.font(PDF_FONT_MEDIUM).fontSize(BOX_SUBTITLE_FONT_SIZE);
  const captionHeight = doc.heightOfString(caption, {
    width: width - BOX_PADDING * 2,
  });
  return BOX_PADDING * 2 + titleHeight + BOX_SUBTITLE_GAP + captionHeight;
};

/**
 * Two side-by-side boxes holding a field's previous and updated values,
 * joined by an arrow — Figma's "Question Text Updated" / "Option Value
 * Updated" pattern (node 4229:229804). Used for generic field-value updates;
 * short vacancy-level fields (status, title, schedule/expiration dates) keep
 * the compact renderInlineDiff instead (see resolveScalarChangeLabelKey).
 */
const renderScalarDiffBoxes = (
  ctx: ContentCtx,
  y: number,
  field: string,
  before: string,
  after: string
): number => {
  const { doc } = ctx;
  const boxWidth = (ctx.width - SCALAR_DIFF_GAP * 2 - ARROW_SIZE) / 2;
  const previousCaption = `Previous ${field}`;
  const updatedCaption = `Updated ${field}`;

  const height = Math.max(
    measureScalarDiffBox(ctx, boxWidth, before, previousCaption),
    measureScalarDiffBox(ctx, boxWidth, after, updatedCaption)
  );

  if (ctx.dry) return height;

  const drawBox = (
    boxX: number,
    value: string,
    caption: string,
    borderColor: string,
    titleColor: string
  ) => {
    doc
      .roundedRect(boxX, y, boxWidth, height, PDF_CARD_RADIUS)
      .lineWidth(1)
      .fillAndStroke('#ffffff', borderColor);
    doc
      .font(PDF_FONT_BOLD)
      .fontSize(BOX_TITLE_FONT_SIZE)
      .fillColor(titleColor)
      .text(value, boxX + BOX_PADDING, y + BOX_PADDING, {
        width: boxWidth - BOX_PADDING * 2,
      });
    const titleHeight = doc.heightOfString(value, {
      width: boxWidth - BOX_PADDING * 2,
    });
    doc
      .font(PDF_FONT_MEDIUM)
      .fontSize(BOX_SUBTITLE_FONT_SIZE)
      .fillColor(PDF_COLORS.muted)
      .text(
        caption,
        boxX + BOX_PADDING,
        y + BOX_PADDING + titleHeight + BOX_SUBTITLE_GAP,
        { width: boxWidth - BOX_PADDING * 2 }
      );
  };

  drawBox(
    ctx.x,
    before,
    previousCaption,
    PDF_COLORS.scalarDiffPreviousBorder,
    PDF_COLORS.heading
  );
  drawBox(
    ctx.x + boxWidth + SCALAR_DIFF_GAP + ARROW_SIZE + SCALAR_DIFF_GAP,
    after,
    updatedCaption,
    PDF_COLORS.gridAccentBorder,
    PDF_COLORS.added
  );
  renderArrow(
    doc,
    ctx.x + boxWidth + SCALAR_DIFF_GAP,
    y + height / 2,
    ARROW_SIZE
  );

  return height;
};

/**
 * Plain multi-select values as chips — Figma's "Skills Chip" (node
 * 6537:91161): a slate fill with muted text, wrapping across lines.
 */
const renderChips = (ctx: ContentCtx, y: number, items: string[]): number => {
  const { doc } = ctx;
  let cursorX = ctx.x;
  let cursorY = y;

  // chip-list text is font-medium, not font-semibold.
  doc.font(PDF_FONT_MEDIUM).fontSize(CHIP_FONT_SIZE);
  const textHeight = doc.currentLineHeight(true);
  items.forEach(item => {
    const chipWidth = doc.widthOfString(item) + CHIP_PADDING_X * 2;
    if (cursorX > ctx.x && cursorX + chipWidth > ctx.x + ctx.width) {
      cursorX = ctx.x;
      cursorY += CHIP_HEIGHT + CHIP_GAP;
    }
    if (!ctx.dry) {
      doc
        .roundedRect(cursorX, cursorY, chipWidth, CHIP_HEIGHT, CHIP_RADIUS)
        .fill(PDF_COLORS.chipBackground);
      doc
        .font(PDF_FONT_MEDIUM)
        .fontSize(CHIP_FONT_SIZE)
        .fillColor(PDF_COLORS.chipText)
        .text(
          item,
          cursorX + CHIP_PADDING_X,
          cursorY + (CHIP_HEIGHT - textHeight) / 2,
          { lineBreak: false }
        );
    }
    cursorX += chipWidth + CHIP_GAP;
  });

  return cursorY + CHIP_HEIGHT - y;
};

const renderPlainValue = (
  ctx: ContentCtx,
  y: number,
  text: string,
  color: string
): number => {
  const { doc } = ctx;
  doc.font(PDF_FONT_SEMIBOLD).fontSize(DIFF_VALUE_FONT_SIZE);
  const height = doc.heightOfString(text, { width: ctx.width });
  // The measured height is returned either way (dry or drawn) — that's the
  // whole point of the measure-then-draw contract this file uses throughout
  // (see the ContentCtx doc comment above): a dry pass and the real draw
  // pass must never be able to disagree about how much space something
  // takes, so both must return the identical value.
  if (!ctx.dry) {
    doc.fillColor(color).text(text, ctx.x, y, { width: ctx.width });
  }
  return height;
};

type ChangeVariant = 'added' | 'removed' | 'updated';

const summaryVerbFor = (variant: ChangeVariant): string => {
  if (variant === 'added') return PDF_LABELS.verbs.added;
  if (variant === 'removed') return PDF_LABELS.verbs.removed;
  return PDF_LABELS.verbs.updated;
};

const summaryDetailFor = (
  fieldName: string,
  count: number,
  variant: ChangeVariant
): string => {
  const field = pluralizeFieldName(fieldName, count);
  return variant === 'removed'
    ? PDF_LABELS.removedItemsDetail(count, field)
    : PDF_LABELS.manyItems(count, field);
};

/** The initial version's entries: the field that was set at creation —
 * `renderChange`'s VACANCY_CREATED case, split out to keep that function's
 * own cognitive complexity low (see the comment on `renderChange` below). */
const renderVacancyCreatedChange = (
  ctx: ContentCtx,
  change: VacancyVersionHistoryChange,
  y: number
): number => {
  const value = getSingleScalar(change.newValue) ?? '—';
  let height = renderSummaryLine(
    ctx,
    y,
    change.sectionName,
    PDF_LABELS.verbs.created,
    change.fieldName,
    PDF_COLORS.added
  );
  height += SUMMARY_TO_SCALAR_GAP;
  if (change.fieldName.toLowerCase() === 'status') {
    if (!ctx.dry) {
      renderStatusPill(
        ctx,
        ctx.x,
        y + height,
        statusDisplayLabel(value),
        statusPillColors(value)
      );
    }
    return height + PILL_HEIGHT;
  }
  return (
    height +
    renderPlainValue(
      ctx,
      y + height,
      formatChangeValue(value),
      PDF_COLORS.heading
    )
  );
};

/**
 * All of a version's VACANCY_CREATED sub-fields combined into one card
 * (Figma nodes 4229:230488 "Scheduled for publishing" / 4229:230451 "Saved
 * as {status}") instead of one card per field — mirrors the web's
 * VacancyCreationSummaryCard. Takes the whole entry (not just its
 * representative `change`), since the "Created By" row reuses the entry's
 * own resolved attribution/avatar, not a field inside the summary. Only
 * called when `entry.vacancyCreationSummary` is set (see
 * buildVacancyCreationSummary() in version-history-helpers.ts) —
 * `renderChange` falls back to the plain per-field `renderVacancyCreatedChange`
 * above otherwise.
 */
const renderVacancyCreationSummaryCard = (
  ctx: ContentCtx,
  entry: VersionHistoryEntry,
  y: number
): number => {
  const { doc } = ctx;
  const summary = entry.vacancyCreationSummary;
  if (!summary) return 0;
  const isScheduled = summary.scheduleDate !== null;

  // Header: "Vacancy Created - Scheduled for publishing" or "Vacancy
  // Created - Saved as {StatusPill}" — no "Section Name -" prefix or
  // divider rule, a different shape from every other change type's header.
  doc.font(PDF_FONT_BOLD).fontSize(SUMMARY_FONT_SIZE);
  const vacancyCreatedWidth = doc.widthOfString(PDF_LABELS.vacancyCreated);
  const suffixText = isScheduled
    ? ` - ${PDF_LABELS.scheduledForPublishing}`
    : ` - ${PDF_LABELS.savedAs}`;
  const suffixWidth = doc.widthOfString(suffixText);
  const headerLineHeight = doc.currentLineHeight(true);

  const statusLabel = statusDisplayLabel(summary.status);
  const headerHeight = isScheduled
    ? headerLineHeight
    : Math.max(headerLineHeight, PILL_HEIGHT);

  if (!ctx.dry) {
    doc
      .font(PDF_FONT_BOLD)
      .fontSize(SUMMARY_FONT_SIZE)
      .fillColor(PDF_COLORS.added)
      .text(PDF_LABELS.vacancyCreated, ctx.x, y, { lineBreak: false });
    doc
      .fillColor(PDF_COLORS.body)
      .text(suffixText, ctx.x + vacancyCreatedWidth, y, { lineBreak: false });
    if (!isScheduled) {
      renderStatusPill(
        ctx,
        ctx.x + vacancyCreatedWidth + suffixWidth + INLINE_GAP,
        y + (headerHeight - PILL_HEIGHT) / 2,
        statusLabel,
        statusPillColors(summary.status)
      );
    }
  }

  // The box below: same bordered-card pattern as every other value box
  // (BOX_PADDING/BOX_TITLE_FONT_SIZE/PDF_CARD_RADIUS), not a new one.
  const boxY = y + headerHeight + SUMMARY_TO_SCALAR_GAP;
  const boxWidth = ctx.width;

  doc.font(PDF_FONT_BOLD).fontSize(BOX_TITLE_FONT_SIZE);
  const titleHeight = doc.heightOfString(summary.title, {
    width: boxWidth - BOX_PADDING * 2,
  });

  doc.font(PDF_FONT_MEDIUM).fontSize(VACANCY_CREATION_META_FONT_SIZE);
  const metaLineHeight = doc.currentLineHeight(true);
  const metaRowHeight = Math.max(
    VACANCY_CREATION_AVATAR_DIAMETER,
    metaLineHeight
  );

  const boxHeight =
    BOX_PADDING * 2 + titleHeight + VACANCY_CREATION_TITLE_GAP + metaRowHeight;

  if (!ctx.dry) {
    doc
      .roundedRect(ctx.x, boxY, boxWidth, boxHeight, PDF_CARD_RADIUS)
      .lineWidth(1)
      .fillAndStroke('#ffffff', PDF_COLORS.gridAccentBorder);
    doc
      .font(PDF_FONT_BOLD)
      .fontSize(BOX_TITLE_FONT_SIZE)
      .fillColor(PDF_COLORS.added)
      .text(summary.title, ctx.x + BOX_PADDING, boxY + BOX_PADDING, {
        width: boxWidth - BOX_PADDING * 2,
      });

    const metaY = boxY + BOX_PADDING + titleHeight + VACANCY_CREATION_TITLE_GAP;
    const metaTextY = metaY + (metaRowHeight - metaLineHeight) / 2;
    const displayName = entry.isSystem ? PDF_SYSTEM_LABEL : entry.attribution;
    let cursorX = ctx.x + BOX_PADDING;

    renderPersonIcon(
      doc,
      cursorX,
      metaY + (metaRowHeight - VACANCY_CREATION_META_FONT_SIZE) / 2,
      VACANCY_CREATION_META_FONT_SIZE,
      PDF_COLORS.muted
    );
    cursorX += VACANCY_CREATION_META_FONT_SIZE + VACANCY_CREATION_META_GAP;

    doc
      .font(PDF_FONT_MEDIUM)
      .fontSize(VACANCY_CREATION_META_FONT_SIZE)
      .fillColor(PDF_COLORS.muted)
      .text(PDF_LABELS.createdBy, cursorX, metaTextY, { lineBreak: false });
    cursorX +=
      doc.widthOfString(PDF_LABELS.createdBy) + VACANCY_CREATION_META_GAP;

    doc
      .circle(
        cursorX + DOT_DIAMETER / 2,
        metaY + metaRowHeight / 2,
        DOT_DIAMETER / 2
      )
      .fillColor(PDF_COLORS.muted)
      .fill();
    cursorX += DOT_DIAMETER + VACANCY_CREATION_META_GAP;

    renderAvatar(
      doc,
      cursorX,
      metaY + (metaRowHeight - VACANCY_CREATION_AVATAR_DIAMETER) / 2,
      VACANCY_CREATION_AVATAR_DIAMETER,
      displayName,
      entry.isSystem
    );
    cursorX += VACANCY_CREATION_AVATAR_DIAMETER + VACANCY_CREATION_META_GAP;

    doc
      .font(PDF_FONT_MEDIUM)
      .fontSize(VACANCY_CREATION_META_FONT_SIZE)
      .fillColor(PDF_COLORS.heading)
      .text(displayName, cursorX, metaTextY, { lineBreak: false });

    if (isScheduled) {
      cursorX += doc.widthOfString(displayName) + VACANCY_CREATION_META_GAP;
      doc
        .circle(
          cursorX + DOT_DIAMETER / 2,
          metaY + metaRowHeight / 2,
          DOT_DIAMETER / 2
        )
        .fillColor(PDF_COLORS.muted)
        .fill();
      cursorX += DOT_DIAMETER + VACANCY_CREATION_META_GAP;

      doc
        .font(PDF_FONT_MEDIUM)
        .fontSize(VACANCY_CREATION_META_FONT_SIZE)
        .fillColor(PDF_COLORS.muted)
        .text(
          PDF_LABELS.willGoLiveOn(
            formatChangeValue(summary.scheduleDate ?? '')
          ),
          cursorX,
          metaTextY,
          { lineBreak: false }
        );
    }
  }

  return headerHeight + SUMMARY_TO_SCALAR_GAP + boxHeight;
};

/** A FIELD_VALUE_ADDED/REMOVED/UPDATED change — `renderChange`'s default
 * case, split out to keep that function's own cognitive complexity low (see
 * the comment on `renderChange` below). */
const renderFieldValueChange = (
  ctx: ContentCtx,
  change: VacancyVersionHistoryChange,
  y: number
): number => {
  const variant = resolveChangeVariant(change);
  const isRemoved = variant === 'removed';
  const accent = isRemoved ? PDF_COLORS.removed : PDF_COLORS.added;
  const borderColor = isRemoved
    ? PDF_COLORS.removed
    : PDF_COLORS.gridAccentBorder;
  // A removal describes what went away, so its values live on oldValue;
  // additions and updates describe the resulting state on newValue. This
  // also covers the "UPDATED with newValue: null" effective-removal case
  // resolveChangeVariant() detects — its value lives on oldValue too.
  const value = isRemoved ? change.oldValue : change.newValue;

  if (shouldRenderAsGrid(value)) {
    let height = renderSummaryLine(
      ctx,
      y,
      change.sectionName,
      summaryVerbFor(variant),
      summaryDetailFor(change.fieldName, value.length, variant),
      accent
    );
    height += SUMMARY_TO_MULTI_GAP;
    height += isObjectArray(value)
      ? renderBoxGrid(ctx, y + height, toGridItems(value), borderColor, accent)
      : renderChips(ctx, y + height, toChipItems(value));
    return height;
  }

  const rawBefore = getSingleScalar(change.oldValue);
  const rawAfter = getSingleScalar(change.newValue);
  const before = rawBefore === null ? null : formatChangeValue(rawBefore);
  const after = rawAfter === null ? null : formatChangeValue(rawAfter);

  // Vacancy-level scalar edits (title, schedule/expiration dates) get their
  // own sentence in Figma instead of the generic section header.
  const labelKey = resolveScalarChangeLabelKey(change);
  if (labelKey && before !== null && after !== null) {
    return renderInlineDiff(
      ctx,
      y,
      PDF_LABELS[labelKey],
      // Figma strikes the superseded title/schedule-date and reads it in
      // the muted body color, with the new value staying the heading color
      // (DQCGP-3880).
      { kind: 'text', text: before, strike: true, color: PDF_COLORS.body },
      { kind: 'text', text: after }
    );
  }

  let height = renderSummaryLine(
    ctx,
    y,
    change.sectionName,
    summaryVerbFor(variant),
    change.fieldName,
    accent
  );
  height += SUMMARY_TO_SCALAR_GAP;

  if (before !== null && after !== null) {
    return (
      height +
      renderScalarDiffBoxes(ctx, y + height, change.fieldName, before, after)
    );
  }

  const rawSingle = getSingleScalar(value);
  return (
    height +
    renderPlainValue(
      ctx,
      y + height,
      rawSingle === null ? '—' : formatChangeValue(rawSingle),
      accent
    )
  );
};

/** Draws (or measures, when `ctx.dry`) one change's card content. Dispatches
 * by changeType to a dedicated renderer per case (see above) rather than
 * inlining each branch here — the same behavior, just kept out of one
 * function whose cognitive complexity would otherwise compound every nested
 * if/ternary inside a switch case. */
const renderChange = (
  ctx: ContentCtx,
  entry: VersionHistoryEntry,
  y: number
): number => {
  const { change } = entry;
  // Both detected by fieldName, not changeType — the API reports a section's
  // enabled/disabled toggle under SECTION_ENABLED for some sections but a
  // plain FIELD_VALUE_UPDATED for others (see isSectionStatusChange's own
  // comment), and Data Taken From Candidate is always FIELD_VALUE_UPDATED
  // (see isDataTakenFromCandidateChange's own comment) — so both have to be
  // checked before the changeType switch rather than as one of its cases.
  if (isSectionStatusChange(change)) {
    return renderSectionToggleChange(ctx, change, y);
  }
  if (isDataTakenFromCandidateChange(change)) {
    return renderDataTakenFromCandidateChange(ctx, change, y);
  }
  switch (change.changeType) {
    case 'STATUS_CHANGED':
      return renderInlineDiff(
        ctx,
        y,
        PDF_LABELS.statusUpdated,
        { kind: 'status', status: getSingleScalar(change.oldValue) ?? '' },
        { kind: 'status', status: getSingleScalar(change.newValue) ?? '' }
      );
    case 'VACANCY_CREATED':
      return entry.vacancyCreationSummary
        ? renderVacancyCreationSummaryCard(ctx, entry, y)
        : renderVacancyCreatedChange(ctx, change, y);
    default:
      return renderFieldValueChange(ctx, change, y);
  }
};

// ---------------------------------------------------------------------------
// Avatars and icons — drawn as pdfkit vectors since it has no SVG support.
// ---------------------------------------------------------------------------

// Matches vuesax/linear/monitor (Figma's "System" avatar icon) closely
// enough at this size: a rounded screen + a small stand/base beneath it.
const renderMonitorIcon = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  const screenWidth = size * 0.92;
  const screenHeight = size * 0.6;
  const screenLeft = x + (size - screenWidth) / 2;
  const screenTop = y + size * 0.12;
  doc
    .roundedRect(screenLeft, screenTop, screenWidth, screenHeight, size * 0.08)
    .lineWidth(1.2)
    .strokeColor(color)
    .stroke();

  const centerX = x + size / 2;
  const standTop = screenTop + screenHeight;
  const standBottom = standTop + size * 0.14;
  doc
    .moveTo(centerX, standTop)
    .lineTo(centerX, standBottom)
    .lineWidth(1.2)
    .strokeColor(color)
    .stroke();

  const baseHalfWidth = size * 0.22;
  doc
    .moveTo(centerX - baseHalfWidth, standBottom)
    .lineTo(centerX + baseHalfWidth, standBottom)
    .lineWidth(1.2)
    .strokeColor(color)
    .stroke();
};

const renderAvatar = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  diameter: number,
  label: string,
  isSystem: boolean
) => {
  const radius = diameter / 2;
  doc
    .circle(x + radius, y + radius, radius)
    .fillColor(isSystem ? PDF_COLORS.chipBackground : PDF_COLORS.heading)
    .fill();

  if (isSystem) {
    const iconSize = diameter * 0.55;
    renderMonitorIcon(
      doc,
      x + (diameter - iconSize) / 2,
      y + (diameter - iconSize) / 2,
      iconSize,
      PDF_COLORS.muted
    );
    return;
  }

  const fontSize = diameter * 0.42;
  doc
    .font(PDF_FONT_BOLD)
    .fontSize(fontSize)
    .fillColor('#ffffff')
    .text(label.slice(0, 1).toUpperCase(), x, y + radius - fontSize * 0.68, {
      width: diameter,
      align: 'center',
      lineBreak: false,
    });
};

type SidebarRowMetrics = {
  rowHeight: number;
  versionHeight: number;
  metaHeight: number;
  actorRowHeight: number;
};

// Every row is the same fixed height (derived from font metrics alone, not
// from any row's own text) — measured once and reused for every page's worth
// of rows, rather than re-measured per page.
const measureSidebarRowMetrics = (
  doc: PDFKit.PDFDocument
): SidebarRowMetrics => {
  doc.font(PDF_FONT_BOLD).fontSize(PDF_SIDEBAR_VERSION_FONT_SIZE);
  const versionHeight = doc.currentLineHeight(true);
  // The date and actor-name text are font-medium on the page, not
  // font-semibold — a distinct registered weight, not an approximation.
  doc.font(PDF_FONT_MEDIUM).fontSize(PDF_SIDEBAR_META_FONT_SIZE);
  const metaHeight = doc.currentLineHeight(true);
  const actorRowHeight = Math.max(PDF_SIDEBAR_AVATAR_DIAMETER, metaHeight);
  const rowHeight =
    PDF_SIDEBAR_ROW_PADDING_Y * 2 +
    versionHeight +
    SIDEBAR_ROW_TEXT_GAP +
    actorRowHeight;
  return { rowHeight, versionHeight, metaHeight, actorRowHeight };
};

/**
 * The left version list (Figma node 4229:229403): each row sets the version
 * number large with the uppercase date right-aligned beside it, and the
 * updater's avatar + name beneath. The downloaded/selected version's row
 * takes the teal highlight and tints its number.
 *
 * Draws as many rows as fit on the CURRENT page starting at `y` — never
 * more, so a row's absolute y can never cross page.maxY() and trigger
 * pdfkit's own implicit-addPage-per-call behavior (which would otherwise
 * scatter sidebar fragments across several near-blank pages — the same trap
 * the footer loop works around by zeroing the bottom margin). It does NOT
 * add pages itself or drop any version: the on-screen sidebar lists every
 * version (a plain scrollable list, no cap), and a downloaded PDF showing
 * fewer versions than the page is a real data mismatch, not an acceptable
 * simplification — the caller is responsible for drawing whatever this
 * function doesn't fit onto a further page (see the loop in
 * buildVersionHistoryDocument that keeps calling this across pages, adding
 * new ones only if the version list outlasts the Activity Log's own).
 * Returns how many versions (from the front of the list) it drew.
 */
const renderSidebarRowsOnCurrentPage = (
  doc: PDFKit.PDFDocument,
  { x, y, width }: { x: number; y: number; width: number },
  versions: VacancyVersionHistoryVersion[],
  selectedVersionNumber: string | undefined,
  createdBy: string,
  metrics: SidebarRowMetrics
): number => {
  const { rowHeight, versionHeight, metaHeight, actorRowHeight } = metrics;
  const innerWidth = width - PDF_SIDEBAR_ROW_PADDING_X * 2;
  const maxRowBottom = doc.page.height - doc.page.margins.bottom;
  const maxRowCount = Math.max(0, Math.floor((maxRowBottom - y) / rowHeight));
  const pageVersions = versions.slice(0, maxRowCount);

  let rowY = y;
  pageVersions.forEach(version => {
    const isSelected = version.versionNumber === selectedVersionNumber;
    const actor = resolveVersionActor(version, createdBy);
    const isSystem = isSystemActor(actor);
    const actorLabel = isSystem ? PDF_SYSTEM_LABEL : actor;
    // versionNumber arrives pre-formatted as "V{n}.0" (CR-14); the PDF
    // mirrors the on-screen sidebar, dropping only the "V" prefix.
    const versionText = formatVersionNumber(version.versionNumber);
    const dateText = formatPdfVersionListDate(version.updatedAt);

    if (isSelected) {
      doc
        .rect(x, rowY, width, rowHeight)
        .fillColor(PDF_COLORS.selectedBg)
        .fill();
    }

    const contentX = x + PDF_SIDEBAR_ROW_PADDING_X;
    const versionY = rowY + PDF_SIDEBAR_ROW_PADDING_Y;

    doc
      .font(PDF_FONT_BOLD)
      .fontSize(PDF_SIDEBAR_VERSION_FONT_SIZE)
      .fillColor(isSelected ? PDF_COLORS.selectedText : PDF_COLORS.heading)
      .text(versionText, contentX, versionY, { lineBreak: false });

    // Figma keeps the row's date and actor name at basic/900 in BOTH the
    // selected and default state (nodes 4229:229407 / 4229:229415) — only the
    // version number is tinted when selected.
    doc
      .font(PDF_FONT_MEDIUM)
      .fontSize(PDF_SIDEBAR_META_FONT_SIZE)
      .fillColor(PDF_COLORS.heading)
      .text(dateText, contentX, versionY, {
        width: innerWidth,
        align: 'right',
        lineBreak: false,
      });

    const actorY = versionY + versionHeight + SIDEBAR_ROW_TEXT_GAP;
    renderAvatar(
      doc,
      contentX,
      actorY + (actorRowHeight - PDF_SIDEBAR_AVATAR_DIAMETER) / 2,
      PDF_SIDEBAR_AVATAR_DIAMETER,
      actorLabel,
      isSystem
    );
    doc.font(PDF_FONT_MEDIUM).fontSize(PDF_SIDEBAR_META_FONT_SIZE);
    doc
      .fillColor(PDF_COLORS.heading)
      .text(
        truncateToWidth(
          doc,
          actorLabel,
          innerWidth - PDF_SIDEBAR_AVATAR_DIAMETER - SIDEBAR_AVATAR_TEXT_GAP
        ),
        contentX + PDF_SIDEBAR_AVATAR_DIAMETER + SIDEBAR_AVATAR_TEXT_GAP,
        actorY + (actorRowHeight - metaHeight) / 2,
        { lineBreak: false }
      );

    doc
      .moveTo(x, rowY + rowHeight)
      .lineTo(x + width, rowY + rowHeight)
      .strokeColor(PDF_COLORS.border)
      .lineWidth(1)
      .stroke();

    rowY += rowHeight;
  });

  return pageVersions.length;
};

// Header icons matching the Figma "Version History" screen's vuesax icon set
// (fileKey BFyxZ6AzbRZgVvjLzRFwv3, node 4229:229002) — drawn as simple vector
// shapes rather than embedding the actual icon assets, since pdfkit has no
// native SVG support and these are small/plain enough to approximate directly.
//
// The meta-row glyphs are vuesax *bold* (solid) in the design, so these are
// filled rather than stroked — the on-screen header renders the real exported
// SVGs, which pdfkit cannot consume.
const renderCalendarIcon = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  const top = y + size * 0.14;
  const bodyHeight = size * 0.82;
  doc
    .roundedRect(x, top, size, bodyHeight, size * 0.14)
    .fillColor(color)
    .fill();
  // Knock the day grid back out of the solid body.
  doc
    .rect(x + size * 0.14, top + bodyHeight * 0.42, size * 0.72, size * 0.1)
    .fillColor('#ffffff')
    .fill();
  [0.28, 0.72].forEach(fraction => {
    doc
      .moveTo(x + size * fraction, y)
      .lineTo(x + size * fraction, top + size * 0.1)
      .lineWidth(1.3)
      .strokeColor(color)
      .stroke();
  });
};

const renderClockIcon = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;
  doc.circle(cx, cy, r).fillColor(color).fill();
  // White hands on the solid dial.
  doc
    .moveTo(cx, cy)
    .lineTo(cx, cy - r * 0.55)
    .lineWidth(1.2)
    .strokeColor('#ffffff')
    .stroke();
  doc
    .moveTo(cx, cy)
    .lineTo(cx + r * 0.45, cy + r * 0.15)
    .lineWidth(1.2)
    .strokeColor('#ffffff')
    .stroke();
};

const renderPersonIcon = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  const cx = x + size / 2;
  const headRadius = size * 0.22;
  doc
    .circle(cx, y + headRadius + size * 0.05, headRadius)
    .fillColor(color)
    .fill();
  doc.save();
  doc.rect(x, y + size * 0.5, size, size * 0.5).clip();
  doc
    .circle(cx, y + size * 0.92, size * 0.42)
    .fillColor(color)
    .fill();
  doc.restore();
};

const renderVersionsIcon = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  const squareSize = size * 0.62;
  // Solid overlapping squares (vuesax/bold/3square): the back square is
  // outlined so the front one reads as sitting on top of it.
  doc
    .roundedRect(x, y, squareSize, squareSize, 1.5)
    .lineWidth(1.2)
    .strokeColor(color)
    .stroke();
  doc
    .roundedRect(
      x + size - squareSize,
      y + size - squareSize,
      squareSize,
      squareSize,
      1.5
    )
    .fillColor(color)
    .fill();
};

/**
 * One Activity Log entry: the actor's avatar, name and dot-separated
 * date/time, then the change on a light card. Returns the height consumed.
 */
const renderEntry = (
  doc: PDFKit.PDFDocument,
  entry: VersionHistoryEntry,
  x: number,
  width: number,
  y: number
): number => {
  const displayName = entry.isSystem ? PDF_SYSTEM_LABEL : entry.attribution;
  const textX = x + AVATAR_DIAMETER + AVATAR_NAME_GAP;
  const textWidth = width - AVATAR_DIAMETER - AVATAR_NAME_GAP;

  doc.font(PDF_FONT_BOLD).fontSize(NAME_FONT_SIZE);
  const nameHeight = doc.currentLineHeight(true);
  doc.font(PDF_FONT_SEMIBOLD).fontSize(DATETIME_FONT_SIZE);
  const metaHeight = doc.currentLineHeight(true);
  // change-entry stacks name/date-time in a flex-col with gap-1.
  const textBlockHeight = nameHeight + NAME_DATETIME_GAP + metaHeight;
  const attributionHeight = Math.max(AVATAR_DIAMETER, textBlockHeight);

  const cardCtx: ContentCtx = {
    doc,
    x: x + PDF_CARD_PADDING,
    width: width - PDF_CARD_PADDING * 2,
    dry: true,
  };
  const cardHeight = renderChange(cardCtx, entry, 0) + PDF_CARD_PADDING * 2;

  renderAvatar(
    doc,
    x,
    y + (attributionHeight - AVATAR_DIAMETER) / 2,
    AVATAR_DIAMETER,
    displayName,
    entry.isSystem
  );

  const textY = y + (attributionHeight - textBlockHeight) / 2;
  doc
    .font(PDF_FONT_BOLD)
    .fontSize(NAME_FONT_SIZE)
    .fillColor(PDF_COLORS.attributionName)
    .text(displayName, textX, textY, { width: textWidth, lineBreak: false });

  // Figma separates the date and time with a small vector dot rather than a
  // bullet character (node 4229:229245); the date-dot-time row's own gap-2
  // spaces all three.
  const metaY = textY + nameHeight + NAME_DATETIME_GAP;
  const dateText = formatPdfDate(entry.updatedAt);
  const timeText = formatPdfTime(entry.updatedAt);
  doc
    .font(PDF_FONT_SEMIBOLD)
    .fontSize(DATETIME_FONT_SIZE)
    .fillColor(PDF_COLORS.muted)
    .text(dateText, textX, metaY, { lineBreak: false });
  const dateWidth = doc.widthOfString(dateText);
  const dotX = textX + dateWidth + DATETIME_GAP;
  doc
    .circle(dotX + DOT_DIAMETER / 2, metaY + metaHeight / 2, DOT_DIAMETER / 2)
    .fillColor(PDF_COLORS.muted)
    .fill();
  doc
    .font(PDF_FONT_SEMIBOLD)
    .fontSize(DATETIME_FONT_SIZE)
    .fillColor(PDF_COLORS.muted)
    .text(timeText, dotX + DOT_DIAMETER + DATETIME_GAP, metaY, {
      lineBreak: false,
    });

  // The card background must be painted before its content — pdfkit has no
  // z-order, so anything filled afterwards would paint over the text.
  const cardY = y + attributionHeight + ATTRIBUTION_CARD_GAP;
  doc
    .roundedRect(x, cardY, width, cardHeight, PDF_CARD_RADIUS)
    .lineWidth(1)
    .fillAndStroke(PDF_COLORS.cardBackground, PDF_COLORS.border);

  renderChange({ ...cardCtx, dry: false }, entry, cardY + PDF_CARD_PADDING);

  return attributionHeight + ATTRIBUTION_CARD_GAP + cardHeight;
};

const buildVersionHistoryDocument = (
  data: VacancyVersionHistoryData,
  regularFont: ArrayBuffer,
  mediumFont: ArrayBuffer,
  semiboldFont: ArrayBuffer,
  boldFont: ArrayBuffer,
  selectedVersionNumber?: string
) => {
  const doc = new PDFDocument({
    size: PDF_PAGE_SIZE,
    // The page is a two-column dashboard layout (version sidebar + a wide
    // Activity Log with its own 2-column value-box grid) at the page's own,
    // page-accurate font/spacing scale (see PX_TO_PT above) — a narrow
    // portrait page is too narrow for that at this scale, forcing the header
    // meta row and value boxes to wrap/cram in ways the page itself never
    // does. Landscape gives ~742pt of content width (vs ~495pt portrait),
    // matching the width a real desktop viewport would actually give this
    // design.
    layout: 'landscape',
    margin: PDF_PAGE_MARGIN,
    bufferPages: true,
    // @types/pdfkit types `font` as `string` only, but pdfkit's own runtime
    // treats any falsy value as "skip the default font" (see pdfkit's
    // FontsMixin.initFonts) — false is required here to stop the
    // constructor from eagerly loading the standard "Helvetica" AFM data
    // via fs.readFileSync before registerFont() below runs.
    font: false as unknown as string,
    info: { Title: `${data.vacancyTitle} - Version History` },
  });

  doc
    .registerFont(PDF_FONT_REGULAR, Buffer.from(regularFont))
    .registerFont(PDF_FONT_MEDIUM, Buffer.from(mediumFont))
    .registerFont(PDF_FONT_SEMIBOLD, Buffer.from(semiboldFont))
    .registerFont(PDF_FONT_BOLD, Buffer.from(boldFont))
    .font(PDF_FONT_REGULAR);

  // The header's own text (breadcrumb/title/meta) is inset by its own p-7,
  // like the sidebar row and content-panel text below it — NOT by
  // PDF_PAGE_MARGIN, an unrelated "print margin" concept that doesn't exist
  // on the page at all. Both insets happen to share the same source value
  // (28px, HEADER_PADDING and PDF_SIDEBAR_ROW_PADDING_X are both `28 *
  // PX_TO_PT`), which is exactly why using the wrong one here was visible:
  // the header's title/labels sat further right than the version number
  // directly below them, when the page has them share one left edge.
  const marginLeft = HEADER_PADDING;
  const contentWidth = doc.page.width - HEADER_PADDING * 2;

  // Header, matching the on-screen page (Figma BFyxZ6AzbRZgVvjLzRFwv3, node
  // 4229:229200 for the underlying design): a small "Version History"
  // breadcrumb sits ABOVE the big vacancy title (not below it), and the meta
  // row carries an icon per segment instead of "|" separators. No chevron
  // before the breadcrumb — dropped from the on-screen page per explicit
  // request, and the PDF follows the same page it's generated from.
  //
  // The header's bg-[#f8fafc] fill spans the FULL page width and starts at
  // the true page top (like the page's own header spans the full browser
  // viewport, not just the content column) — computed here via a measure
  // pass BEFORE any text is drawn, since pdfkit has no z-order and a fill
  // painted after the text would cover it.
  //
  // breadcrumbY is the header's OWN top padding (HEADER_PADDING, 28px's
  // worth of pt) from the true page top — NOT doc.y, whose default initial
  // value is PDF_PAGE_MARGIN (50pt, the print-safety margin passed to the
  // PDFDocument constructor). Those are two unrelated concepts that happen
  // to both exist in this file, and using the margin here left ~29pt of
  // extra space above "Version History" that the page itself doesn't have —
  // the same class of bug already fixed for the LEFT edge (see marginLeft
  // above), just never applied to the TOP. With this fixed, the header's
  // total height (breadcrumb through the bottom rule) comes out to exactly
  // 147pt — Figma's own header frame (node 4229:229002) is 196px tall,
  // and 196 * PX_TO_PT (0.75) = 147, confirming this is the right value
  // rather than another approximation.
  const breadcrumbY = HEADER_PADDING;
  doc.font(PDF_FONT_BOLD).fontSize(BREADCRUMB_FONT_SIZE);
  const breadcrumbHeight = doc.currentLineHeight(true);

  const titleY = breadcrumbY + breadcrumbHeight + TITLE_GAP;
  doc.font(PDF_FONT_BOLD).fontSize(TITLE_FONT_SIZE);
  const titleHeight = doc.heightOfString(data.vacancyTitle, {
    width: contentWidth,
  });

  // The meta row wraps (matching the page's `flex-wrap gap-x-3 gap-y-2`)
  // rather than silently overflowing the page edge when the segments (a long
  // email, in particular) don't fit on one line. Positions are computed once
  // here (a measure pass) and reused for the actual draw pass below, so the
  // two can never disagree about where a segment landed.
  const versionsCount = data.totalVersions;
  const metaRowY = titleY + titleHeight + META_GAP;
  const metaSegments = [
    {
      icon: renderCalendarIcon,
      text: `Created ${formatPdfDate(data.createdAt)}`,
    },
    {
      icon: renderClockIcon,
      text: `Last Updated ${formatPdfDate(data.lastUpdatedAt)}`,
    },
    { icon: renderPersonIcon, text: data.createdBy },
    {
      icon: renderVersionsIcon,
      text: `${versionsCount} Version${versionsCount === 1 ? '' : 's'}`,
    },
  ];
  doc.font(PDF_FONT_SEMIBOLD).fontSize(META_FONT_SIZE);
  const metaLineHeight = doc.currentLineHeight(true);
  const metaRowHeight = Math.max(META_ICON_SIZE, metaLineHeight);

  let metaX = marginLeft;
  let metaY = metaRowY;
  const metaLayout = metaSegments.map(({ icon, text }) => {
    const textWidth = doc.widthOfString(text);
    const segmentWidth = META_ICON_SIZE + META_ICON_TEXT_GAP + textWidth;
    if (
      metaX > marginLeft &&
      metaX + segmentWidth > marginLeft + contentWidth
    ) {
      metaX = marginLeft;
      metaY += metaRowHeight + META_SEGMENT_GAP_Y;
    }
    const placement = { icon, text, x: metaX, y: metaY };
    metaX += segmentWidth + META_SEGMENT_GAP_X;
    return placement;
  });

  // The header's own bottom padding (py-7) sits between the meta row and its
  // bottom border — the two-column content below starts immediately at that
  // border with no further gap, since header and content are adjacent flex
  // siblings on the page, not separately-margined blocks.
  const headerRuleY = metaY + metaRowHeight + HEADER_PADDING;

  doc.rect(0, 0, doc.page.width, headerRuleY).fill(PDF_COLORS.cardBackground);

  doc
    .font(PDF_FONT_BOLD)
    .fontSize(BREADCRUMB_FONT_SIZE)
    .fillColor(PDF_COLORS.heading)
    .text(PDF_LABELS.breadcrumb, marginLeft, breadcrumbY, {
      lineBreak: false,
    });
  doc
    .font(PDF_FONT_BOLD)
    .fontSize(TITLE_FONT_SIZE)
    .fillColor(PDF_COLORS.heading)
    .text(data.vacancyTitle, marginLeft, titleY, { width: contentWidth });
  metaLayout.forEach(({ icon, text, x, y }) => {
    icon(
      doc,
      x,
      y + (metaRowHeight - META_ICON_SIZE) / 2,
      META_ICON_SIZE,
      PDF_COLORS.muted
    );
    doc
      .font(PDF_FONT_SEMIBOLD)
      .fontSize(META_FONT_SIZE)
      .fillColor(PDF_COLORS.muted)
      .text(
        text,
        x + META_ICON_SIZE + META_ICON_TEXT_GAP,
        y + (metaRowHeight - metaLineHeight) / 2,
        {
          lineBreak: false,
        }
      );
  });

  doc
    .moveTo(0, headerRuleY)
    .lineTo(doc.page.width, headerRuleY)
    .strokeColor(PDF_COLORS.border)
    .strokeOpacity(0.6)
    .lineWidth(1)
    .stroke();
  doc.strokeOpacity(1);
  doc.x = marginLeft;
  doc.y = headerRuleY;

  // Two-column layout below the header, matching the on-screen page: every
  // version listed on the left with the downloaded/selected one highlighted,
  // and only that one's Activity Log expanded on the right.
  const versions = [...data.versions].sort(compareVersionNumbersDesc);
  const selectedVersion =
    versions.find(v => v.versionNumber === selectedVersionNumber) ??
    versions[0];

  // Unlike the header (a full-bleed banner) or the sidebar/content row below,
  // the page itself has NO outer margin around this row at all — the sidebar
  // touches the browser viewport's true left edge, and its selected-row
  // highlight fills flush to that same edge. A margined left inset here was
  // reported as a visible gap that doesn't exist on the page, so this row
  // drops the LEFT margin entirely; the right margin is kept as a
  // print-safety allowance (the page itself has no equivalent concept of
  // "print safety", but this PDF is a physical/printable document the page
  // isn't). `rowWidth` — not `contentWidth` — is what the sidebar's 29% is
  // computed against, since the row it shares with the content panel is
  // this wider, left-full-bled width, not the header's margined width.
  const rowWidth = doc.page.width - PDF_PAGE_MARGIN;
  const sidebarWidth = rowWidth * PDF_SIDEBAR_WIDTH_RATIO;

  const columnTopY = doc.y;

  // The rule marks the sidebar's edge (drawn per page in the footer pass
  // below so continuation pages don't lose it). The content panel has no
  // separate "column gap" on the page — it's a plain adjacent flex sibling
  // with its own p-7 inset on ALL sides (left AND top, not just left), which
  // PDF_CONTENT_PANEL_PADDING mirrors here. The sidebar needs no equivalent
  // top offset — it has no wrapping p-7 of its own, only per-row px-7/py-5.
  const dividerX = sidebarWidth;
  const contentX = sidebarWidth + PDF_CONTENT_PANEL_PADDING;
  const contentY = columnTopY + PDF_CONTENT_PANEL_PADDING;
  const mainContentWidth = rowWidth - sidebarWidth - PDF_CONTENT_PANEL_PADDING;

  doc
    .font(PDF_FONT_BOLD)
    .fontSize(ACTIVITY_HEADING_FONT_SIZE)
    .fillColor(PDF_COLORS.heading)
    .text(PDF_LABELS.activityLog, contentX, contentY, {
      width: mainContentWidth,
    });
  let cursorY = doc.y + PDF_ENTRY_GAP;

  const entries = resolveVersionEntries(selectedVersion, data.createdBy);

  if (entries.length === 0) {
    // Matches the on-screen empty state (TemplateEmptyStateMessage via
    // versionHistory.activityLog.emptyState.*) — a title + description, not
    // the single plain sentence this used to be. No illustration image: the
    // PDF already substitutes text/vectors for other on-screen imagery (e.g.
    // the System avatar is a drawn monitor icon, not a photo).
    doc
      .font(PDF_FONT_BOLD)
      .fontSize(EMPTY_STATE_TITLE_FONT_SIZE)
      .fillColor(PDF_COLORS.heading)
      .text(PDF_LABELS.noActivityTitle, contentX, cursorY, {
        width: mainContentWidth,
      });
    doc
      .font(PDF_FONT_SEMIBOLD)
      .fontSize(EMPTY_STATE_DESCRIPTION_FONT_SIZE)
      .fillColor(PDF_COLORS.body)
      .text(
        PDF_LABELS.noActivityDescription,
        contentX,
        doc.y + EMPTY_STATE_TITLE_GAP,
        { width: mainContentWidth }
      );
  }

  entries.forEach(entry => {
    // Measure the whole entry first so it can move to the next page as one
    // block rather than splitting its attribution row from its card.
    const probe: ContentCtx = {
      doc,
      x: contentX + PDF_CARD_PADDING,
      width: mainContentWidth - PDF_CARD_PADDING * 2,
      dry: true,
    };
    doc.font(PDF_FONT_BOLD).fontSize(NAME_FONT_SIZE);
    const nameHeight = doc.currentLineHeight(true);
    doc.font(PDF_FONT_SEMIBOLD).fontSize(DATETIME_FONT_SIZE);
    const metaHeight = doc.currentLineHeight(true);
    const attributionHeight = Math.max(
      AVATAR_DIAMETER,
      nameHeight + NAME_DATETIME_GAP + metaHeight
    );
    const entryHeight =
      attributionHeight +
      ATTRIBUTION_CARD_GAP +
      renderChange(probe, entry, 0) +
      PDF_CARD_PADDING * 2;

    if (cursorY + entryHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      cursorY = doc.page.margins.top;
    }

    cursorY +=
      renderEntry(doc, entry, contentX, mainContentWidth, cursorY) +
      PDF_ENTRY_GAP;
  });

  // Sidebar rows are drawn AFTER the Activity Log (which may have already
  // paginated) rather than before it, so every version gets a page to land
  // on: walk the pages the Activity Log already created first, then add
  // further pages only if the version list itself outlasts those — never
  // drop a version the way a fixed "page-1-only, +N more" cap used to (the
  // on-screen sidebar is a plain scrollable list with no cap at all, so a
  // downloaded PDF listing fewer versions than the page is a real data
  // mismatch, not an acceptable simplification).
  const sidebarMetrics = measureSidebarRowMetrics(doc);
  let remainingVersions = versions;
  const activityLogRange = doc.bufferedPageRange();
  for (
    let i = activityLogRange.start;
    i < activityLogRange.start + activityLogRange.count &&
    remainingVersions.length > 0;
    i++
  ) {
    doc.switchToPage(i);
    const pageTop =
      i === activityLogRange.start ? columnTopY : doc.page.margins.top;
    const drawnCount = renderSidebarRowsOnCurrentPage(
      doc,
      { x: 0, y: pageTop, width: sidebarWidth },
      remainingVersions,
      selectedVersion?.versionNumber,
      data.createdBy,
      sidebarMetrics
    );
    remainingVersions = remainingVersions.slice(drawnCount);
  }
  while (remainingVersions.length > 0) {
    doc.addPage();
    const drawnCount = renderSidebarRowsOnCurrentPage(
      doc,
      { x: 0, y: doc.page.margins.top, width: sidebarWidth },
      remainingVersions,
      selectedVersion?.versionNumber,
      data.createdBy,
      sidebarMetrics
    );
    // A single row that can never fit even on a fresh page shouldn't happen
    // at any realistic page size/font scale, but bail rather than spin
    // forever if it somehow did.
    if (drawnCount === 0) break;
    remainingVersions = remainingVersions.slice(drawnCount);
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Page 1's rule starts below the header; later pages run it full height so
    // the two columns stay visually separated throughout the document.
    doc
      .moveTo(dividerX, i === range.start ? columnTopY : doc.page.margins.top)
      .lineTo(dividerX, doc.page.height - doc.page.margins.bottom)
      .strokeColor(PDF_COLORS.border)
      .lineWidth(1)
      .stroke();

    // The footer sits inside the bottom margin (by design), but pdfkit computes
    // page.maxY() as height - margins.bottom and silently starts a whole new
    // page whenever a text call's y position would exceed it — so drawing the
    // footer there as-is creates a stray near-blank extra page every time.
    // Zeroing the bottom margin just for this call raises maxY to the full
    // page height, so the footer draws in place instead of triggering that.
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font(PDF_FONT_REGULAR)
      .fontSize(8)
      .fillColor(PDF_COLORS.muted)
      .text(
        `Page ${i - range.start + 1} of ${range.count}`,
        marginLeft,
        doc.page.height - PDF_PAGE_MARGIN + 10,
        { width: contentWidth, align: 'center', lineBreak: false }
      );
    doc.page.margins.bottom = bottomMargin;
  }

  return doc;
};

const buildVersionHistoryPdfBlob = async (
  data: VacancyVersionHistoryData,
  options?: { selectedVersionNumber?: string }
): Promise<Blob> => {
  const [regularFont, mediumFont, semiboldFont, boldFont] = await Promise.all([
    loadFontBuffer(regularFontUrl),
    loadFontBuffer(mediumFontUrl),
    loadFontBuffer(semiboldFontUrl),
    loadFontBuffer(boldFontUrl),
  ]);

  return new Promise((resolve, reject) => {
    try {
      const doc = buildVersionHistoryDocument(
        data,
        regularFont,
        mediumFont,
        semiboldFont,
        boldFont,
        options?.selectedVersionNumber
      );
      const stream = doc.pipe(blobStream());
      stream.on('finish', () => resolve(stream.toBlob('application/pdf')));
      stream.on('error', reject);
      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
};

export { buildVersionHistoryPdfBlob };
