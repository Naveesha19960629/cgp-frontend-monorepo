import { z } from 'zod';

/**
 * Wraps a date schema so a date picker can be cleared to `null`.
 *
 * react-hook-form treats `undefined` as "no value set" and falls back to the
 * field's loaded value, so a date cleared to `undefined` keeps showing in edit
 * mode (DQCGP-4212). Pickers therefore clear to `null`; this turns `null` back
 * into `undefined` before validation, so the wrapped schema — required
 * message, range refinements, output — is unchanged. Used by the
 * Backspace-to-clear keyboard behaviour (NFR-024, DQCGP-4310).
 *
 * The cast keeps the wrapped schema's static type. `z.preprocess` would widen
 * the input type to `unknown`, which breaks the typed `zodResolver` forms; the
 * only runtime difference is that `null` is also accepted.
 */
export const clearableDate = <T extends z.ZodTypeAny>(schema: T): T =>
  z.preprocess(
    value => (value === null ? undefined : value),
    schema
  ) as unknown as T;
