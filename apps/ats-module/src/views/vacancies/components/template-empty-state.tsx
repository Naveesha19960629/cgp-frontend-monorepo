import { useTranslation } from 'react-i18next';

const emptyStateAvatar = new URL(
  '../../../assets/images/table-empty-state-avatar.svg',
  import.meta.url
).href;

/** Empty state shown on the Templates page when no templates exist. */
export default function TemplateEmptyState() {
  const { t } = useTranslation('ats');

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="size-32.75 shrink-0 overflow-hidden rounded-full">
        <img src={emptyStateAvatar} alt="" className="size-full object-cover" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-bold tracking-[-0.1px] text-slate-900">
          {t('templates.emptyState.title')}
        </p>
        <p className="max-w-80 text-sm font-semibold text-[#334155]">
          {t('templates.emptyState.description')}
        </p>
      </div>
    </div>
  );
}
