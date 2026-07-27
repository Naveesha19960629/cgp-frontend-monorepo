import { render, screen } from '@testing-library/react';

import TemplateEmptyStateMessage from '@/views/vacancies/components/template-empty-state-message';

describe('TemplateEmptyStateMessage', () => {
  it('renders the provided title', () => {
    render(
      <TemplateEmptyStateMessage title="No templates yet" description="desc" />
    );
    expect(screen.getByText('No templates yet')).toBeInTheDocument();
  });

  it('renders the provided description', () => {
    render(
      <TemplateEmptyStateMessage
        title="title"
        description="Try creating a new template"
      />
    );
    expect(screen.getByText('Try creating a new template')).toBeInTheDocument();
  });

  it('renders the decorative glow and avatar images', () => {
    const { container } = render(
      <TemplateEmptyStateMessage title="title" description="desc" />
    );
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);
  });
});
