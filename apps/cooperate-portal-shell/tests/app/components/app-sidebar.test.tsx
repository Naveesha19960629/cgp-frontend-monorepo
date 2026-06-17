import { MemoryRouter } from 'react-router-dom';

import { screen } from '@testing-library/react';

import { AppSidebar } from '@/app/components/app-sidebar';
import { initI18n } from '@/app/utils/i18n';

import { SidebarProvider } from '@cgp/ui-kit/components/ui/sidebar';

function renderWithRouter(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>
  );
}

describe('AppSidebar', () => {
  beforeAll(async () => {
    await initI18n();
  });

  it('marks View Vacancies active at /dashboard/ats/vacancies', () => {
    renderWithRouter('/dashboard/ats/vacancies');

    const viewVacanciesLink = screen.getByText('View Vacancies').closest('a');
    expect(viewVacanciesLink).toHaveAttribute(
      'href',
      '/dashboard/ats/vacancies'
    );
    expect(viewVacanciesLink).toHaveAttribute('data-active', 'true');
  });

  it('renders the parent Vacancies row as a non-navigating toggle button', () => {
    renderWithRouter('/dashboard/ats/vacancies');

    const vacanciesButton = screen.getByText('Vacancies').closest('button');
    expect(vacanciesButton).not.toBeNull();
    expect(vacanciesButton).toHaveAttribute('data-active', 'false');
  });

  it('expands the Vacancies submenu by default and collapses it on click anywhere on the row', () => {
    renderWithRouter('/dashboard/ats/vacancies');

    const vacanciesButton = screen.getByText('Vacancies').closest('button');
    expect(vacanciesButton).toHaveAttribute('data-state', 'open');
    expect(screen.getByText('View Vacancies')).toBeInTheDocument();

    fireEvent.click(vacanciesButton!);

    expect(vacanciesButton).toHaveAttribute('data-state', 'closed');
  });

  it('keeps View Vacancies active when creating a new vacancy', () => {
    renderWithRouter('/dashboard/ats/vacancies/new');

    expect(screen.getByText('View Vacancies').closest('a')).toHaveAttribute(
      'data-active',
      'true'
    );
  });

  it('keeps View Vacancies active when editing a specific vacancy', () => {
    renderWithRouter('/dashboard/ats/vacancies/abc-123/edit');

    expect(screen.getByText('View Vacancies').closest('a')).toHaveAttribute(
      'data-active',
      'true'
    );
  });

  it('marks Templates active at /dashboard/ats/templates and View Vacancies inactive', () => {
    renderWithRouter('/dashboard/ats/templates');

    expect(screen.getByText('Templates').closest('a')).toHaveAttribute(
      'data-active',
      'true'
    );
    expect(screen.getByText('View Vacancies').closest('a')).toHaveAttribute(
      'data-active',
      'false'
    );
  });

  it('marks Find Candidates active at /dashboard/ats/find-candidate', () => {
    renderWithRouter('/dashboard/ats/find-candidate');

    expect(screen.getByText('Find Candidates').closest('a')).toHaveAttribute(
      'data-active',
      'true'
    );
  });
});
