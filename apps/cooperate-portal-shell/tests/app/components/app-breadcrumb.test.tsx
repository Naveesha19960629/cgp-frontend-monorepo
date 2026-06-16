import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';

import { AppBreadcrumb } from '@/app/components/app-breadcrumb';

function renderWithRouter(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppBreadcrumb />
    </MemoryRouter>
  );
}

describe('AppBreadcrumb', () => {
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
    expect(screen.getByText('Create Vacancy')).toBeInTheDocument();
  });

  it('renders items without anchor links when no link is configured', () => {
    renderWithRouter('/dashboard/ats/vacancies/new');

    expect(screen.getByText('Vacancies').closest('a')).toBeNull();
    expect(screen.getByText('Create Vacancy').closest('a')).toBeNull();
  });

  it('renders nothing for an unknown route', () => {
    renderWithRouter('/unknown/route');

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
