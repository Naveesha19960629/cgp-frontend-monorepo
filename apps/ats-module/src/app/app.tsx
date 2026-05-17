import { RouterProvider } from 'react-router-dom';

import { createStandaloneRouter } from '@/app/router';

export default function App() {
  return <RouterProvider router={createStandaloneRouter()} />;
}
