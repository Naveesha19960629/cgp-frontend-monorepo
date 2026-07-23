import { render, screen } from '@testing-library/react';

import SectionCard from '@/views/vacancies/components/section-card';

describe('SectionCard', () => {
  it('renders the title', () => {
    render(
      <SectionCard title="Personal Details">
        <p>Body content</p>
      </SectionCard>
    );

    expect(
      screen.getByRole('heading', { name: 'Personal Details' })
    ).toBeInTheDocument();
  });

  it('renders the children', () => {
    render(
      <SectionCard title="Personal Details">
        <p>Body content</p>
      </SectionCard>
    );

    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders headerExtra content when provided', () => {
    render(
      <SectionCard title="Personal Details" headerExtra={<span>Extra</span>}>
        <p>Body content</p>
      </SectionCard>
    );

    expect(screen.getByText('Extra')).toBeInTheDocument();
  });

  it('does not render any extra header content when headerExtra is omitted', () => {
    const { container } = render(
      <SectionCard title="Personal Details">
        <p>Body content</p>
      </SectionCard>
    );

    const headerRow = container.querySelector('h3')?.parentElement;
    expect(headerRow?.children).toHaveLength(1);
  });
});
