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
    // quota / private mode
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
    return undefined;
  }
}
