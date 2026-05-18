import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PreferredPatentsStep from '@/views/vacancies/components/form-steps/preferred-patents-step';

describe('PreferredPatentsStep', () => {
  const onNext = vi.fn();
  const onBack = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(
      screen.getByRole('heading', { name: /preferred patents/i })
    ).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(
      screen.getByText(/form fields for preferred patents will go here/i)
    ).toBeInTheDocument();
  });

  it('renders Back and Next buttons', () => {
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('calls onBack when the Back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when the Next button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('does not call onNext when the Back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PreferredPatentsStep
        onNext={onNext}
        onBack={onBack}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onNext).not.toHaveBeenCalled();
  });
});
