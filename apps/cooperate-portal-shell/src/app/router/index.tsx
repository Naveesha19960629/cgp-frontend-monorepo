import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import ProtectedRoute from '@/app/components/protected-route';
import MainLayout from '@/app/layouts/main-layout';
import AccountDeactivatedPage from '@/app/pages/account-deactivated-page';
import ErrorPage from '@/app/pages/error-page';
import LoadingPage from '@/app/pages/loading-page';
import LoginPage from '@/app/pages/login-page';
import NotFoundPage from '@/app/pages/not-found-page';

const AtsRoutes = lazy(() => import('ats-module/AtsRoutes'));

const router = createBrowserRouter([
  {
    // Public auth entry point — Keycloak redirects here after the user logs in
    path: '/auth/login',
    element: <LoginPage />,
  },
  {
    path: '/account-deactivated',
    element: <AccountDeactivatedPage />,
  },
  {
    // ProtectedRoute checks initialized + isLoggedIn before rendering children.
    // All routes nested here are auth-guarded.
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/dashboard',
        element: <MainLayout />,
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
    ],
  },
  {
    path: '/not-found',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
