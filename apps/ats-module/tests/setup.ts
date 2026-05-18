import '@testing-library/jest-dom';
import * as RTL from '@testing-library/react';

// Make @testing-library/react utilities available as globals
// so test files don't need to import them individually
Object.assign(globalThis, RTL);
