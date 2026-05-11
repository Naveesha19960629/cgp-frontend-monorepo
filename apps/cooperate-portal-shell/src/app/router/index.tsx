import { createBrowserRouter } from 'react-router-dom';

import ErrorPage from '@/app/pages/error-page';
import NotFoundPage from '@/app/pages/not-found-page';

const router = createBrowserRouter([
  {
    path: '/dashboard/ats',
    element: <h1>hi</h1>,
    errorElement: <ErrorPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
