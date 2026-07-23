import { render } from '@testing-library/react';

import TemplateCardSkeleton from '@/views/vacancies/components/template-card-skeleton';

describe('TemplateCardSkeleton', () => {
  it('renders as an article element', () => {
    const { container } = render(<TemplateCardSkeleton />);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('renders the expected number of skeleton placeholders', () => {
    const { container } = render(<TemplateCardSkeleton />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(6);
  });
});
