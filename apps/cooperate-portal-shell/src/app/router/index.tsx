import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '@/app/layouts/main-layout';
import ErrorPage from '@/app/pages/error-page';
import NotFoundPage from '@/app/pages/not-found-page';

import Vacancyies from 'ats-module/Vacancyies';

const router = createBrowserRouter([
  {
    path: '/dashboard',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'ats/vacancies',
        element: (
          <div>
            Vacancies
            <Vacancyies />
          </div>
        ),
      },
      {
        path: 'ats/find-candidate',
        element: <div>Find Candidate</div>,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
