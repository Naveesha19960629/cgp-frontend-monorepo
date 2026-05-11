import clsx from 'clsx';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { applyTypography } from '@cgp/ui-kit/lib/typography';

export default function NotFoundPage() {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      void navigate('/', { replace: true });
    }
  };
  const title = t('notFoundPage.title');
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-white"
      style={{
        backgroundImage: 'url(/images/error_background.svg)',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="relative">
        <div>
          <div className="absolute top-6 left-6 z-0 h-30 w-30 animate-ping rounded-full bg-[linear-gradient(130deg,rgba(225,29,72,0.29)_-15.49%,#fff_185.6%)]"></div>
          <div className="h-41.5 w-41.5 rounded-full bg-[linear-gradient(130deg,rgba(225,29,72,0.29)_-15.49%,#fff_185.6%)]"></div>
        </div>
        <img
          src="/images/error-avatar.svg"
          alt="error avatar"
          className="absolute top-4 left-4 z-10 h-33.5 w-33.5 rounded-full"
        />
      </div>

      {/* Error title */}
      <div className="mt-5">
        <p className="text-[28px]/10 font-bold text-slate-900 sm:text-4xl">
          {title.slice(0, -1)}
          <span className="inline-flex items-center">
            {title.slice(-1)}
            <img
              src="/images/error-question-mark.svg"
              alt="error"
              className="ml-1 inline-block size-7 -translate-y-0 sm:ml-1 sm:size-8.5 sm:-translate-y-0"
            />
          </span>
        </p>
      </div>
      {/* Error message */}
      <p
        className={clsx(
          'mt-4 mb-7 max-w-[406px] text-center text-slate-600',
          applyTypography('body-semibold')
        )}
      >
        {t('notFoundPage.notFoundPageMessage')}
      </p>

      {/* Action button */}
      <Button
        onClick={handleGoBack}
        className="w-45 rounded-lg bg-rose-600 px-9 text-white transition-colors duration-200 hover:bg-rose-700"
      >
        {t('notFoundPage.goBackAndFixButton')}
      </Button>
    </div>
  );
}
