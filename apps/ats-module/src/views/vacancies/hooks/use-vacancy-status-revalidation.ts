import { useEffect, useRef } from 'react';

import type { VacancyTableColumn } from '@/views/vacancies/types';
import { normalizeStatusKey } from '@/views/vacancies/utils';

// Small buffer so the timer fires just after the transition instant rather
// than a hair before it (clock drift / setTimeout under-firing).
const TRANSITION_BUFFER_MS = 1_000;

// Vacancy status flips purely by the clock crossing schedulePublishAt
// (unpublished -> live) or expirationAt (live -> expired) — no user action
// triggers it. Find the soonest such transition among the currently loaded
// vacancies.
const getNextTransitionAt = (
  vacancies: readonly VacancyTableColumn[]
): number | null => {
  const now = Date.now();
  let next: number | null = null;

  for (const vacancy of vacancies) {
    if (!vacancy.status) continue;
    const key = normalizeStatusKey(vacancy.status);
    let transitionSource: string | null = null;
    if (key === 'unpublished') transitionSource = vacancy.schedulePublishAt;
    else if (key === 'live') transitionSource = vacancy.expirationAt;

    if (!transitionSource) continue;

    const transitionAt = new Date(transitionSource).getTime();
    if (Number.isNaN(transitionAt) || transitionAt <= now) continue;

    if (next === null || transitionAt < next) {
      next = transitionAt;
    }
  }

  return next;
};

/**
 * Schedules a one-off revalidation exactly when the next vacancy in the
 * given list is due to flip status (Unpublished -> Live or Live -> Expired),
 * instead of polling. Re-evaluates whenever the vacancy list changes (e.g.
 * after that revalidation fetches fresh data), chaining to the next
 * transition.
 */
const useVacancyStatusRevalidation = (
  vacancies: readonly VacancyTableColumn[],
  onRevalidate: () => void
) => {
  const onRevalidateRef = useRef(onRevalidate);
  useEffect(() => {
    onRevalidateRef.current = onRevalidate;
  }, [onRevalidate]);

  useEffect(() => {
    const nextTransitionAt = getNextTransitionAt(vacancies);
    if (nextTransitionAt === null) return undefined;

    const delay = nextTransitionAt - Date.now() + TRANSITION_BUFFER_MS;
    const timerId = setTimeout(() => onRevalidateRef.current(), delay);

    return () => clearTimeout(timerId);
  }, [vacancies]);
};

export { useVacancyStatusRevalidation };
