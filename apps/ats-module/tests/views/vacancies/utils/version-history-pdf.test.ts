// @vitest-environment node
//
// jsdom provides its own Uint8Array/ArrayBuffer globals in a separate realm
// from Node's native ones, so `Buffer.from(arrayBuffer) instanceof Uint8Array`
// evaluates to false there even for a genuinely valid buffer — which is
// exactly the check pdfkit's font loader uses, so every embedded-font call
// throws "Not a supported font format" under jsdom. Real single-realm
// browsers don't have this problem, and neither does plain Node, so this
// file skips jsdom entirely (tests/setup.ts no-ops for non-DOM environments).
import { buildVersionHistoryPdfBlob } from '@/views/vacancies/utils/version-history-pdf';

import * as fontkitModule from 'fontkit';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { inflateSync } from 'zlib';

// fontkit has no published types (`@types/fontkit` doesn't exist) — see
// tests/fontkit.d.ts for the ambient module declaration that silences
// TS7016 on the import above; the actual shape this test relies on is the
// narrower FontkitModule/FontkitFont below.
type FontkitFont = {
  numGlyphs: number;
  getGlyph: (id: number) => { path: { commands: unknown[] } };
};
type FontkitModule = { create: (buffer: Buffer) => FontkitFont };

// fontkit's CJS/ESM interop doesn't consistently expose a default export
// across Vitest's transform pipeline — fall back to the namespace itself.
const fontkit: FontkitModule =
  (fontkitModule as unknown as { default?: FontkitModule }).default ??
  fontkitModule;

const readPdfPageTexts = async (blob: Blob): Promise<string[]> => {
  const data = new Uint8Array(await blob.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items.map(item => ('str' in item ? item.str : '')).join('')
    );
  }
  return pages;
};

// A PDF can have a valid `%PDF-` header, correct page count, and even
// correct pdf.js getTextContent() output while the embedded font's glyph
// *outlines* are silently corrupted — pdfkit's WOFF2 subsetting once hit
// exactly this in this app's Vite pipeline (see
// versionHistoryDownloadPdfAsFigma.md and the comment above loadFontBuffer
// in version-history-pdf.ts). getTextContent() can't catch that class of
// bug because it reads position/CMap metadata, not glyph outlines — so this
// re-parses every embedded FontFile2 stream with a real TrueType parser and
// checks that non-space glyphs actually have outline data.
const extractEmbeddedFontPrograms = (pdfBytes: Uint8Array): Buffer[] => {
  const buf = Buffer.from(pdfBytes);
  const programs: Buffer[] = [];
  const fontFileRefs = buf
    .toString('latin1')
    .matchAll(/\/FontFile2\s+(\d+)\s+0\s+R/g);

  for (const ref of fontFileRefs) {
    const objId = ref[1];
    const objMarker = Buffer.from(`\n${objId} 0 obj`);
    const objStart = buf.indexOf(objMarker);
    const dictEnd = buf.indexOf(Buffer.from('>>'), objStart);
    const dict = buf.subarray(objStart, dictEnd).toString('latin1');
    const streamKeyword = buf.indexOf(Buffer.from('stream'), dictEnd);
    let dataStart = streamKeyword + 'stream'.length;
    if (buf[dataStart] === 0x0d) dataStart++;
    if (buf[dataStart] === 0x0a) dataStart++;
    const streamEnd = buf.indexOf(Buffer.from('endstream'), dataStart);
    let dataEnd = streamEnd;
    if (buf[dataEnd - 1] === 0x0a) dataEnd--;
    if (buf[dataEnd - 1] === 0x0d) dataEnd--;

    const raw = buf.subarray(dataStart, dataEnd);
    programs.push(
      /\/FlateDecode/.test(dict) ? inflateSync(raw) : Buffer.from(raw)
    );
  }

  return programs;
};

