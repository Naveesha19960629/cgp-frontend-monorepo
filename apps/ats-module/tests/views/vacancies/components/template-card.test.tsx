import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TemplateCard from '@/views/vacancies/components/template-card';
import type { VacancyTemplateSearchItem } from '@/views/vacancies/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { date?: string }) =>
      options?.date ? `${key}:${options.date}` : key,
  }),
}));

vi.mock('@/views/vacancies/utils/format-date-range', () => ({
  formatDisplayDate: (date?: string) => (date ? `formatted-${date}` : ''),
}));

const template: VacancyTemplateSearchItem = {
  vacancyTemplateId: 'tpl-1',
  templateName: 'Software Engineer',
  refNumber: 'REF-100',
  createdAt: '2026-01-01',
  updatedAt: '2026-02-15',
  createdBy: 'user-1',
  updatedBy: 'user-2',
};

describe('TemplateCard', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onUse = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders the template name', () => {
    render(
      <TemplateCard
        template={template}
        onEdit={onEdit}
        onDelete={onDelete}
        onUse={onUse}
      />
    );

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders the reference number', () => {
    render(
      <TemplateCard
        template={template}
        onEdit={onEdit}
        onDelete={onDelete}
        onUse={onUse}
      />
    );

    expect(screen.getByText('REF-100')).toBeInTheDocument();
  });

  it('renders the formatted last-updated date', () => {
    render(
      <TemplateCard
        template={template}
        onEdit={onEdit}
        onDelete={onDelete}
        onUse={onUse}
      />
    );

    expect(
      screen.getByText('templates.card.lastUpdated:formatted-2026-02-15')
    ).toBeInTheDocument();
  });

  it('calls onEdit with the template id when the edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TemplateCard
        template={template}
        onEdit={onEdit}
        onDelete={onDelete}
        onUse={onUse}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'templates.card.edit' })
    );

    expect(onEdit).toHaveBeenCalledWith('tpl-1');
    expect(onDelete).not.toHaveBeenCalled();
    expect(onUse).not.toHaveBeenCalled();
  });

  it('calls onDelete with the template id when the delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TemplateCard
        template={template}
        onEdit={onEdit}
        onDelete={onDelete}
        onUse={onUse}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'templates.card.delete' })
    );

    expect(onDelete).toHaveBeenCalledWith('tpl-1');
    expect(onEdit).not.toHaveBeenCalled();
    expect(onUse).not.toHaveBeenCalled();
  });

  it('calls onUse with the template id when the use-template button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TemplateCard
        template={template}
        onEdit={onEdit}
        onDelete={onDelete}
        onUse={onUse}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /templates\.card\.useTemplate/ })
    );

    expect(onUse).toHaveBeenCalledWith('tpl-1');
    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
