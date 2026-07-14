import { Navigate, Route, Routes, createBrowserRouter } from 'react-router-dom';

import AtsProtectedRoute from '@/app/components/protected-route';
import { UserProvider } from '@/app/contexts/user-context';
import { addAtsTranslations } from '@/app/utils/i18n';
import {
  NewVacancyFromTemplatePage,
  NewVacancyPage,
  NewVacancyTemplatePage,
  TemplatesPage,
  VacanciesPage,
  VacancyIdEditJdPage,
  VacancyIdEditPage,
  VacancyIdViewPage,
} from '@/views/vacancies';

// Register ATS translations into the shared i18n singleton at module-load time.
// When embedded in the shell, i18next is a shared library (vite.config.ts shared[]),
// so this instance is the same one the shell already initialized via initI18n().
addAtsTranslations();

/**
 * AtsRoutes — rendered by the shell under its wildcard `ats/*` route.
 * Uses a nested <Routes> so paths are relative to the shell's mount point.
 * Unmatched paths redirect to /not-found which the shell's * route handles.
 *
 * UserProvider is mounted here so ATS pages can call useUser() in embedded mode.
 * In standalone mode the UserProvider in app.tsx covers the same tree.
 */
function AtsRoutes() {
  return (
    <UserProvider>
      <Routes>
        <Route index element={<VacanciesPage />} />
        <Route path="vacancies" element={<VacanciesPage />} />
        <Route path="vacancies/new" element={<NewVacancyPage />} />
        <Route
          path="vacancies/from-template/:templateId"
          element={<NewVacancyFromTemplatePage />}
        />
        <Route path="vacancies/:id/edit" element={<VacancyIdEditPage />} />
        <Route path="vacancies/:id/view" element={<VacancyIdViewPage />} />
        <Route path="vacancies/:id/edit-jd" element={<VacancyIdEditJdPage />} />
        <Route path="find-candidate" element={<div>Find Candidate</div>} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="templates/new" element={<NewVacancyTemplatePage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </UserProvider>
  );
}

/**
 * Standalone router — used when ats-module runs without the shell.
 * Full absolute paths mirror the shell's mount point /dashboard/ats.
 * AtsProtectedRoute redirects unauthenticated users to Keycloak.
 */
function createStandaloneRouter() {
  return createBrowserRouter([
    {
      path: '/dashboard/ats',
      element: <AtsProtectedRoute />,
      children: [
        { index: true, element: <VacanciesPage /> },
        { path: 'vacancies', element: <VacanciesPage /> },
        { path: 'vacancies/new', element: <NewVacancyPage /> },
        {
          path: 'vacancies/from-template/:templateId',
          element: <NewVacancyFromTemplatePage />,
        },
        { path: 'vacancies/:id/edit', element: <VacancyIdEditPage /> },
        { path: 'vacancies/:id/view', element: <VacancyIdViewPage /> },
        { path: 'vacancies/:id/edit-jd', element: <VacancyIdEditJdPage /> },
        { path: 'find-candidate', element: <div>Find Candidate</div> },
        { path: 'templates', element: <TemplatesPage /> },
        { path: 'templates/new', element: <NewVacancyTemplatePage /> },
      ],
    },
    {
      path: '*',
      element: <div>Not Found</div>,
    },
  ]);
}

export { createStandaloneRouter, AtsRoutes };
export default AtsRoutes;
