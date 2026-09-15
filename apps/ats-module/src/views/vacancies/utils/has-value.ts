/**
 * Whether a View Vacancy field has data worth displaying. Used to decide
 * whether a field (label + value) should be rendered at all in the read-only
 * View Vacancy / View Forms screens — per CR-10, a field with no data is
 * hidden entirely rather than shown with a placeholder.
 *
 * - `null`/`undefined` -> false
 * - an empty or whitespace-only string -> false
 * - an empty array -> false
 * - anything else (non-empty string, non-empty array, other truthy values) -> true
 */
function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export { hasValue };
