/** Returns true if the URL starts with http:// or https:// (or is empty/undefined). */
function isUrlProtocolValid(url: string | undefined): boolean {
  if (!url) return true;
  return /^https?:\/\//i.test(url);
}

/** Returns true if the URL is a valid web address (parseable with a valid hostname). */
function isUrlFormatValid(url: string | undefined): boolean {
  if (!url) return true;
  if (/\s/.test(url)) return false;

  try {
    const u = new URL(url);
    if (!/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(u.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export { isUrlProtocolValid, isUrlFormatValid };
