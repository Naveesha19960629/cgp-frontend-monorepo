import { Navigate, Route, Routes, createBrowserRouter } from 'react-router-dom';

import { addAtsTranslations } from '@/app/i18n';
import {
  NewVacancyPage,
  VacanciesPage,
  VacancyIdNewPage,
} from '@/views/vacancies';

// Register ATS translations into the shared i18n singleton at module-load time.
// When embedded in the shell, i18next is a shared library (vite.config.ts shared[]),
// so this instance is the same one the shell already initialized via initI18n().
addAtsTranslations();

/**
 * AtsRoutes — rendered by the shell under its wildcard `ats/*` route.
 * Uses a nested <Routes> so paths are relative to the shell's mount point.
 * Unmatched paths redirect to /not-found which the shell's * route handles.
 */
function AtsRoutes() {
  return (
    <Routes>
      <Route index element={<VacanciesPage />} />
      <Route path="vacancies" element={<VacanciesPage />} />
      <Route path="vacancies/new" element={<NewVacancyPage />} />
      <Route path="vacancies/:id/edit" element={<VacancyIdNewPage />} />
      <Route path="find-candidate" element={<div>Find Candidate</div>} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

/**
 * Standalone router — used when ats-module runs without the shell.
 * Full absolute paths mirror the shell's mount point /dashboard/ats.
 */
function createStandaloneRouter() {
  return createBrowserRouter([
    {
      path: '/dashboard/ats',
      children: [
        { index: true, element: <VacanciesPage /> },
        { path: 'vacancies', element: <VacanciesPage /> },
        { path: 'vacancies/new', element: <NewVacancyPage /> },
        { path: 'vacancies/:id/new', element: <VacancyIdNewPage /> },
        { path: 'find-candidate', element: <div>Find Candidate</div> },
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