// Decompresses every FlateDecode content stream in the PDF and concatenates
// their raw operator text — used to assert on fill/rect drawing operators
// that pdf.js's own APIs don't expose (it reads text/position, not the
// underlying paint operators). Streams are located via their declared
// `/Length` rather than scanning for `endstream`, since compressed binary
// data can itself coincidentally contain that byte sequence.
const extractContentStreamOperators = (pdfBytes: Uint8Array): string => {
  const buf = Buffer.from(pdfBytes);
  const text = buf.toString('latin1');
  const objRe = /(\d+) 0 obj\s*<<([\s\S]*?)>>\s*stream\r?\n/g;
  let operators = '';
  let match;
  while ((match = objRe.exec(text))) {
    const dict = match[2];
    if (!/FlateDecode/.test(dict)) continue;
    const lengthMatch = dict.match(/\/Length\s+(\d+)/);
    if (!lengthMatch) continue;
    const length = Number(lengthMatch[1]);
    const dataStart = match.index + match[0].length;
    const raw = buf.subarray(dataStart, dataStart + length);
    try {
      operators += inflateSync(raw).toString('latin1');
    } catch {
      // Not a content stream (e.g. an embedded font program that also
      // happens to use FlateDecode) — skip it.
    }
  }
  return operators;
};

// jsdom/Vitest resolve the `?url` font imports to a dev-server path
// (`/@fs/...`) rather than a fetchable URL, so `fetch()` is stubbed here to
// serve the real font bytes straight off disk — this still exercises the
// real pdfkit/fontkit font-embedding and PDF-generation code, just without
// needing a live asset server (the actual browser-bundling behavior was
// separately verified against the real Vite pipeline — see
// versionHistoryDownloadPdfAsFigma.md, Step 3).
const require = createRequire(import.meta.url);
const regularFontPath =
  require.resolve('@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff');
const mediumFontPath =
  require.resolve('@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff');
const semiboldFontPath =
  require.resolve('@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff');
const boldFontPath =
  require.resolve('@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff');

type FontFetchResponse = {
  ok: boolean;
  status?: number;
  statusText?: string;
  arrayBuffer?: () => Promise<ArrayBuffer>;
};

const fetchFontMock = vi.fn((url: string): Promise<FontFetchResponse> => {
  const path = url.includes('700-normal')
    ? boldFontPath
    : url.includes('600-normal')
      ? semiboldFontPath
      : url.includes('500-normal')
        ? mediumFontPath
        : regularFontPath;
  const buffer = readFileSync(path);
  return Promise.resolve({
    ok: true,
    arrayBuffer: () =>
      Promise.resolve(
        buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        )
      ),
  });
});
vi.stubGlobal('fetch', fetchFontMock);

const sampleData = {
  vacancyTitle: 'Vice President',
  status: 'ONHOLD',
  createdAt: '2026-07-07T20:04:24.850555',
  createdBy: 'sahanlmsl@gmail.com',
  lastUpdatedAt: '2026-07-07T21:40:43.804959',
  totalVersions: 1,
  versions: [
    {
      versionNumber: 1,
      updatedAt: '2026-07-07T20:08:00.032322',
      updatedBy: 'SYSTEM',
      profilePicture: null,
      changes: {
        user: [
          {
            changeType: 'VACANCY_CREATED' as const,
            sectionName: 'Vacancy',
            fieldName: 'Title',
            oldValue: null,
            newValue: ['Vice President'],
          },
        ],
        system: [
          {
            changeType: 'STATUS_CHANGED' as const,
            sectionName: 'Vacancy',
            fieldName: 'Status',
            oldValue: ['ONHOLD'],
            newValue: ['LIVE'],
          },
        ],
      },
    },
  ],
};

