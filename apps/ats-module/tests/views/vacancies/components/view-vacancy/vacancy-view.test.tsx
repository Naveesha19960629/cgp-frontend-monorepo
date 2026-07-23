import { fireEvent, render, screen } from '@testing-library/react';

import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';

describe('VacancyView.Root', () => {
  it('renders children inside the root section', () => {
    render(
      <VacancyView.Root>
        <p>root-child</p>
      </VacancyView.Root>
    );
    expect(screen.getByText('root-child')).toBeInTheDocument();
  });
});

describe('VacancyView.Header', () => {
  it('renders the title', () => {
    render(<VacancyView.Header title="Vacancy Title" />);
    expect(screen.getByText('Vacancy Title')).toBeInTheDocument();
  });

  it('renders status and actions when provided', () => {
    render(
      <VacancyView.Header
        title="Vacancy Title"
        status={<span>Active</span>}
        actions={<button type="button">Edit</button>}
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('renders without status and actions', () => {
    const { container } = render(<VacancyView.Header title="No extras" />);
    expect(screen.getByText('No extras')).toBeInTheDocument();
    expect(container.querySelector('button')).toBeNull();
  });
});

describe('VacancyView.BackHeader', () => {
  it('renders the title and calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <VacancyView.BackHeader title="Back Title" onBack={onBack} />
    );
    expect(screen.getByText('Back Title')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders status when provided', () => {
    const onBack = vi.fn();
    render(
      <VacancyView.BackHeader
        title="Back Title"
        status={<span>Draft</span>}
        onBack={onBack}
      />
    );
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});

describe('VacancyView.Body', () => {
  it('renders children', () => {
    render(
      <VacancyView.Body>
        <p>body-child</p>
      </VacancyView.Body>
    );
    expect(screen.getByText('body-child')).toBeInTheDocument();
  });
});

describe('VacancyView.Section', () => {
  it('renders the title and children', () => {
    render(
      <VacancyView.Section title="Section Title">
        <p>section-child</p>
      </VacancyView.Section>
    );
    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText('section-child')).toBeInTheDocument();
  });
});

describe('VacancyView.Grid', () => {
  it('renders children', () => {
    render(
      <VacancyView.Grid>
        <p>grid-child</p>
      </VacancyView.Grid>
    );
    expect(screen.getByText('grid-child')).toBeInTheDocument();
  });
});

describe('VacancyView.Field', () => {
  it('renders the label and children', () => {
    render(
      <VacancyView.Field label="Field Label">
        <p>field-child</p>
      </VacancyView.Field>
    );
    expect(screen.getByText('Field Label')).toBeInTheDocument();
    expect(screen.getByText('field-child')).toBeInTheDocument();
  });
});

describe('VacancyView.Tags', () => {
  it('renders a dash when values is empty', () => {
    render(<VacancyView.Tags values={[]} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders a badge for each value', () => {
    render(<VacancyView.Tags values={['Alpha', 'Beta']} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});

describe('VacancyView.Description', () => {
  it('renders a dash when value is empty', () => {
    render(<VacancyView.Description value="" />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders the value when non-empty', () => {
    render(<VacancyView.Description value="Some description text" />);
    expect(screen.getByText('Some description text')).toBeInTheDocument();
  });
});

describe('VacancyView.InfoRow', () => {
  it('renders the label and a string value', () => {
    render(
      <VacancyView.InfoRow
        icon={<span data-testid="icon" />}
        label="Location"
        value="Colombo"
      />
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Colombo')).toBeInTheDocument();
  });

  it('joins an array value with a comma', () => {
    render(
      <VacancyView.InfoRow
        icon={<span data-testid="icon" />}
        label="Skills"
        value={['React', 'Node']}
      />
    );
    expect(screen.getByText('React, Node')).toBeInTheDocument();
  });

  it('renders a dash when the string value is empty', () => {
    render(
      <VacancyView.InfoRow
        icon={<span data-testid="icon" />}
        label="Location"
        value=""
      />
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders a dash when the array value is empty', () => {
    render(
      <VacancyView.InfoRow
        icon={<span data-testid="icon" />}
        label="Skills"
        value={[]}
      />
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
