import { screen } from '@testing-library/react';

import App from '@/app/app';

describe('App', () => {
  it('renders the project ready heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /project ready/i })
    ).toBeInTheDocument();
  });

  it('renders the button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /button/i })).toBeInTheDocument();
  });

  it('renders the dark mode hint', () => {
    render(<App />);
    expect(screen.getByText(/toggle dark mode/i)).toBeInTheDocument();
  });
});
