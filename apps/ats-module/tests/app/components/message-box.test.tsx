import { render, screen } from '@testing-library/react';

import MessageBox from '@/app/components/message-box';

// ── Mock asset imports ─────────────────────────────────────────────────────

vi.mock('@/assets/message-box-background.png', () => ({
  default: 'test-bg.png',
}));

vi.mock('iconsax-reactjs', () => ({
  Ranking: () => <span data-testid="ranking-icon" />,
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('MessageBox', () => {
  describe('title', () => {
    it('renders the title text', () => {
      render(<MessageBox title="Build the Application Form" message="" />);
      expect(
        screen.getByText('Build the Application Form')
      ).toBeInTheDocument();
    });
  });

  describe('message', () => {
    it('renders a plain string message', () => {
      render(<MessageBox title="Title" message="Some informational text" />);
      expect(screen.getByText('Some informational text')).toBeInTheDocument();
    });

    it('renders a ReactNode message with multiple children', () => {
      render(
        <MessageBox
          title="Title"
          message={
            <>
              <span>Certain fields</span> in this section are always collected
              from candidates
            </>
          }
        />
      );

      expect(screen.getByText('Certain fields')).toBeInTheDocument();
      expect(
        screen.getByText(
          'in this section are always collected from candidates',
          { exact: false }
        )
      ).toBeInTheDocument();
    });
  });

  describe('icon', () => {
    it('renders the Ranking icon', () => {
      render(<MessageBox title="Title" message="msg" />);
      expect(screen.getByTestId('ranking-icon')).toBeInTheDocument();
    });
  });

  describe('background image', () => {
    it('applies the background image via inline style', () => {
      const { container } = render(<MessageBox title="Title" message="msg" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.backgroundImage).toContain('test-bg.png');
    });
  });

  describe('avatar image', () => {
    it('renders the decorative avatar image', () => {
      render(<MessageBox title="Title" message="msg" />);
      const avatar = document.querySelector(
        'img[src="/success-toast-avatar.svg"]'
      );
      expect(avatar).toBeInTheDocument();
      // Decorative image has empty alt text
      expect(avatar).toHaveAttribute('alt', '');
    });
  });
});
