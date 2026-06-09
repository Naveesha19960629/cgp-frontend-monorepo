import type { FieldErrors, FieldValues } from 'react-hook-form';

import type { QueryClient } from '@tanstack/react-query';

import type {
  LocationOption,
  OrganizationSelectOptions,
} from '../types/organization';

const WHITESPACE_PATTERN = /\s/;
const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;
const HTTPS_PROTOCOL_STRICT_PATTERN = /^https?:$/;
const VALID_HOSTNAME_PATTERN = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

/**
 * Scrolls to the first error field in a form
 */
export function scrollToFirstError<T extends FieldValues>(
  errors: FieldErrors<T>
) {
  const firstErrorKey = Object.keys(errors)[0];
  if (!firstErrorKey) return;

  requestAnimationFrame(() => {
    const el = document.querySelector(`[name="${firstErrorKey}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el instanceof HTMLElement) el.focus();
    } else {
      const errorEl = document.querySelector('[data-slot="form-message"]');
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

/**
 * Validates if a URL starts with http:// or https:// (or is empty/undefined)
 */
export function isUrlProtocolValid(url: string | undefined): boolean {
  if (!url) return true;
  return HTTP_PROTOCOL_PATTERN.test(url);
}

/**
 * Validates if a URL is a valid web address (parseable with a valid hostname)
 */
export function isUrlFormatValid(url: string | undefined): boolean {
  if (!url) return true;
  if (WHITESPACE_PATTERN.test(url)) return false;

  try {
    const u = new URL(url);
    if (!VALID_HOSTNAME_PATTERN.test(u.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a URL is valid (with proper protocol and format)
 */
export function isUrlValid(url: string | undefined): boolean {
  // Delegate basic format validation to isUrlFormatValid
  if (!isUrlFormatValid(url)) return false;

  // Empty URL is valid (already validated by isUrlFormatValid)
  if (!url) return true;

  // Additional check for http/https protocol
  try {
    const u = new URL(url);
    return HTTPS_PROTOCOL_STRICT_PATTERN.test(u.protocol);
  } catch {
    // URL constructor should not throw since isUrlFormatValid passed
    return false;
  }
}

/**
 * Removes location information from organization string
 */
export function removeLocationFromOrganization(str: string): string {
  const array = str.split(', ');
  if (array.length === 3) {
    return str.split(', ').slice(0, -2).join(',').trim() || str;
  }
  return str.split(', ').slice(0, -3).join(',').trim() || str;
}

/**
 * Builds location options for combobox/select components
 */
export function buildLocationOptions(
  locationsData: LocationOption[] | undefined,
  selectedValue?: { id?: string; label?: string } | null
): { value: string; label: string }[] {
  const list = locationsData ?? [];
  const prependSelected =
    selectedValue?.id && !list.some(o => o.id === selectedValue.id)
      ? [{ value: selectedValue.id, label: selectedValue.label ?? '' }]
      : [];
  return [
    ...prependSelected,
    ...list.map(o => ({ value: o.id, label: o.label })),
  ];
}

/**
 * Gets organizations query data from cache
 */
export function getOrganizationsQueryData(
  queryClient: QueryClient,
  name: string
): OrganizationSelectOptions[] {
  const organizationsData = queryClient.getQueryData<
    OrganizationSelectOptions[]
  >(['organizations', removeLocationFromOrganization(name)]);
  return organizationsData ?? [];
}
