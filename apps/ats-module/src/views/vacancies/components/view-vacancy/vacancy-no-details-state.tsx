import { useTranslation } from 'react-i18next';

const successToastAvatar = new URL(
  '../../../../assets/images/success-toast-avatar.svg',
  import.meta.url
).href;

export function VacancyNoDetailsState() {
  const { t } = useTranslation('ats');

  return (
    <div
      className="relative -mx-4 -my-4 flex h-[252px] flex-col items-center justify-center gap-6 overflow-hidden rounded-[12px] px-4 py-6 text-center sm:flex-row sm:text-left"
      style={{
        background: `
          radial-gradient(circle at 30% 50%, rgba(243, 115, 46, 0.20) 0%, rgba(243, 115, 46, 0) 20%),
          radial-gradient(circle at 58% 50%, rgba(29, 166, 161, 0.16) 0%, rgba(29, 166, 161, 0) 40%),
          #ffffff
        `,
      }}
    >
      <div
        className="relative z-10 size-[131px] shrink-0 overflow-hidden rounded-full border border-[#E6EEEE]"
        style={{
          background:
            'linear-gradient(135deg, #ffffff 0%, rgba(236, 253, 245, 0.47) 100%)',
        }}
      >
        <img
          src={successToastAvatar}
          alt=""
          className="absolute top-4 left-17 h-[120%] max-w-none -translate-x-1/2 object-cover"
        />
      </div>
      <div className="relative z-10 flex max-w-[280px] flex-col gap-2">
        <h3 className="text-xl leading-6 font-bold tracking-[-0.1px] text-slate-900">
          {t('vacancies.view.noDetails.title')}
        </h3>
        <p className="w-[261px] text-sm leading-5 font-semibold text-slate-700">
          {t('vacancies.view.noDetails.description')}
        </p>
      </div>
    </div>
  );
}
