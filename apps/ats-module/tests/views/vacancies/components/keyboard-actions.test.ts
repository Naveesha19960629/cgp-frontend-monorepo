/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from 'vitest';

import {
  type KeyboardAction,
  type KeyboardActionHandlers,
  createDateClearHandler,
  createKeyboardActionHandler,
  getKeyboardAction,
} from '@cgp/ui-kit/lib/keyboard-actions';

describe('keyboard-actions', () => {
  describe('getKeyboardAction', () => {
    // Helper to create mock keyboard events
    const createKeyboardEvent = (
      key: string,
      overrides?: Partial<React.KeyboardEvent<HTMLInputElement>>
    ): React.KeyboardEvent<HTMLInputElement> => {
      return {
        key,
        preventDefault: vi.fn(),
        ...overrides,
      } as unknown as React.KeyboardEvent<HTMLInputElement>;
    };

    describe('when dropdown is closed', () => {
      it('returns "open" for ArrowDown', () => {
        const event = createKeyboardEvent('ArrowDown');
        expect(getKeyboardAction(event, false)).toBe('open');
      });

      it('returns "open" for ArrowUp', () => {
        const event = createKeyboardEvent('ArrowUp');
        expect(getKeyboardAction(event, false)).toBe('open');
      });

      it('returns "enter" for Enter even when closed', () => {
        const event = createKeyboardEvent('Enter');
        expect(getKeyboardAction(event, false)).toBe('enter');
      });

      it('returns "escape" for Escape even when closed', () => {
        const event = createKeyboardEvent('Escape');
        expect(getKeyboardAction(event, false)).toBe('escape');
      });
    });

    describe('when dropdown is open', () => {
      it('returns "down" for ArrowDown', () => {
        const event = createKeyboardEvent('ArrowDown');
        expect(getKeyboardAction(event, true)).toBe('down');
      });

      it('returns "up" for ArrowUp', () => {
        const event = createKeyboardEvent('ArrowUp');
        expect(getKeyboardAction(event, true)).toBe('up');
      });

      it('returns "enter" for Enter', () => {
        const event = createKeyboardEvent('Enter');
        expect(getKeyboardAction(event, true)).toBe('enter');
      });

      it('returns "escape" for Escape', () => {
        const event = createKeyboardEvent('Escape');
        expect(getKeyboardAction(event, true)).toBe('escape');
      });
    });

    describe('clear keys (NFR-028 / NFR-024)', () => {
      ['Backspace', 'Delete'].forEach(key => {
        it(`returns "clear" for ${key} whether open or closed`, () => {
          const event = createKeyboardEvent(key);
          expect(getKeyboardAction(event, true)).toBe('clear');
          expect(getKeyboardAction(event, false)).toBe('clear');
        });
      });
    });

    describe('unrecognized keys', () => {
      // Space is deliberately unrecognized: in an editable combobox it types
      // a space (APG combobox pattern), it does not select an option.
      const unrecognizedKeys = ['a', 'A', '1', ' ', 'Tab', 'Meta'];

      unrecognizedKeys.forEach(key => {
        it(`returns "none" for key: ${key}`, () => {
          const event = createKeyboardEvent(key);
          expect(getKeyboardAction(event, true)).toBe('none');
          expect(getKeyboardAction(event, false)).toBe('none');
        });
      });
    });

    describe('case sensitivity', () => {
      it('handles "ArrowDown" correctly', () => {
        const event = createKeyboardEvent('ArrowDown');
        expect(getKeyboardAction(event, true)).toBe('down');
      });

      it('handles "ArrowUp" correctly', () => {
        const event = createKeyboardEvent('ArrowUp');
        expect(getKeyboardAction(event, true)).toBe('up');
      });

      it('does not match "arrowdown" (lowercase)', () => {
        const event = createKeyboardEvent('arrowdown');
        expect(getKeyboardAction(event, true)).toBe('none');
      });
    });
  });

  describe('createKeyboardActionHandler', () => {
    const createKeyboardEvent = (
      key: string,
      overrides?: Partial<React.KeyboardEvent<HTMLInputElement>>
    ): React.KeyboardEvent<HTMLInputElement> => {
      return {
        key,
        preventDefault: vi.fn(),
        ...overrides,
      } as unknown as React.KeyboardEvent<HTMLInputElement>;
    };

    const createHandlers = (
      overrides?: Partial<KeyboardActionHandlers>
    ): KeyboardActionHandlers => ({
      onOpen: vi.fn(),
      onMoveDown: vi.fn(),
      onMoveUp: vi.fn(),
      onEscape: vi.fn(),
      onEnter: vi.fn(),
      ...overrides,
    });

    describe('when dropdown is closed', () => {
      it('calls onOpen for ArrowDown', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, false);
        const event = createKeyboardEvent('ArrowDown');

        handler(event);

        expect(handlers.onOpen).toHaveBeenCalledOnce();
        expect(handlers.onMoveDown).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('calls onOpen for ArrowUp', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, false);
        const event = createKeyboardEvent('ArrowUp');

        handler(event);

        expect(handlers.onOpen).toHaveBeenCalledOnce();
        expect(handlers.onMoveUp).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('does not call onEnter for Enter when closed', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, false);
        const event = createKeyboardEvent('Enter');

        handler(event);

        expect(handlers.onEnter).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('calls onEscape for Escape when closed', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, false);
        const event = createKeyboardEvent('Escape');

        handler(event);

        expect(handlers.onEscape).toHaveBeenCalledOnce();
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('when dropdown is open', () => {
      it('calls onMoveDown for ArrowDown and prevents default', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, true);
        const event = createKeyboardEvent('ArrowDown');

        handler(event);

        expect(handlers.onMoveDown).toHaveBeenCalledOnce();
        expect(event.preventDefault).toHaveBeenCalledOnce();
      });

      it('calls onMoveUp for ArrowUp and prevents default', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, true);
        const event = createKeyboardEvent('ArrowUp');

        handler(event);

        expect(handlers.onMoveUp).toHaveBeenCalledOnce();
        expect(event.preventDefault).toHaveBeenCalledOnce();
      });

      it('calls onEnter for Enter and prevents default', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, true);
        const event = createKeyboardEvent('Enter');

        handler(event);

        expect(handlers.onEnter).toHaveBeenCalledOnce();
        expect(event.preventDefault).toHaveBeenCalledOnce();
      });

      it('calls onEscape for Escape and does not prevent default', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, true);
        const event = createKeyboardEvent('Escape');

        handler(event);

        expect(handlers.onEscape).toHaveBeenCalledOnce();
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('unrecognized keys', () => {
      it('does not call any handler for unrecognized keys', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, true);
        const event = createKeyboardEvent('a');

        handler(event);

        expect(handlers.onOpen).not.toHaveBeenCalled();
        expect(handlers.onMoveDown).not.toHaveBeenCalled();
        expect(handlers.onMoveUp).not.toHaveBeenCalled();
        expect(handlers.onEscape).not.toHaveBeenCalled();
        expect(handlers.onEnter).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('clear action', () => {
      it('prevents default when onClear reports it cleared a value', () => {
        const handlers = createHandlers({ onClear: vi.fn(() => true) });
        const event = createKeyboardEvent('Backspace');

        createKeyboardActionHandler(handlers, false)(event);

        expect(handlers.onClear).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('leaves text editing alone when onClear declines', () => {
        const handlers = createHandlers({ onClear: vi.fn(() => false) });
        const event = createKeyboardEvent('Delete');

        createKeyboardActionHandler(handlers, true)(event);

        expect(handlers.onClear).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('is a no-op for consumers that do not pass onClear', () => {
        const handlers = createHandlers();
        const event = createKeyboardEvent('Backspace');

        createKeyboardActionHandler(handlers, true)(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(handlers.onEnter).not.toHaveBeenCalled();
      });
    });

    describe('preventDefault behavior', () => {
      it('prevents default only for navigation and enter keys', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, true);

        const arrowDownEvent = createKeyboardEvent('ArrowDown');
        const arrowUpEvent = createKeyboardEvent('ArrowUp');
        const enterEvent = createKeyboardEvent('Enter');
        const escapeEvent = createKeyboardEvent('Escape');

        handler(arrowDownEvent);
        handler(arrowUpEvent);
        handler(enterEvent);
        handler(escapeEvent);

        expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
        expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
        expect(enterEvent.preventDefault).toHaveBeenCalled();
        expect(escapeEvent.preventDefault).not.toHaveBeenCalled();
      });

      it('does not prevent default when opening dropdown', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, false);

        const arrowDownEvent = createKeyboardEvent('ArrowDown');
        const arrowUpEvent = createKeyboardEvent('ArrowUp');

        handler(arrowDownEvent);
        handler(arrowUpEvent);

        expect(arrowDownEvent.preventDefault).not.toHaveBeenCalled();
        expect(arrowUpEvent.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('handler factory behavior', () => {
      it('returns a new handler function each time but with same behavior', () => {
        const handlers = createHandlers();
        const handler1 = createKeyboardActionHandler(handlers, true);
        const handler2 = createKeyboardActionHandler(handlers, true);

        // Different function instances
        expect(handler1).not.toBe(handler2);

        // Same behavior
        const event1 = createKeyboardEvent('Enter');
        const event2 = createKeyboardEvent('Enter');

        handler1(event1);
        handler2(event2);

        expect(handlers.onEnter).toHaveBeenCalledTimes(2);
      });

      it('respects isOpen parameter correctly', () => {
        const handlers = createHandlers();
        const closedHandler = createKeyboardActionHandler(handlers, false);
        const openHandler = createKeyboardActionHandler(handlers, true);

        const closedEvent = createKeyboardEvent('Enter');
        const openEvent = createKeyboardEvent('Enter');

        closedHandler(closedEvent);
        openHandler(openEvent);

        // Only called once (from open handler)
        expect(handlers.onEnter).toHaveBeenCalledOnce();
      });
    });

    describe('edge cases', () => {
      it('handles multiple rapid key events correctly', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, true);

        const events = [
          createKeyboardEvent('ArrowDown'),
          createKeyboardEvent('ArrowDown'),
          createKeyboardEvent('ArrowUp'),
          createKeyboardEvent('Enter'),
        ];

        events.forEach(event => handler(event));

        expect(handlers.onMoveDown).toHaveBeenCalledTimes(2);
        expect(handlers.onMoveUp).toHaveBeenCalledOnce();
        expect(handlers.onEnter).toHaveBeenCalledOnce();
      });

      it('correctly handles state transition from closed to open', () => {
        const handlers = createHandlers();

        // Start with closed handler
        const closedHandler = createKeyboardActionHandler(handlers, false);
        const arrowDownEvent = createKeyboardEvent('ArrowDown');
        closedHandler(arrowDownEvent);
        expect(handlers.onOpen).toHaveBeenCalledOnce();

        // Simulate state change to open
        const openHandler = createKeyboardActionHandler(handlers, true);
        const enterEvent = createKeyboardEvent('Enter');
        openHandler(enterEvent);
        expect(handlers.onEnter).toHaveBeenCalledOnce();
      });

      it('handles valid event with preventDefault property', () => {
        const handlers = createHandlers();
        const handler = createKeyboardActionHandler(handlers, true);

        const eventWithPreventDefault = {
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>;

        expect(() => {
          handler(eventWithPreventDefault);
        }).not.toThrow();
        expect(handlers.onMoveDown).toHaveBeenCalled();
      });
    });
  });

  describe('type exports', () => {
    it('exports KeyboardAction type correctly', () => {
      const action: KeyboardAction = 'open';
      expect(action).toBeDefined();

      const allActions: KeyboardAction[] = [
        'open',
        'down',
        'up',
        'escape',
        'enter',
        'none',
      ];
      expect(allActions).toHaveLength(6);
    });

    it('exports KeyboardActionHandlers type correctly', () => {
      const handlers: KeyboardActionHandlers = {
        onOpen: () => {},
        onMoveDown: () => {},
        onMoveUp: () => {},
        onEscape: () => {},
        onEnter: () => {},
      };

      expect(handlers.onOpen).toBeDefined();
      expect(handlers.onMoveDown).toBeDefined();
      expect(handlers.onMoveUp).toBeDefined();
      expect(handlers.onEscape).toBeDefined();
      expect(handlers.onEnter).toBeDefined();
    });
  });

  describe('createDateClearHandler (NFR-028 / NFR-024)', () => {
    const keyEvent = (key: string) =>
      ({
        key,
        preventDefault: vi.fn(),
      }) as unknown as React.KeyboardEvent<HTMLElement>;

    it.each(['Backspace', 'Delete'])(
      'clears a closed picker with a date on %s',
      key => {
        const onClear = vi.fn();
        const event = keyEvent(key);

        createDateClearHandler({ hasValue: true, isOpen: false, onClear })(
          event
        );

        expect(onClear).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).toHaveBeenCalled();
      }
    );

    it('leaves an open picker alone (focus is in the calendar grid)', () => {
      const onClear = vi.fn();
      createDateClearHandler({ hasValue: true, isOpen: true, onClear })(
        keyEvent('Backspace')
      );
      expect(onClear).not.toHaveBeenCalled();
    });

    it('does nothing on an empty picker', () => {
      const onClear = vi.fn();
      const event = keyEvent('Backspace');
      createDateClearHandler({ hasValue: false, isOpen: false, onClear })(
        event
      );
      expect(onClear).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it.each(['Enter', ' ', 'ArrowDown', 'a'])('ignores %s', key => {
      const onClear = vi.fn();
      createDateClearHandler({ hasValue: true, isOpen: false, onClear })(
        keyEvent(key)
      );
      expect(onClear).not.toHaveBeenCalled();
    });
  });
});
