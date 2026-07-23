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

  it.each([
    { field: 'template name', expected: 'Software Engineer' },
    { field: 'reference number', expected: 'REF-100' },
    {
      field: 'formatted last-updated date',
      expected: 'templates.card.lastUpdated:formatted-2026-02-15',
    },
  ] as const)('renders the $field', ({ expected }) => {
    render(
      <TemplateCard
        template={template}
        onEdit={onEdit}
        onDelete={onDelete}
        onUse={onUse}
      />
    );

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    { action: 'onEdit', buttonName: 'templates.card.edit' },
    { action: 'onDelete', buttonName: 'templates.card.delete' },
    { action: 'onUse', buttonName: /templates\.card\.useTemplate/ },
  ] as const)(
    'calls $action with the template id when its button is clicked',
    async ({ action, buttonName }) => {
      const callbacks = { onEdit, onDelete, onUse };
      const user = userEvent.setup();
      render(
        <TemplateCard
          template={template}
          onEdit={onEdit}
          onDelete={onDelete}
          onUse={onUse}
        />
      );

      await user.click(screen.getByRole('button', { name: buttonName }));

      expect(callbacks[action]).toHaveBeenCalledWith('tpl-1');
      for (const [name, fn] of Object.entries(callbacks)) {
        if (name !== action) expect(fn).not.toHaveBeenCalled();
      }
    }
  );
});
