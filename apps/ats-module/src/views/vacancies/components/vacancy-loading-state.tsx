import { useTranslation } from 'react-i18next';

const LOADING_AVATAR_URL = new URL(
  '../../../assets/images/loading-avatar.svg',
  import.meta.url
).href;

const LOADING_BG_URL = new URL(
  '../../../assets/images/loading-state-background.svg',
  import.meta.url
).href;

export default function VacancyLoadingState() {
  const { t } = useTranslation('ats');

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden">
      {/* Background glow — centered and slightly wider than container to match Figma */}
      <img
        src={LOADING_BG_URL}
        alt=""
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 w-[140%] -translate-x-1/2 -translate-y-1/2"
      />
      <div className="relative size-32.75 shrink-0 overflow-hidden rounded-full">
        <img
          src={LOADING_AVATAR_URL}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-4xl font-bold tracking-[-0.27px] text-slate-900">
          {t('notifications.loading.title')}
        </p>
        <p className="max-w-101 text-center text-lg/6 font-semibold text-slate-700">
          {t('notifications.loading.message')}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className="size-2 animate-bounce rounded-full bg-teal-800"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="size-2 animate-bounce rounded-full bg-amber-400"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="size-2 animate-bounce rounded-full bg-teal-800"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}
