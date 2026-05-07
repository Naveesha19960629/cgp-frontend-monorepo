import '@testing-library/jest-dom';

declare global {
  var render: typeof import('@testing-library/react').render;
  var fireEvent: typeof import('@testing-library/react').fireEvent;
  var waitFor: typeof import('@testing-library/react').waitFor;
  var waitForElementToBeRemoved: typeof import('@testing-library/react').waitForElementToBeRemoved;
  var within: typeof import('@testing-library/react').within;
  var act: typeof import('@testing-library/react').act;
  var cleanup: typeof import('@testing-library/react').cleanup;
}
