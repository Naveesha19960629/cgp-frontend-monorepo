import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '@/app/layouts/main-layout';
import ErrorPage from '@/app/pages/error-page';
import NotFoundPage from '@/app/pages/not-found-page';

const router = createBrowserRouter([
  {
    path: '/dashboard',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'ats',
        element: <div>ATS</div>,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
