import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '@/app/layouts/main-layout';
import ErrorPage from '@/app/pages/error-page';
import LoadingPage from '@/app/pages/loading-page';
import NotFoundPage from '@/app/pages/not-found-page';

const AtsRoutes = lazy(() => import('ats-module/AtsRoutes'));

const router = createBrowserRouter([
  {
    path: '/dashboard',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        // Delegate all /dashboard/ats/* navigation to the ats-module
        path: 'ats/*',
        element: (
          <Suspense fallback={<LoadingPage />}>
            <AtsRoutes />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
