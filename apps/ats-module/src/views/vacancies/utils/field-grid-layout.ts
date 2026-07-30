/**
 * Row-placement helper for the vacancy form-step field grids.
 *
 * Every entry card lays its fields out in a single `xl:grid-cols-4` grid where
 * each field spans 1 (quarter), 2 (half) or 4 (full) columns. The design rule
 * (from Figma ATS-Handover) for how visible fields pack:
 *
 *  1. A row that STARTS with a full/half-width field imposes no constraint —
 *     any mix of fields may follow it (free-flow), e.g. `Title(¼) ·
 *     IssuedFrom(¼) · OrgLocation(½)` all share one row.
 *  2. Quarter-then-quarter stays on the same row.
 *  3. A half/full-width field must never STRADDLE — it may only begin at an
 *     even column boundary (column 1 or 3), never column 2. So a half/full that
 *     would land right after a *single* leading quarter (at column 2) wraps to
 *     the next row; after *two* quarters (at column 3) it stays.
 *
 * `computeRowStartCodes` simulates that placement over the *visible* fields (in
 * source order) and returns the set of field codes that must be given
 * `xl:col-start-1` so they wrap to a fresh row. Fields that wrap naturally
 * (because they don't fit the remaining columns) are NOT included — they don't
 * need an explicit column start.
 */
export interface GridFieldSpec {
  /** Field code as passed to `useTemplateFieldVisible(section)(code)`. */
  code: string;
  /** Column span in the 4-column `xl` grid. */
  span: 1 | 2 | 4;
}

export function computeRowStartCodes(
  fields: readonly GridFieldSpec[],
  isVisible: (code: string) => boolean
): Set<string> {
  const forced = new Set<string>();
  let col = 0; // columns filled in the current row (0-4)

  for (const { code, span } of fields) {
    if (!isVisible(code)) continue;

    // Natural wrap: doesn't fit the remaining columns of the current row.
    if (col > 0 && col + span > 4) col = 0;

    // Straddle guard: a half/full field may not begin at column 2 (i.e. right
    // after a single leading quarter) — it must wrap to the next row.
    if (span >= 2 && col === 1) {
      forced.add(code);
      col = 0;
    }

    col += span;
    if (col >= 4) col = 0;
  }

  return forced;
}
