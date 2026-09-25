/**
 * Keyboard action handlers for autocomplete combobox
 */

type KeyboardAction =
  | 'open'
  | 'down'
  | 'up'
  | 'escape'
  | 'enter'
  | 'clear'
  | 'none';

/**
 * Determines what keyboard action was triggered
 * Pure function that only depends on the event
 */
const getKeyboardAction = (
  event: Pick<React.KeyboardEvent, 'key'>,
  isOpen: boolean
): KeyboardAction => {
  // Open dropdown on arrow keys if closed
  if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    return 'open';
  }

  switch (event.key) {
    case 'ArrowDown':
      return 'down';
    case 'ArrowUp':
      return 'up';
    case 'Escape':
      return 'escape';
    case 'Enter':
      return 'enter';
    // NFR-028 (Candidate Portal) / NFR-024 (ATS): Backspace clears a
    // selected value. Delete is treated the same, as the APG listbox does.
    case 'Backspace':
    case 'Delete':
      return 'clear';
    default:
      return 'none';
  }
};

/**
 * Handlers for keyboard actions
 */
interface KeyboardActionHandlers {
  onOpen: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onEscape: () => void;
  onEnter: () => void;
  /**
   * Backspace/Delete. Return `true` when the key cleared a value, which
   * suppresses the key's default text-editing action. Return `false`, or
   * omit the handler, to let the key edit the input text as normal.
   */
  onClear?: () => boolean;
}

/**
 * Factory function that creates a keyboard event handler
 * Returns a function that dispatches to appropriate handlers based on keyboard action
 */
const createKeyboardActionHandler =
  (handlers: KeyboardActionHandlers, isOpen: boolean) =>
  (event: React.KeyboardEvent<HTMLInputElement>) => {
    const action = getKeyboardAction(event, isOpen);

    switch (action) {
      case 'open':
        handlers.onOpen();
        break;
      case 'down':
        event.preventDefault();
        handlers.onMoveDown();
        break;
      case 'up':
        event.preventDefault();
        handlers.onMoveUp();
        break;
      case 'escape':
        handlers.onEscape();
        break;
      case 'enter':
        if (isOpen) {
          event.preventDefault();
          handlers.onEnter();
        }
        break;
      case 'clear':
        if (handlers.onClear?.()) {
          event.preventDefault();
        }
        break;
      case 'none':
        // No action needed
        break;
    }
  };

interface DateClearOptions {
  /** Whether the trigger currently shows a date. */
  hasValue: boolean;
  /**
   * Whether the calendar is open. The trigger then leaves the keys to the
   * calendar, which clears the date itself (see `Calendar`).
   */
  isOpen: boolean;
  /**
   * Clears the date. For react-hook-form fields set `null`, not `undefined`:
   * `undefined` falls back to the loaded value, so the date keeps showing in
   * edit mode (DQCGP-4212).
   */
  onClear: () => void;
}

/**
 * NFR-028 (Candidate Portal) / NFR-024 (ATS): Backspace or Delete on a
 * focused, closed date-picker trigger clears its date. The trigger is a
 * <button>, which has no native Backspace behaviour, so nothing is lost.
 * With the calendar open, the ui-kit `Calendar` clears it instead.
 * Enter/Space (open), arrows (move through days) and Escape (close, focus
 * back on the trigger) come from Radix Popover and react-day-picker.
 */
const createDateClearHandler =
  ({ hasValue, isOpen, onClear }: DateClearOptions) =>
  (event: React.KeyboardEvent<HTMLElement>) => {
    if (isOpen || !hasValue) return;
    if (getKeyboardAction(event, isOpen) !== 'clear') return;
    event.preventDefault();
    onClear();
  };

export {
  createDateClearHandler,
  createKeyboardActionHandler,
  getKeyboardAction,
  type DateClearOptions,
  type KeyboardAction,
  type KeyboardActionHandlers,
};
