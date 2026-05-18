import { type ClassValue, clsx } from 'clsx';

import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function removeEmoji(text: string): string {
  if (!text) return text;
  return text
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[^a-zA-Z0-9\s.,!?@#$%^&*()_\-+=<>:/\\[\]{}|~`'";]/g, '');
}

export { removeEmoji, cn };
