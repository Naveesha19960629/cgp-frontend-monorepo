import { ChevronRight } from 'lucide-react';

import { Edit2, Trash } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';

import type { VacancyTemplateSearchItem } from '@/views/vacancies/types';
import { formatDisplayDate } from '@/views/vacancies/utils/format-date-range';

interface TemplateCardProps {
  template: VacancyTemplateSearchItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUse: (id: string) => void;
}

/** A single vacancy-template card in the Templates grid. */
export default function TemplateCard({
  template,
  onEdit,
  onDelete,
  onUse,
}: Readonly<TemplateCardProps>) {
  const { t } = useTranslation('ats');

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#d4d4d4] bg-white">
      <div className="flex flex-1 flex-col px-4 pt-4 pb-5">
        <span className="w-fit rounded-lg border border-[#d4d4d4] bg-[#f5f5f5] px-3 py-1.5 text-sm font-semibold text-[#737373]">
          {t('templates.card.lastUpdated', {
            date: formatDisplayDate(template.updatedAt),
          })}
        </span>

        <h3 className="mt-4 truncate text-xl font-bold tracking-[-0.1px] text-slate-900">
          {template.templateName}
        </h3>
        <p className="mt-1 truncate text-base font-medium text-slate-600">
          {template.refNumber}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-[#d4d4d4] bg-[#f5f5f5] px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('templates.card.edit')}
            onClick={() => onEdit(template.vacancyTemplateId)}
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-slate-600 hover:bg-slate-50"
          >
            <Edit2 className="size-5" variant="Linear" />
          </button>
          <button
            type="button"
            aria-label={t('templates.card.delete')}
            onClick={() => onDelete(template.vacancyTemplateId)}
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-slate-600 hover:bg-slate-50"
          >
            <Trash className="size-5" variant="Linear" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onUse(template.vacancyTemplateId)}
          className="flex cursor-pointer items-center gap-1 text-base font-bold text-[#075056] hover:opacity-80"
        >
          {t('templates.card.useTemplate')}
          <ChevronRight className="size-4" />
        </button>
      </div>
    </article>
  );
}
