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
  getSingleScalar,
  isObjectArray,
  isSystemActor,
  normalizeStatusKey,
  pluralizeFieldName,
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
  noChanges: 'No tracked changes recorded for this version.',
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
  while (clipped.length > 0 && /[.\s]/.test(clipped[clipped.length - 1])) {
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
const DATETIME_FONT_SIZE = 14 * PX_TO_PT; // change-entry date/time: text-sm
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
    .strokeColor(PDF_COLORS.muted)
    .stroke();
  doc
    .moveTo(x + size - headSize, centerY - headSize)
    .lineTo(x + size, centerY)
    .lineTo(x + size - headSize, centerY + headSize)
    .lineWidth(1.4)
    .lineCap('round')
    .lineJoin('round')
    .strokeColor(PDF_COLORS.muted)
    .stroke();
};

const renderStatusPill = (
  ctx: ContentCtx,
  x: number,
  y: number,
  label: string,
  colors: { bg: string; border: string; text: string }
): number => {
  const { doc } = ctx;
  doc.font(PDF_FONT_SEMIBOLD).fontSize(PILL_FONT_SIZE);
  const width = doc.widthOfString(label) + PILL_PADDING_X * 2;
  if (ctx.dry) return width;

  doc
    .roundedRect(x, y, width, PILL_HEIGHT, PILL_RADIUS)
    .lineWidth(1)
    .fillAndStroke(colors.bg, colors.border);
  const textHeight = doc.currentLineHeight(true);
  doc
    .fillColor(colors.text)
    .text(label, x + PILL_PADDING_X, y + (PILL_HEIGHT - textHeight) / 2, {
      lineBreak: false,
    });
  return width;
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
  | { kind: 'text'; text: string; strike?: boolean }
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
    .fillColor(PDF_COLORS.heading)
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

const summaryVerbFor = (change: VacancyVersionHistoryChange): string => {
  if (change.changeType === 'FIELD_VALUE_ADDED') return PDF_LABELS.verbs.added;
  if (change.changeType === 'FIELD_VALUE_REMOVED') {
    return PDF_LABELS.verbs.removed;
  }
  return PDF_LABELS.verbs.updated;
};

const summaryDetailFor = (
  change: VacancyVersionHistoryChange,
  count: number
): string => {
  const field = pluralizeFieldName(change.fieldName, count);
  return change.changeType === 'FIELD_VALUE_REMOVED'
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
  return height + renderPlainValue(ctx, y + height, value, PDF_COLORS.heading);
};

/** A FIELD_VALUE_ADDED/REMOVED/UPDATED change — `renderChange`'s default
 * case, split out to keep that function's own cognitive complexity low (see
 * the comment on `renderChange` below). */
const renderFieldValueChange = (
  ctx: ContentCtx,
  change: VacancyVersionHistoryChange,
  y: number
): number => {
  const isRemoved = change.changeType === 'FIELD_VALUE_REMOVED';
  const accent = isRemoved ? PDF_COLORS.removed : PDF_COLORS.added;
  const borderColor = isRemoved
    ? PDF_COLORS.removed
    : PDF_COLORS.gridAccentBorder;
  // A removal describes what went away, so its values live on oldValue;
  // additions and updates describe the resulting state on newValue.
  const value = isRemoved ? change.oldValue : change.newValue;

  if (shouldRenderAsGrid(value)) {
    let height = renderSummaryLine(
      ctx,
      y,
      change.sectionName,
      summaryVerbFor(change),
      summaryDetailFor(change, value.length),
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
      // Figma strikes the superseded schedule date but leaves the old
      // vacancy title un-struck (node 4229:229271).
      { kind: 'text', text: before, strike: labelKey !== 'titleChanged' },
      { kind: 'text', text: after }
    );
  }

  let height = renderSummaryLine(
    ctx,
    y,
    change.sectionName,
    summaryVerbFor(change),
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
  change: VacancyVersionHistoryChange,
  y: number
): number => {
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
      return renderVacancyCreatedChange(ctx, change, y);
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

/**
 * The left version list (Figma node 4229:229403): each row sets the version
 * number large with the uppercase date right-aligned beside it, and the
 * updater's avatar + name beneath. The downloaded/selected version's row
 * takes the teal highlight and tints its number.
 */
const renderPdfSidebar = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  versions: VacancyVersionHistoryVersion[],
  selectedVersionNumber: number | undefined,
  createdBy: string
): number => {
  let rowY = y;
  const innerWidth = width - PDF_SIDEBAR_ROW_PADDING_X * 2;

  // Every row is the same fixed height (derived from font metrics alone, not
  // from any row's own text) — computed once, up front, rather than inside
  // the loop below, since it's also needed here to work out how many rows
  // actually fit before drawing anything.
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

  // Once a row would cross the page's printable bottom, every further
  // .text()/.rect() call in this loop would pass pdfkit a y position beyond
  // page.maxY() — which pdfkit "fixes" by silently inserting a brand-new
  // page PER CALL (the same trap the footer loop below works around by
  // zeroing the bottom margin), scattering sidebar fragments across several
  // near-blank pages and leaving the Activity Log content to render on
  // whatever page pdfkit's pointer landed on by the time that code runs —
  // reported live: a vacancy with 6 versions pushed its Activity Log entry
  // onto page 5 of 5 instead of page 1. Capping how many rows are drawn (the
  // sidebar is page-1-only by design, see the two-column layout comment
  // above) keeps that from ever happening.
  const maxRowBottom = doc.page.height - doc.page.margins.bottom;
  doc.font(PDF_FONT_MEDIUM).fontSize(PDF_SIDEBAR_META_FONT_SIZE);
  const noteLineHeight = doc.currentLineHeight(true);
  const noteReservedHeight = PDF_SIDEBAR_ROW_PADDING_Y + noteLineHeight;
  const naiveMaxRowCount = Math.max(
    0,
    Math.floor((maxRowBottom - y) / rowHeight)
  );
  // Whenever the list won't fully fit, reserve room for the "+N more" note
  // BEFORE deciding how many rows to draw — otherwise the leftover space
  // after the last row that does fit can easily be too small for the note
  // itself, silently dropping the very thing meant to flag the drop.
  const needsTruncationNote = naiveMaxRowCount < versions.length;
  const maxRowCount = needsTruncationNote
    ? Math.max(
        0,
        Math.floor((maxRowBottom - y - noteReservedHeight) / rowHeight)
      )
    : naiveMaxRowCount;

  // A version list too long to fit can still cut off the very version this
  // PDF was downloaded FOR — e.g. selecting an old version once enough newer
  // ones exist to fill the page. If the naive "first N by recency" cut would
  // drop it, swap the last slot for it instead: the display is no longer
  // perfectly contiguous by version number, but the selected row — the
  // whole reason this sidebar highlights anything — is never silently
  // omitted.
  const selectedIndex = versions.findIndex(
    v => v.versionNumber === selectedVersionNumber
  );
  const visibleVersions =
    selectedIndex === -1 || selectedIndex < maxRowCount || maxRowCount === 0
      ? versions.slice(0, maxRowCount)
      : [...versions.slice(0, maxRowCount - 1), versions[selectedIndex]];

  visibleVersions.forEach(version => {
    const isSelected = version.versionNumber === selectedVersionNumber;
    const actor = resolveVersionActor(version, createdBy);
    const isSystem = isSystemActor(actor);
    const actorLabel = isSystem ? PDF_SYSTEM_LABEL : actor;
    const versionText = String(version.versionNumber);
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

  // Truncated, rather than silently dropped: a version list long enough to
  // overflow page 1 still says so, instead of just stopping with no sign
  // anything is missing (a PDF sidebar can't scroll like the page's does).
  // Space for this was reserved above BEFORE any rows were drawn, so it's
  // safe to assume it fits — the bounds check is just a defensive fallback.
  const omittedCount = versions.length - visibleVersions.length;
  if (omittedCount > 0) {
    const noteText = `+${omittedCount} more version${omittedCount === 1 ? '' : 's'}`;
    doc.font(PDF_FONT_MEDIUM).fontSize(PDF_SIDEBAR_META_FONT_SIZE);
    const noteY = rowY + PDF_SIDEBAR_ROW_PADDING_Y;
    if (noteY + noteLineHeight <= maxRowBottom) {
      doc
        .fillColor(PDF_COLORS.muted)
        .text(noteText, x + PDF_SIDEBAR_ROW_PADDING_X, noteY, {
          lineBreak: false,
        });
      rowY = noteY + noteLineHeight + PDF_SIDEBAR_ROW_PADDING_Y;
    }
  }

  return rowY;
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
  // change-entry stacks name/date-time in a plain flex-col with no gap
  // utility of its own — the gap comes entirely from line-height.
  const textBlockHeight = nameHeight + metaHeight;
  const attributionHeight = Math.max(AVATAR_DIAMETER, textBlockHeight);

  const cardCtx: ContentCtx = {
    doc,
    x: x + PDF_CARD_PADDING,
    width: width - PDF_CARD_PADDING * 2,
    dry: true,
  };
  const cardHeight =
    renderChange(cardCtx, entry.change, 0) + PDF_CARD_PADDING * 2;

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
  const metaY = textY + nameHeight;
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

  renderChange(
    { ...cardCtx, dry: false },
    entry.change,
    cardY + PDF_CARD_PADDING
  );

  return attributionHeight + ATTRIBUTION_CARD_GAP + cardHeight;
};

const buildVersionHistoryDocument = (
  data: VacancyVersionHistoryData,
  regularFont: ArrayBuffer,
  mediumFont: ArrayBuffer,
  semiboldFont: ArrayBuffer,
  boldFont: ArrayBuffer,
  selectedVersionNumber?: number
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
  const versions = [...data.versions].sort(
    (a, b) => b.versionNumber - a.versionNumber
  );
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
  renderPdfSidebar(
    doc,
    0,
    columnTopY,
    sidebarWidth,
    versions,
    selectedVersion?.versionNumber,
    data.createdBy
  );

  // The rule marks the sidebar's edge (drawn per page in the footer pass
  // below so continuation pages don't lose it — the sidebar itself is only
  // listed on page 1). The content panel has no separate "column gap" on the
  // page — it's a plain adjacent flex sibling with its own p-7 inset on ALL
  // sides (left AND top, not just left), which PDF_CONTENT_PANEL_PADDING
  // mirrors here. The sidebar needs no equivalent top offset — it has no
  // wrapping p-7 of its own, only per-row px-7/py-5.
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
    doc
      .font(PDF_FONT_SEMIBOLD)
      .fontSize(SUMMARY_FONT_SIZE)
      .fillColor(PDF_COLORS.muted)
      .text(PDF_LABELS.noChanges, contentX, cursorY, {
        width: mainContentWidth,
      });
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
      nameHeight + metaHeight
    );
    const entryHeight =
      attributionHeight +
      ATTRIBUTION_CARD_GAP +
      renderChange(probe, entry.change, 0) +
      PDF_CARD_PADDING * 2;

    if (cursorY + entryHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      cursorY = doc.page.margins.top;
    }

    cursorY +=
      renderEntry(doc, entry, contentX, mainContentWidth, cursorY) +
      PDF_ENTRY_GAP;
  });

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
  options?: { selectedVersionNumber?: number }
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
