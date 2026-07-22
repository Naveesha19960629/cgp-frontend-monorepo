/**
 * Shared tree-walking helpers for reading the `data` map returned by
 * GET /vacancy-templates/{id}. Used by both the Edit Template mapper
 * (`vacancy-template-payload-helpers.ts`) and the Use Template mapper
 * (`vacancy-template-use-helpers.ts`), which read the same section shape
 * for two different purposes (field values vs. field visibility).
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Sections serialise as a single object or a one-item array; unwrap to the object. */
export function unwrapSection(value: unknown): Record<string, unknown> | null {
  const entry: unknown = Array.isArray(value) ? value[0] : value;
  return isRecord(entry) ? entry : null;
}

/**
 * Flattens a section `content` map into `fieldCode -> boolean`. Most fields sit
 * at the top level, but some sections nest fields inside a group array/object
 * (e.g. `profileRequirement` wraps the address fields in a `content.addresses`
 * array). We descend into nested objects/arrays and lift every leaf boolean up
 * by its field code.
 */
export function collectFieldFlags(
  node: Record<string, unknown>,
  out: Record<string, boolean>
): void {
  for (const [code, value] of Object.entries(node)) {
    if (typeof value === 'boolean') {
      out[code] = value;
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (isRecord(item)) collectFieldFlags(item, out);
      }
    } else if (isRecord(value)) {
      collectFieldFlags(value, out);
    }
  }
}
