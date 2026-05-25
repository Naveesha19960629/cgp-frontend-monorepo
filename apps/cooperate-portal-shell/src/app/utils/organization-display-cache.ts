/**
 * Persist org display labels by id when the API returns only `{ id, source }`.
 * Used by honours/project forms on edit.
 */
const STORAGE_PREFIX = 'cooperate-portal:org-display:';

export function rememberOrganizationDisplayName(
  organizationId: string,
  displayName: string
): void {
  if (!organizationId || !displayName.trim()) return;
  try {
    sessionStorage.setItem(
      `${STORAGE_PREFIX}${organizationId}`,
      displayName.trim()
    );
  } catch {
    // Silently fail if sessionStorage is unavailable (private/incognito mode)
    // or storage quota is exceeded. This is non-critical caching functionality.
  }
}

export function getRememberedOrganizationDisplayName(
  organizationId: string
): string | undefined {
  if (!organizationId) return undefined;
  try {
    const v = sessionStorage.getItem(`${STORAGE_PREFIX}${organizationId}`);
    return v?.trim() || undefined;
  } catch {
    // Silently fail if sessionStorage is unavailable (private/incognito mode)
    return undefined;
  }
}
