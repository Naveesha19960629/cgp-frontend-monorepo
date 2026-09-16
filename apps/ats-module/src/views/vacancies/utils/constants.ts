import type { StatusConfig, VacancyStatus } from '@/views/vacancies/types';

const URL_PROTOCOL_HTTP = 'http://';
const URL_PROTOCOL_HTTPS = 'https://';

const DATE_DISPLAY_FORMAT = 'do MMM yyyy';

const TABLE_PAGE_SIZE = 12;

const SEARCH_DEBOUNCE_MS = 400;

const VACANCY_STATUS_CONFIG: Record<VacancyStatus, StatusConfig> = {
  draft: {
    bg: 'bg-[#f1f5f9]',
    border: 'border-[#cbd5e1]',
    text: 'text-[#475569]',
    labelKey: 'vacancies.table.filter.statusOptions.draft',
  },
  unpublished: {
    bg: 'bg-[#fff3e0]',
    border: 'border-[#fecc7e]',
    text: 'text-[#ca9239]',
    labelKey: 'vacancies.table.filter.statusOptions.unpublished',
  },
  live: {
    bg: 'bg-[#ecfdf5]',
    border: 'border-[#a7f3d0]',
    text: 'text-[#059669]',
    labelKey: 'vacancies.table.filter.statusOptions.live',
  },
  expired: {
    bg: 'bg-[rgba(51,38,3,0.09)]',
    border: 'border-[rgba(56,35,0,0.13)]',
    text: 'text-[#492503]',
    labelKey: 'vacancies.table.filter.statusOptions.expired',
  },
  on_hold: {
    bg: 'bg-[#dbeafe]',
    border: 'border-[#bfdbfe]',
    text: 'text-[#3b82f6]',
    labelKey: 'vacancies.table.filter.statusOptions.onHold',
  },
};

const VACANCY_STATUS_FALLBACK_CONFIG: StatusConfig = {
  bg: 'bg-[#f1f5f9]',
  border: 'border-[#cbd5e1]',
  text: 'text-[#475569]',
  labelKey: '',
};

// DQCGP-3866: Live/Onhold/Expired all surface the applicant count next to
// status (frozen at the onhold/expiry point for those two) — only Draft
// and Unpublished have no applicant concept yet.
const VACANCY_STATUSES_WITHOUT_APPLICANT_COUNT: readonly VacancyStatus[] = [
  'draft',
  'unpublished',
];

// pdfkit fills/strokes need raw hex, not Tailwind class strings, so these
// mirror VACANCY_STATUS_CONFIG's hex values one-for-one — keep both in sync
// when a status color changes. VACANCY_STATUS_CONFIG's `expired` bg/border
// are translucent rgba() — real CSS values a browser blends fine, but
// pdfkit's `_normalizeColor` only understands `#hex`/named-color strings; an
// rgba() string silently fails to parse, so `fillColor`/`strokeColor` become
// no-ops and the pill keeps whatever color was already set by a previous
// draw call (the reported "Expired status colour is wrong" bug). `bgOpacity`/
// `borderOpacity` reproduce the same translucency correctly via pdfkit's own
// opacity API instead — the opaque hex here is that rgba()'s color channel
// only ('#332603' = rgb(51,38,3), '#382300' = rgb(56,35,0)).
const PDF_STATUS_PILL_COLORS: Record<
  VacancyStatus,
  {
    bg: string;
    border: string;
    text: string;
    bgOpacity?: number;
    borderOpacity?: number;
  }
