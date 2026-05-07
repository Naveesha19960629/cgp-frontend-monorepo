/**
 * Keyboard action handlers for autocomplete combobox
 */

type KeyboardAction = 'open' | 'down' | 'up' | 'escape' | 'enter' | 'none';

/**
 * Determines what keyboard action was triggered
 * Pure function that only depends on the event
 */
const getKeyboardAction = (
  event: React.KeyboardEvent<HTMLInputElement>,
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
      case 'none':
        // No action needed
        break;
    }
  };

export {
  createKeyboardActionHandler,
  getKeyboardAction,
  type KeyboardAction,
  type KeyboardActionHandlers,
};
