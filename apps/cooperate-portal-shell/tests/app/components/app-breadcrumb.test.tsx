import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';

import { AppBreadcrumb } from '@/app/components/app-breadcrumb';
import { initI18n } from '@/app/utils/i18n';

function renderWithRouter(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppBreadcrumb />
    </MemoryRouter>
  );
}

describe('AppBreadcrumb', () => {
  beforeAll(async () => {
    await initI18n();
  });

  it('renders no items for a route with empty breadcrumb config', () => {
    renderWithRouter('/dashboard/ats/vacancies');

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('renders a single item for /dashboard/ats/find-candidate', () => {
    renderWithRouter('/dashboard/ats/find-candidate');

    expect(screen.getByText('Find Candidates')).toBeInTheDocument();
  });

  it('renders a single item for /dashboard/ats/templates', () => {
    renderWithRouter('/dashboard/ats/templates');

    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('renders two items for /dashboard/ats/vacancies/new', () => {
    renderWithRouter('/dashboard/ats/vacancies/new');

    expect(screen.getByText('Vacancies')).toBeInTheDocument();
    expect(screen.getByText('Add Vacancy')).toBeInTheDocument();
  });

  it('renders parent breadcrumb as a link and current item without a link', () => {
    renderWithRouter('/dashboard/ats/vacancies/new');

    expect(screen.getByText('Vacancies').closest('a')).not.toBeNull();
    expect(screen.getByText('Add Vacancy').closest('a')).toBeNull();
  });

  it('renders nothing for an unknown route', () => {
    renderWithRouter('/unknown/route');

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
