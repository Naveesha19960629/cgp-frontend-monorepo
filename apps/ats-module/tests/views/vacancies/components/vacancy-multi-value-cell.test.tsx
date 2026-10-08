import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import VacancyMultiValueCell from '@/views/vacancies/components/vacancy-multi-value-cell';

// Radix Tooltip relies on pointer geometry that jsdom does not implement, so
// (matching the existing pattern in job-requirements-step.test.tsx) the
// trigger/content are rendered unconditionally instead of simulating hover.
vi.mock('@cgp/ui-kit/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

describe('VacancyMultiValueCell', () => {
  it('renders the single configured value as plain text', () => {
    render(
      <VacancyMultiValueCell
        values={['Software Engineer']}
        countLabel="1 Job Title"
      />
    );

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an empty cell when no values are configured', () => {
    render(<VacancyMultiValueCell values={[]} countLabel="0 Job Titles" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('0 Job Titles')).not.toBeInTheDocument();
  });

  it('renders a count trigger instead of the raw values when more than one is configured', () => {
    render(
      <VacancyMultiValueCell
        values={['Software Engineer', 'Senior Software Engineer']}
        countLabel="2 Job Titles"
      />
    );

    expect(
      screen.getByRole('button', { name: '2 Job Titles' })
    ).toBeInTheDocument();
  });

  it('styles the count trigger as an underlined brand-green label per the Figma (DQCGP-4542)', () => {
    render(
      <VacancyMultiValueCell
        values={['Software Engineer', 'Senior Software Engineer']}
        countLabel="2 Job Titles"
      />
    );

    expect(screen.getByRole('button', { name: '2 Job Titles' })).toHaveClass(
      'text-brand-primary-500',
      'underline'
    );
  });

  it('exposes every configured value alongside the count trigger', () => {
    render(
      <VacancyMultiValueCell
        values={['Software Engineer', 'Senior Software Engineer', 'QA Lead']}
        countLabel="3 Job Titles"
      />
    );

    expect(
      screen.getByRole('button', { name: '3 Job Titles' })
    ).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('QA Lead')).toBeInTheDocument();
  });
});
