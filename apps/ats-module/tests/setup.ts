import '@testing-library/jest-dom';
import * as RTL from '@testing-library/react';

// Make @testing-library/react utilities available as globals
// so test files don't need to import them individually
Object.assign(globalThis, RTL);

// cmdk (used by DataTableFacetedFilter's Command) and some Radix UI primitives
// reference ResizeObserver at module-load time. jsdom does not provide it.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// cmdk calls scrollIntoView when highlighting items inside Command; jsdom does
// not implement it so we provide a no-op to prevent test crashes.
global.HTMLElement.prototype.scrollIntoView = function () {};

// Radix UI Popover / DropdownMenu / Dialog call these pointer-capture methods
// (part of the Pointer Events spec) which jsdom does not implement.
if (!global.HTMLElement.prototype.hasPointerCapture) {
  global.HTMLElement.prototype.hasPointerCapture = function () {
    return false;
  };
}
if (!global.HTMLElement.prototype.setPointerCapture) {
  global.HTMLElement.prototype.setPointerCapture = function () {};
}
if (!global.HTMLElement.prototype.releasePointerCapture) {
  global.HTMLElement.prototype.releasePointerCapture = function () {};
}
