import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VacancyTemplatePageHeader from '@/views/vacancies/components/vacancy-template-page-header';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('VacancyTemplatePageHeader', () => {
  const onBack = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders the translated heading', () => {
    render(
      <VacancyTemplatePageHeader
        headingKey="createTemplate.heading"
        onBack={onBack}
      />
    );
    expect(screen.getByText('createTemplate.heading')).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VacancyTemplatePageHeader
        headingKey="createTemplate.heading"
        onBack={onBack}
      />
    );

    await user.click(screen.getByRole('button', { name: 'common.back' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows the reference number badge when provided', () => {
    render(
      <VacancyTemplatePageHeader
        headingKey="editTemplate.heading"
        refNumber="REF-001"
        onBack={onBack}
      />
    );
    expect(screen.getByText('REF-001')).toBeInTheDocument();
  });

  it('omits the reference number badge when not provided', () => {
    render(
      <VacancyTemplatePageHeader
        headingKey="editTemplate.heading"
        onBack={onBack}
      />
    );
    expect(screen.queryByText(/REF-/)).not.toBeInTheDocument();
  });
});
