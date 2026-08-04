import { render, screen } from '@testing-library/react';

import VersionHistoryValueBoxGrid from '@/views/vacancies/components/version-history-value-box-grid';

describe('VersionHistoryValueBoxGrid', () => {
  it('renders a title-only box for items with no subtitle', () => {
    render(
      <VersionHistoryValueBoxGrid
        items={[{ title: 'Animal Welfare' }, { title: 'Arts and Culture' }]}
        variant="added"
      />
    );

    expect(screen.getByText('Animal Welfare')).toBeInTheDocument();
    expect(screen.getByText('Arts and Culture')).toBeInTheDocument();
  });

  it('renders both title and subtitle when present', () => {
    render(
      <VersionHistoryValueBoxGrid
        items={[{ title: 'Royal College', subtitle: 'Colombo, Sri Lanka' }]}
        variant="updated"
      />
    );

    expect(screen.getByText('Royal College')).toBeInTheDocument();
    expect(screen.getByText('Colombo, Sri Lanka')).toBeInTheDocument();
  });

  it('applies the removed-variant accent color to the title', () => {
    render(
      <VersionHistoryValueBoxGrid
        items={[{ title: 'Royal College' }]}
        variant="removed"
      />
    );

    expect(screen.getByText('Royal College')).toHaveClass('text-[#be123c]');
  });
});