describe('buildVersionHistoryPdfBlob', () => {
  it('produces a non-empty application/pdf blob', async () => {
    const blob = await buildVersionHistoryPdfBlob(sampleData);

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('throws a clear, actionable error on a failed font fetch, and does not permanently cache the failure', async () => {
    // Regression test: fetch() resolves successfully even for a 404 — a
    // failed/wrong font URL used to hand the error response's bytes to
    // pdfkit as if they were real font data, which failed much later with
    // an opaque "Unknown font format" thrown deep inside fontkit's format
    // sniffing (no indication which of the 4 fonts, or why) — reported live
    // from what looks like a stale build/deploy referencing a font asset
    // hash the server no longer has. Loading the font buffers via a fresh
    // module instance (vi.resetModules) so this test exercises its own,
    // still-empty fontBufferCache rather than one already warmed by an
    // earlier test in this file.
    vi.resetModules();
    fetchFontMock.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' })
    );
    const { buildVersionHistoryPdfBlob: freshBuild } =
      await import('@/views/vacancies/utils/version-history-pdf');

    await expect(freshBuild(sampleData)).rejects.toThrow(
      /Failed to load PDF font ".*": 404 Not Found/
    );

    // A rejected fetch must not stay cached — the SAME (fresh) module
    // instance can still succeed on a later attempt, rather than replaying
    // the same cached rejection forever and permanently breaking every
    // subsequent Download click for the rest of the page's lifetime.
    const blob = await freshBuild(sampleData);
    expect(blob.type).toBe('application/pdf');
  });

  it('uses a landscape page — the two-column dashboard layout is too wide for portrait', async () => {
    const blob = await buildVersionHistoryPdfBlob(sampleData);
    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(await blob.arrayBuffer()),
    }).promise;
    const page = await doc.getPage(1);
    const [, , width, height] = page.view;

    expect(width).toBeGreaterThan(height);
    // A4 landscape: 841.89 x 595.28pt.
    expect(width).toBeCloseTo(841.89, 0);
    expect(height).toBeCloseTo(595.28, 0);
  });

  it("fills the header with the page's own background color, not the default white canvas", async () => {
    // Regression test: the header previously drew its text directly on the
    // page's default white background — bg-[#f8fafc] on the on-screen page
    // was never reproduced at all, not just the wrong shade.
    const blob = await buildVersionHistoryPdfBlob(sampleData);
    const operators = extractContentStreamOperators(
      new Uint8Array(await blob.arrayBuffer())
    );

    // #f8fafc as fractional DeviceRGB components (248/255, 250/255, 252/255).
    const headerFillColor = /0\.972\d* 0\.980\d* 0\.988\d* scn\s*\nf\n/;
    expect(operators).toMatch(headerFillColor);
    // The fill rect starts at the page's own left/top edge (0 0) and spans
    // the full page width — the header is a full-bleed banner on the page,
    // not inset within the document's print margins.
    expect(operators).toMatch(/0 0 841\.89 [\d.]+ re/);
  });

  it("sizes the header to match Figma's exact frame height, not the print margin", async () => {
    // Regression test: the breadcrumb's y-position started at doc.y's
    // default initial value (PDF_PAGE_MARGIN, 50pt) instead of the header's
    // own top padding (HEADER_PADDING, 21pt) — the same class of bug already
    // fixed for the left edge (marginLeft), just never applied to the top —
    // leaving ~29pt of extra space above "Version History" that the
    // on-screen page doesn't have (reported live as "extra space" in the
    // header). Figma's header frame (node 4229:229002) is 196px tall;
    // 196 * 0.75 (PX_TO_PT) = 147pt exactly, so the header's fill-rect
    // height should land at (not near-double) that value.
    const blob = await buildVersionHistoryPdfBlob(sampleData);
    const operators = extractContentStreamOperators(
      new Uint8Array(await blob.arrayBuffer())
    );
    const fillRectMatch = operators.match(/0 0 841\.89 ([\d.]+) re/);
    expect(fillRectMatch).not.toBeNull();
    const headerHeight = Number(fillRectMatch?.[1]);
    expect(headerHeight).toBeGreaterThan(140);
    expect(headerHeight).toBeLessThan(155);
  });

  it("extends the sidebar's selected-row highlight to the page's true left edge, not the print margin", async () => {
    // Regression test: the sidebar previously started at the same inset as
    // the header's text (the page's print margin), leaving a visible blank
    // strip before it that the on-screen sidebar — flush against the
    // browser viewport's left edge — never has.
    const blob = await buildVersionHistoryPdfBlob(sampleData, {
      selectedVersionNumber: sampleData.versions[0].versionNumber,
    });
    const operators = extractContentStreamOperators(
      new Uint8Array(await blob.arrayBuffer())
    );

    // #e6eeee (the selected-row teal) as fractional DeviceRGB components.
    const selectedRowRect =
      /0 [\d.]+ [\d.]+ [\d.]+ re\s*\/DeviceRGB cs\s*0\.901\d* 0\.933\d* 0\.933\d* scn/;
    expect(operators).toMatch(selectedRowRect);
  });

  it('aligns the header text with the sidebar version number on one shared left edge', async () => {
    // Regression test: the header's breadcrumb/title/meta used the page's
    // print margin (50pt) while the sidebar row used the page's own p-7
    // inset (21pt) — same left edge on the on-screen page, but two different
    // x-positions in the PDF, so the header text sat visibly further right
    // than the version number directly below it.
    const blob = await buildVersionHistoryPdfBlob(sampleData);
    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(await blob.arrayBuffer()),
    }).promise;
    const content = await (await doc.getPage(1)).getTextContent();
    const xOf = (str: string): number => {
      const item = content.items.find(i => 'str' in i && i.str === str);
      if (!item || !('transform' in item)) {
        throw new Error(`"${str}" not found on page 1`);
      }
      const transform: number[] = item.transform;
      return transform[4];
    };

    expect(xOf('Version History')).toBe(xOf(sampleData.vacancyTitle));
    expect(xOf('Version History')).toBe(
      xOf(String(sampleData.versions[0].versionNumber))
    );
  });

  it('renders a generic field-value update as a before/after box pair with captions', async () => {
    // Regression test: a generic FIELD_VALUE_UPDATED scalar diff (anything
    // other than the vacancy-level status/title/schedule/expiration fields,
    // which keep the compact renderInlineDiff) used the same compact
    // before-struck-through/after single line — Figma's "Question Text
    // Updated" / "Option Value Updated" pattern (node 4229:229804) instead
    // draws two side-by-side boxes captioned "Previous {field}" / "Updated
    // {field}".
    const blob = await buildVersionHistoryPdfBlob({
      ...sampleData,
      versions: [
        {
          versionNumber: 1,
          updatedAt: '2026-07-07T20:08:00.032322',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'FIELD_VALUE_UPDATED' as const,
                sectionName: 'Secondary Education',
                fieldName: 'Grade',
                oldValue: ['AAA'],
                newValue: ['XXX'],
              },
            ],
            system: [],
          },
        },
      ],
    });
    const pages = await readPdfPageTexts(blob);

    expect(pages[0]).toContain('Previous Grade');
    expect(pages[0]).toContain('Updated Grade');
    expect(pages[0]).toContain('AAA');
    expect(pages[0]).toContain('XXX');
  });

  it('renders every changeType/value-shape combination without throwing', async () => {
    const data = {
      vacancyTitle: 'Vice President',
      status: 'ONHOLD',
      createdAt: '2026-07-07T20:04:24.850555',
      createdBy: 'sahanlmsl@gmail.com',
      lastUpdatedAt: '2026-07-07T21:40:43.804959',
      totalVersions: 2,
      versions: [
        {
          versionNumber: 2,
          updatedAt: '2026-07-07T21:40:43.804959',
          updatedBy: 'sahanlmsl@gmail.com',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'STATUS_CHANGED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['LIVE'],
                newValue: ['ONHOLD'],
              },
              {
                changeType: 'FIELD_VALUE_UPDATED' as const,
                sectionName: 'Secondary Education',
                fieldName: 'Grade',
                oldValue: ['AAA'],
                newValue: ['XXX'],
              },
              {
                changeType: 'FIELD_VALUE_ADDED' as const,
                sectionName: 'Secondary Education',
                fieldName: 'School',
                oldValue: null,
                newValue: [
                  {
                    school: 'Royal College, Colombo',
                    schoolLocation: 'Colombo',
                  },
                  { school: 'Trinity College, Kandy', schoolLocation: null },
                ],
              },
              {
                changeType: 'FIELD_VALUE_REMOVED' as const,
                sectionName: 'Secondary Education',
                fieldName: 'Examination',
                oldValue: ['IELTS'],
                newValue: null,
              },
            ],
            system: [],
          },
        },
        {
          versionNumber: 1,
          updatedAt: '2026-07-07T20:08:00.032322',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'VACANCY_CREATED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Title',
                oldValue: null,
                newValue: ['Vice President'],
              },
            ],
            system: [
              {
                changeType: 'STATUS_CHANGED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['ONHOLD'],
                newValue: ['LIVE'],
              },
            ],
          },
        },
      ],
    };

    const blob = await buildVersionHistoryPdfBlob(data);

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('renders a version with no tracked changes without throwing', async () => {
    const blob = await buildVersionHistoryPdfBlob({
      ...sampleData,
      versions: [
        {
          versionNumber: 1,
          updatedAt: '2026-07-07T20:08:00.032322',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: { user: [], system: [] },
        },
      ],
    });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('does not create a stray blank trailing page for the page-number footer', async () => {
    // Regression test: the footer is drawn inside the bottom margin by
    // design, but pdfkit auto-paginates any text call whose y position would
    // exceed page.maxY() (height - margins.bottom) — so without zeroing the
    // margin first, every generated PDF gained an extra, otherwise-blank
    // page containing only the footer text, which is what made the "PDF
    // looks empty" report reproduce.
    const blob = await buildVersionHistoryPdfBlob(sampleData);
    const pages = await readPdfPageTexts(blob);

    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain('Vice President');
    expect(pages[0]).toContain('Page 1 of 1');
  });

  it("lists every version in the sidebar but only expands the selected one's Activity Log", async () => {
    const data = {
      ...sampleData,
      totalVersions: 2,
      versions: [
        {
          versionNumber: 2,
          updatedAt: '2026-07-07T21:40:43.804959',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [],
            system: [
              {
                changeType: 'STATUS_CHANGED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['LIVE'],
                newValue: ['ONHOLD'],
              },
            ],
          },
        },
        {
          versionNumber: 1,
          // Deliberately a different day from version 2 so the two sidebar
          // rows are distinguishable by their (uppercase) dates — the rows
          // themselves show a bare version number, as in Figma.
          updatedAt: '2026-06-05T20:08:00.032322',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'VACANCY_CREATED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Title',
                oldValue: null,
                newValue: ['Vice President'],
              },
            ],
            system: [],
          },
        },
      ],
    };

    const blob = await buildVersionHistoryPdfBlob(data, {
      selectedVersionNumber: 1,
    });
    const pages = await readPdfPageTexts(blob);

    // Both versions appear in the sidebar list...
    expect(pages[0]).toContain('JUL 7, 2026');
    expect(pages[0]).toContain('JUN 5, 2026');
    expect(pages[0]).toContain('Activity Log');
    // ...but only version 1's change (the selected one) is expanded.
    expect(pages[0]).toContain('Created Title');
    expect(pages[0]).toContain('Vice President');
    expect(pages[0]).not.toContain('Vacancy status transitioned from');
  });

  // A vacancy edited many times overflows the sidebar past what fits on
  // page 1 (each row is the on-screen page's own generous font/padding
  // scale, so roughly 4-5 rows fit on an A4-landscape page). Every row is
  // the same fixed height, so this many versions is guaranteed to overflow
  // regardless of exact font-metric rounding in the test environment.
  const manyVersions = Array.from({ length: 15 }, (_, i) => {
    const versionNumber = i + 1;
    return {
      versionNumber,
      updatedAt: new Date(2026, i, 5, 10, 0, 0).toISOString(),
      updatedBy: 'sahanlmsl@gmail.com',
      profilePicture: null,
      changes: {
        user:
          versionNumber === 1
            ? [
                {
                  changeType: 'VACANCY_CREATED' as const,
                  sectionName: 'Vacancy',
                  fieldName: 'Title',
                  oldValue: null,
                  newValue: ['Vice President'],
                },
              ]
            : versionNumber === 15
              ? [
                  {
                    changeType: 'FIELD_VALUE_REMOVED' as const,
                    sectionName: 'Secondary Education',
                    fieldName: 'School',
                    oldValue: [
                      { school: 'Ananda College', schoolLocation: 'Colombo' },
                    ],
                    newValue: null,
                  },
                ]
              : [],
        system: [],
      },
    };
  });

  it('renders the Activity Log on page 1 even when enough versions overflow the sidebar', async () => {
    // Regression test: pdfkit silently inserts a whole new page whenever a
    // .text() call's y position would exceed page.maxY() — renderPdfSidebar
    // drew every version unconditionally with no bound on how far rowY grew,
    // so a long enough version list scattered sidebar fragments across
    // several near-blank pages and left the Activity Log itself stranded on
    // whatever page pdfkit's pointer had reached by then. Reported live: a
    // 6-version vacancy pushed its Activity Log entry onto page 5 of 5.
    const blob = await buildVersionHistoryPdfBlob(
      {
        ...sampleData,
        totalVersions: manyVersions.length,
        versions: manyVersions,
      },
      { selectedVersionNumber: 15 }
    );
    const pages = await readPdfPageTexts(blob);

    expect(pages[0]).toContain('Activity Log');
    expect(pages[0]).toContain('Removed 1 School');
    expect(pages[0]).toContain('Ananda College');
    // The overflowing versions are called out, not silently dropped.
    expect(pages[0]).toMatch(/\+\d+ more versions?/);
  });

  it("keeps an older selected version's sidebar row visible even when it would otherwise be truncated", async () => {
    // Regression test: a naive "first N by recency" cut of the sidebar would
    // drop version 1's row entirely once 15 newer versions fill the page,
    // leaving the downloaded/selected version's row (and its teal highlight)
    // completely absent from its own PDF.
    const blob = await buildVersionHistoryPdfBlob(
      {
        ...sampleData,
        totalVersions: manyVersions.length,
        versions: manyVersions,
      },
      { selectedVersionNumber: 1 }
    );
    const pages = await readPdfPageTexts(blob);

    expect(pages[0]).toContain('Activity Log');
    expect(pages[0]).toContain('Created Title');
    expect(pages[0]).toContain('Vice President');
  });

  it('defaults to the latest version when no selectedVersionNumber is given', async () => {
    const data = {
      ...sampleData,
      totalVersions: 2,
      versions: [
        {
          versionNumber: 2,
          updatedAt: '2026-07-07T21:40:43.804959',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [],
            system: [
              {
                changeType: 'STATUS_CHANGED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['LIVE'],
                newValue: ['ONHOLD'],
              },
            ],
          },
        },
        {
          versionNumber: 1,
          updatedAt: '2026-07-07T20:08:00.032322',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'VACANCY_CREATED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Title',
                oldValue: null,
                newValue: ['Vice President'],
              },
            ],
            system: [],
          },
        },
      ],
    };

    const blob = await buildVersionHistoryPdfBlob(data);
    const pages = await readPdfPageTexts(blob);

    expect(pages[0]).toContain('Vacancy status transitioned from');
    expect(pages[0]).not.toContain('Created Title');
  });

  it('handles a real 4-version API response: user vs system attribution, long/null values, no throw', async () => {
    // Real GET /vacancies/:id/version-histories response (requestId
    // 4f82a6d1-9a3b-4e92-b9a7-1f3c9b8e4d21) — exercises shapes the synthetic
    // fixtures above don't: a "user" array attributed to a real updatedBy
    // (an email — the API has no separate display-name field, so the
    // email is shown as-is; see [[vacancy-version-history-pdf]]) on the
    // SAME version that also has "system" changes, a FIELD_VALUE_REMOVED
    // with a 3-item object array (very long school names, null
    // schoolLocation), and date-shaped field values ("Start Date" etc.)
    // rendered as plain strings since the API gives no type hint that
    // they're dates.
    const realApiResponseData = {
      vacancyTitle: 'Vice President',
      status: 'ONHOLD',
      createdAt: '2026-07-07T20:04:24.850555',
      createdBy: 'sahanlmsl@gmail.com',
      lastUpdatedAt: '2026-07-07T21:40:43.804959',
      totalVersions: 4,
      versions: [
        {
          versionNumber: 4,
          updatedAt: '2026-07-07T21:40:43.804959',
          updatedBy: 'sahanlmsl@gmail.com',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'FIELD_VALUE_UPDATED' as const,
                sectionName: 'Secondary Education',
                fieldName: 'Grade',
                oldValue: ['AAA'],
                newValue: ['XXX'],
              },
              {
                changeType: 'FIELD_VALUE_UPDATED' as const,
                sectionName: 'Secondary Education',
                fieldName: 'Start Date',
                oldValue: ['2026-06-09'],
                newValue: ['2024-06-09'],
              },
              {
                changeType: 'FIELD_VALUE_REMOVED' as const,
                sectionName: 'Secondary Education',
                fieldName: 'School',
                oldValue: [
                  {
                    school:
                      'Maliyadewa, one of the most prestigious educational institutions in Sri Lanka, known for its excellence in academic achievements, extracurricular activities, leadership development, and prod',
                    schoolLocation: null,
                  },
                  {
                    school: 'Royal College 2, Colombo, Sri Lanka',
                    schoolLocation: null,
                  },
                ],
                newValue: null,
              },
            ],
            system: [],
          },
        },
        {
          versionNumber: 2,
          updatedAt: '2026-07-07T20:55:43.071146',
          updatedBy: 'sahanlmsl@gmail.com',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'STATUS_CHANGED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['LIVE'],
                newValue: ['ONHOLD'],
              },
            ],
            system: [],
          },
        },
        {
          versionNumber: 1,
          updatedAt: '2026-07-07T20:08:00.032322',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'VACANCY_CREATED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Title',
                oldValue: null,
                newValue: ['Vice President'],
              },
            ],
            // Version 1's "user" changes are also attributed to SYSTEM
            // below — updatedBy is the actor for the whole version, and
            // here that actor is the system, not a person, even though
            // the changes are filed under the "user" key (which
            // distinguishes direct field edits from side-effect changes,
            // not who/what performed them).
            system: [
              {
                changeType: 'STATUS_CHANGED' as const,
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['ONHOLD'],
                newValue: ['LIVE'],
              },
            ],
          },
        },
      ],
    };

    // Version 4 (the latest) is selected — its "user" entries must be
    // attributed to the real updatedBy email, not "System".
    const blob = await buildVersionHistoryPdfBlob(realApiResponseData, {
      selectedVersionNumber: 4,
    });
    const pages = await readPdfPageTexts(blob);

    // pdf.js's text extraction joins wrapped-line fragments with no
    // separator, so a long/multi-line title (like the long school names
    // here) can lose the space that was visually at the wrap point — that's
    // an artifact of extraction, not a real rendering bug, so assertions
    // below stick to short substrings unlikely to straddle a wrap boundary.
    // The full document (not just page 1) is checked: matching the page's
    // generous type scale means fewer entries fit per page, so which page a
    // given entry lands on is expected to shift as that scale changes.
    const allText = pages.join('\n');
    expect(allText).toContain('sahanlmsl@gmail.com');
    expect(allText).not.toContain('SystemAAA');
    // The field name is pluralized into the summary ("School" -> "Schools").
    expect(allText).toContain('Removed 2 Schools');
    expect(allText).toContain('Royal College 2');
    // Not "Sri Lanka" — the wider box padding used to match the page shifted
    // this school name's wrap point to fall between "Sri" and "Lanka",
    // which pdf.js's extraction joins with no space at wrap boundaries (a
    // known artifact of the test helper, not a rendering bug).
    expect(allText).toContain('Colombo');
    // Sidebar lists every version regardless of which one is expanded — rows
    // are identified by their uppercase dates, since Figma's row heading is a
    // bare version number. The sidebar itself only ever renders on page 1.
    expect(pages[0]).toContain('JUL 7, 2026');

    // Version 1 is recorded with updatedBy: "SYSTEM" (the Draft/Schedule flow
    // wrote it) but its changes.user entries were performed by the recruiter,
    // so they must be attributed to the vacancy's createdBy — only the
    // automatic status transition under changes.system reads as "System".
    const version1Blob = await buildVersionHistoryPdfBlob(realApiResponseData, {
      selectedVersionNumber: 1,
    });
    const version1Pages = await readPdfPageTexts(version1Blob);
    expect(version1Pages[0]).toContain('System');
    expect(version1Pages[0]).toContain('sahanlmsl@gmail.com');
    expect(version1Pages[0]).toContain('Created Title');
    expect(version1Pages[0]).toContain('Vice President');
    expect(version1Pages[0]).toContain('Vacancy status transitioned from');
  });

  it('renders every value of a multi-item plain-array change, not just the first', async () => {
    // Regression test: getSingleScalar() only ever reads the first array
    // element, so a plain (non-object) array change with more than one
    // value — e.g. a multi-select "Causes" field — used to silently drop
    // every value but the first unless the array happened to hold objects.
    const blob = await buildVersionHistoryPdfBlob({
      ...sampleData,
      versions: [
        {
          versionNumber: 1,
          updatedAt: '2026-07-07T20:08:00.032322',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'FIELD_VALUE_UPDATED' as const,
                sectionName: 'Causes',
                fieldName: 'Causes',
                oldValue: null,
                newValue: ['Animal Welfare', 'Arts and Culture'],
              },
            ],
            system: [],
          },
        },
      ],
    });
    const pages = await readPdfPageTexts(blob);

    expect(pages[0]).toContain('Animal Welfare');
    expect(pages[0]).toContain('Arts and Culture');
  });

  it('embeds fonts whose glyphs have real outline data, not just correct text extraction', async () => {
    const blob = await buildVersionHistoryPdfBlob(sampleData);
    const programs = extractEmbeddedFontPrograms(
      new Uint8Array(await blob.arrayBuffer())
    );

    expect(programs.length).toBeGreaterThan(0);

    for (const program of programs) {
      const font = fontkit.create(program);
      expect(font.numGlyphs).toBeGreaterThan(0);

      let glyphsWithOutlines = 0;
      for (let glyphId = 0; glyphId < font.numGlyphs; glyphId++) {
        // Some glyphs (space, .notdef) legitimately have zero contours —
        // this doesn't throw for those, only for genuinely corrupted data.
        const { commands } = font.getGlyph(glyphId).path;
        if (commands.length > 0) glyphsWithOutlines++;
      }

      expect(glyphsWithOutlines).toBeGreaterThan(0);
    }
  });
});
