import type {
  FieldPath,
  FieldValues,
  PathValue,
  UseFormReturn,
} from 'react-hook-form';

/**
 * NFR-024 (ATS): clearing a field (Backspace/Delete, or removing its last
 * chip) must not flash its required error; that waits for the next Next
 * press. `setValue` alone would skip validation and leave `isValid` stale,
 * and step navigation reads `isValid`, so the field is still validated and
 * only its message is dropped. Both updates land in the same render, so the
 * message never shows.
 */
export const clearFieldQuietly = <
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>(
  form: Pick<UseFormReturn<TValues>, 'setValue' | 'trigger' | 'clearErrors'>,
  name: TName,
  empty: PathValue<TValues, TName>
) => {
  form.setValue(name, empty, { shouldDirty: true });
  void form.trigger(name).then(() => form.clearErrors(name));
};
