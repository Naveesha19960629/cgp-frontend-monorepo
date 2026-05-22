/**
 * Utility functions for filtering and detecting emoji characters
 */

/**
 * Removes emoji characters from a string
 * @param text - The input text to filter
 * @returns Text with all emoji characters removed
 */
export function removeEmoji(text: string): string {
  if (!text) return text;

  // Unicode regex pattern to match emoji characters
  // Covers:
  // - Emoji with skin tone modifiers
  // - Zero-width joiners
  // - Variation selectors
  // - Regional indicators
  // - Emoji component characters
  return text
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[^a-zA-Z0-9\s.,!?@#$%^&*()_\-+=<>:/\\[\]{}|~`'";]/g, '');
}

/**
 * Validates if a string contains emoji characters
 * @param text - The text to check
 * @returns true if text contains emoji, false otherwise
 */
export function hasEmoji(text: string): boolean {
  if (!text) return false;
  return /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu.test(text);
}

/**
 * Creates an onChange handler that filters out emoji characters
 * Useful for form inputs that should not accept emoji
 */
export function createEmojiFilterHandler(
  onChangeCallback: (value: string) => void
): (value: string) => void {
  return (value: string) => {
    const filtered = removeEmoji(value);
    onChangeCallback(filtered);
  };
}
