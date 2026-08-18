import { MemoryRouter } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { render, screen } from '@testing-library/react';

import { AppBreadcrumb } from '@/app/components/app-breadcrumb';
import { initI18n } from '@/app/utils/i18n';

function renderWithRouter(pathname: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[pathname]}>
        <AppBreadcrumb />
      </MemoryRouter>
    </QueryClientProvider>
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
    expect(screen.getByText('Create Vacancy')).toBeInTheDocument();
  });

  it('renders two items for /dashboard/ats/vacancies/:id/version-history', () => {
    // Regression test: this route had no breadcrumbRoutes entry at all, so
    // AppBreadcrumb silently rendered nothing on the Version History page —
    // reported live via a screenshot missing the "Vacancies > Version
    // History" trail Figma shows above the page's own header (node
    // 4229:229517).
    renderWithRouter('/dashboard/ats/vacancies/abc-123/version-history');

    expect(screen.getByText('Vacancies')).toBeInTheDocument();
    expect(screen.getByText('Version History')).toBeInTheDocument();
    expect(screen.getByText('Vacancies').closest('a')).not.toBeNull();
    expect(screen.getByText('Version History').closest('a')).toBeNull();
  });

  it('renders two items for /dashboard/ats/vacancies/from-template/:templateId', () => {
    // Regression test: this route had no breadcrumbRoutes entry at all, so
    // AppBreadcrumb silently rendered nothing on the Use Template page —
    // reported as the "Vacancies > Create Vacancy" trail missing from the
    // top of the page (DQCGP-3652).
    renderWithRouter('/dashboard/ats/vacancies/from-template/tmpl-123');

    expect(screen.getByText('Vacancies')).toBeInTheDocument();
    expect(screen.getByText('Create Vacancy')).toBeInTheDocument();
  });

  it('renders two items for /dashboard/ats/templates/:id/edit', () => {
    renderWithRouter('/dashboard/ats/templates/tmpl-123/edit');

    expect(screen.getByText('Vacancies')).toBeInTheDocument();
    expect(screen.getByText('Edit Template')).toBeInTheDocument();
  });

  it('renders parent breadcrumb as a link and current item without a link', () => {
    renderWithRouter('/dashboard/ats/vacancies/new');

    expect(screen.getByText('Vacancies').closest('a')).not.toBeNull();
    expect(screen.getByText('Create Vacancy').closest('a')).toBeNull();
  });

  it('renders dynamic vacancy title for /dashboard/ats/vacancies/:id/view when data is loaded', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    queryClient.setQueryData(['vacancy', 'abc-123'], {
      data: {
        vacancy: {
          title: 'Senior Software Engineer - React & Node.js Lead',
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={['/dashboard/ats/vacancies/abc-123/view']}
        >
          <AppBreadcrumb />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Vacancies')).toBeInTheDocument();
    expect(
      screen.getByText('Senior Software Engineer - React & Node.js Lead')
    ).toBeInTheDocument();
  });

  it('renders fallback View Vacancy for /dashboard/ats/vacancies/:id/view when data is loading', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={['/dashboard/ats/vacancies/abc-123/view']}
        >
          <AppBreadcrumb />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Vacancies')).toBeInTheDocument();
    expect(screen.getByText('View Vacancy')).toBeInTheDocument();
  });

  it('renders nothing for an unknown route', () => {
    renderWithRouter('/unknown/route');

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