> = {
  draft: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
  unpublished: { bg: '#fff3e0', border: '#fecc7e', text: '#ca9239' },
  live: { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' },
  expired: {
    bg: '#332603',
    border: '#382300',
    text: '#492503',
    bgOpacity: 0.09,
    borderOpacity: 0.13,
  },
  on_hold: { bg: '#dbeafe', border: '#bfdbfe', text: '#3b82f6' },
};

const PDF_STATUS_PILL_FALLBACK_COLORS = {
  bg: '#f1f5f9',
  border: '#cbd5e1',
  text: '#475569',
};

// Design tokens carried over from the Figma "Version History" screen
// (BFyxZ6AzbRZgVvjLzRFwv3, nodes 4229-229000/229198/230400) for the
// generated PDF. These are registered-font names (see
// utils/version-history-pdf.ts), not standard PDF font names — pdfkit's
// standard-14 fonts load their metrics via fs.readFileSync, which doesn't
// exist in a browser bundle, so the real Plus Jakarta Sans (@fontsource,
// OFL-licensed) is embedded as buffers instead. See
// versionHistoryDownloadPdfAsFigma.md, Open Question 2.
const PDF_PAGE_SIZE = 'A4';
const PDF_PAGE_MARGIN = 50;
const PDF_FONT_REGULAR = 'PlusJakartaSans';
const PDF_FONT_MEDIUM = 'PlusJakartaSans-Medium';
const PDF_FONT_SEMIBOLD = 'PlusJakartaSans-SemiBold';
const PDF_FONT_BOLD = 'PlusJakartaSans-Bold';
const PDF_COLORS = {
  heading: '#0f172a',
  body: '#334155',
  muted: '#475569',
  border: '#e5e5e5',
  added: '#047857',
  removed: '#be123c',
  cardBackground: '#f8fafc',
  // The "selected version" highlight in the on-screen sidebar (Figma
  // BFyxZ6AzbRZgVvjLzRFwv3, node 4229:229403 — first/selected row uses
  // this exact bg+text pair, every other row uses `heading`/`cardBackground`
  // instead) — distinct from `added`'s emerald, not interchangeable with it.
  selectedBg: '#e6eeee',
  selectedText: '#075056',
  // Activity Log entry name text (Figma node 4229:229230) is slate/800
  // (#1e293b), a distinct shade from `heading`'s (#0f172a) — not
  // interchangeable even though they read as nearly the same color.
  attributionName: '#1e293b',
  // The "added"/"updated" value-box border in that same node is green/600
  // (#059669) while the box's title text is green/700 (`added`, #047857) —
  // two different shades used together, not one color reused for both.
  gridAccentBorder: '#059669',
  // Chip (Background/Slate/100 + Background/Slate/600) for plain
  // multi-select values — Figma's "Skills Chip" component.
  chipBackground: '#f1f5f9',
  chipText: '#475569',
  // The "previous value" box border in the before/after scalar-diff pair
  // (node 4229:229804) — neutral/300, distinct from `border`'s lighter
  // neutral/200 hairline used for plain card outlines.
  scalarDiffPreviousBorder: '#d4d4d4',
  // The before/after arrow (Figma's vuesax/linear/arrow-left, rotated —
  // nodes 4229:229804 and 4229:229630 both confirm the same dark-teal
  // brand accent, not `muted`'s neutral gray) shared by InlineDiffRow's
  // renderInlineDiff and the scalar-diff box pair's renderArrow call.
  arrow: '#075056',
  // SECTION_ENABLED's toggle switch (node 4229:229289 for "on"; "off" reuses
  // the same gray/200 the "Required Toggle Changed" example's off-state
  // toggle uses, node 4229:229985 — not the same hex as `border` even though
  // they coincide, since the two are drawn for unrelated reasons).
  toggleOnBg: '#10b981',
  toggleOffBg: '#e5e5e5',
  // "Data Taken From Candidate" checkbox (node 6536:91081 for "checked").
  // Same literal hex as `selectedText` (both are this app's dark-teal brand
  // accent, #075056) — a distinct token since the two style unrelated UI
  // elements (sidebar selected-row text vs. this checkbox's fill), not the
  // ui-kit Checkbox's own `brand-primary-500` (#0f5351), a visibly
  // different, more general-purpose shade. No Figma reference exists for
  // the unchecked state; `checkboxUncheckedBorder` is an inferred default.
  checkboxCheckedBg: '#075056',
  checkboxUncheckedBorder: '#cbd5e1',
};

// Every PDF layout metric below is the on-screen page's own Tailwind px
// value converted with ONE fixed factor: CSS px are defined as 1/96in, PDF
// pt as 1/72in, so 1px = 0.75pt exactly. Using that factor uniformly (rather
// than hand-picked "looks about right" sizes, which is how earlier rounds of
// this file drifted from the page) keeps every relative proportion — type
// hierarchy, padding-to-font ratios, icon-to-text ratios — identical between
// the two renderers; only the absolute physical size differs, because a PDF
// is a fixed page and a browser viewport isn't. Comments cite the exact web
// Tailwind class the value mirrors so a future page change has an obvious
// PDF counterpart to update.
const PX_TO_PT = 0.75;

// Sidebar version rows (Figma node 4229:229403 / version-history-sidebar.tsx):
// 29% of the content width (matching the page's `w-[29%]`) — computed from
// the actual content width at render time, not a fixed constant, since A4's
// content column is narrower than a typical desktop viewport.
const PDF_SIDEBAR_WIDTH_RATIO = 0.29;
const PDF_SIDEBAR_ROW_PADDING_X = 28 * PX_TO_PT; // px-7
const PDF_SIDEBAR_ROW_PADDING_Y = 20 * PX_TO_PT; // py-5
const PDF_SIDEBAR_VERSION_FONT_SIZE = 32 * PX_TO_PT; // text-[32px]
const PDF_SIDEBAR_META_FONT_SIZE = 14 * PX_TO_PT; // text-sm (date + actor name)
const PDF_SIDEBAR_AVATAR_DIAMETER = 20 * PX_TO_PT; // size-5
// "OCT 24, 2026" — uppercased at render time; date-fns has no upper-case
// month token.
const PDF_SIDEBAR_DATE_FORMAT = 'MMM d, yyyy';
const PDF_ENTRY_GAP = 28 * PX_TO_PT; // gap-7 (Activity Log's entry list)
const PDF_CARD_PADDING = 28 * PX_TO_PT; // p-7 (change-entry card)
const PDF_CARD_RADIUS = 8 * PX_TO_PT; // rounded-lg
const PDF_BOX_COLUMNS = 2;
const PDF_BOX_GAP = 12 * PX_TO_PT; // gap-3 (value-box-grid)
// The panel holding "Activity Log" + entries is inset from the sidebar and
// the page edges by its own p-7 — there is no separate inter-column gap in
// the page (sidebar and panel are plain adjacent flex siblings).
const PDF_CONTENT_PANEL_PADDING = 28 * PX_TO_PT; // p-7
const PDF_SYSTEM_LABEL = 'System';
const TIME_DISPLAY_FORMAT = 'h:mm a';
// Version-history change values arrive as opaque strings with no type hint,
// so date-shaped ones are detected by shape (not by field name) before being
// formatted for display — matching Figma's "12th Oct 2026, 05:00 AM". This
// is only ever used as a cheap pre-filter before the real parse/validation
// (formatChangeValue in format-date-range.ts calls parseLocalDate() next and
// falls back to the raw value if THAT fails) — so it only needs to reject
// obviously non-date strings ("AAA", "President"), not fully validate the
// time portion's exact structure. Matching the date prefix plus a loosely
// shaped optional time suffix keeps this well under the complexity limit
// that the previous attempt (nested optional groups, then an even worse
// fully-unrolled alternation) both blew past.
const ISO_DATE_LIKE_PATTERN = /^\d{4}-\d{2}-\d{2}([T ][\d:.]+)?$/;
const CHANGE_VALUE_DATE_TIME_FORMAT = `${DATE_DISPLAY_FORMAT}, ${TIME_DISPLAY_FORMAT}`;
const PDF_DATE_TIME_DISPLAY_FORMAT = `${DATE_DISPLAY_FORMAT} • ${TIME_DISPLAY_FORMAT}`;
const PDF_STATUS_DISPLAY_LABELS: Record<VacancyStatus, string> = {
  draft: 'Draft',
  unpublished: 'Unpublished',
  live: 'Live',
  expired: 'Expired',
  on_hold: 'Onhold',
};

const EMPTY_STATE_ROW_WIDTHS = [
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[220px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[250px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[200px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[240px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[230px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[210px]', rest: 'w-[141px]' },
];
const TWELVE_HOUR_TIME_REGEX = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i;
const TWENTY_FOUR_HOUR_TIME_REGEX = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

const TEMPLATE_SKELETON_COUNT = 8;

const TEMPLATES_LIST_ROUTE = '/dashboard/ats/templates';

export {
  URL_PROTOCOL_HTTP,
  URL_PROTOCOL_HTTPS,
  DATE_DISPLAY_FORMAT,
  TABLE_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  VACANCY_STATUS_CONFIG,
  VACANCY_STATUS_FALLBACK_CONFIG,
  VACANCY_STATUSES_WITHOUT_APPLICANT_COUNT,
  PDF_STATUS_PILL_COLORS,
  PDF_STATUS_PILL_FALLBACK_COLORS,
  PDF_PAGE_SIZE,
  PDF_PAGE_MARGIN,
  PDF_FONT_REGULAR,
  PDF_FONT_MEDIUM,
  PDF_FONT_SEMIBOLD,
  PDF_FONT_BOLD,
  PDF_COLORS,
  PX_TO_PT,
  PDF_SIDEBAR_WIDTH_RATIO,
  PDF_SIDEBAR_ROW_PADDING_X,
  PDF_SIDEBAR_ROW_PADDING_Y,
  PDF_SIDEBAR_VERSION_FONT_SIZE,
  PDF_SIDEBAR_META_FONT_SIZE,
  PDF_SIDEBAR_AVATAR_DIAMETER,
  PDF_SIDEBAR_DATE_FORMAT,
  PDF_ENTRY_GAP,
  PDF_CARD_PADDING,
  PDF_CARD_RADIUS,
  PDF_BOX_COLUMNS,
  PDF_BOX_GAP,
  PDF_CONTENT_PANEL_PADDING,
  PDF_SYSTEM_LABEL,
  TIME_DISPLAY_FORMAT,
  ISO_DATE_LIKE_PATTERN,
  CHANGE_VALUE_DATE_TIME_FORMAT,
  PDF_DATE_TIME_DISPLAY_FORMAT,
  PDF_STATUS_DISPLAY_LABELS,
  EMPTY_STATE_ROW_WIDTHS,
  TWELVE_HOUR_TIME_REGEX,
  TWENTY_FOUR_HOUR_TIME_REGEX,
  TEMPLATE_SKELETON_COUNT,
  TEMPLATES_LIST_ROUTE,
};
