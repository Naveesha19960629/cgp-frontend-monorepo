import { Ranking } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@cgp/ui-kit/components/ui/tooltip';

const messageBoxAvatar = new URL(
  '../assets/images/message-box-avatar.svg',
  import.meta.url
).href;
const messageBoxBackground = new URL(
  '../assets/images/message-box-background.svg',
  import.meta.url
).href;

type MessageBoxProps = {
  fields: string[];
};

export default function MessageBox({ fields }: Readonly<MessageBoxProps>) {
  const { t } = useTranslation('ats');
  return (
    <div
      className="relative mx-6 mt-6 rounded-[12px] bg-[#E6EEEE] p-4"
      style={{ backgroundImage: `url(${messageBoxBackground})` }}
    >
      <div className="flex items-center gap-2">
        <Ranking size={24} className="text-brand-primary-500 shrink-0" />
        <p className="text-brand-primary-500 text-base font-bold">
          {t('preferredPatents.bannerTitle')}
        </p>
      </div>
      <p className="mt-2 mr-20 max-w-169 text-sm font-semibold whitespace-pre-line text-slate-700">
        <Tooltip>
          <TooltipTrigger className="cursor-pointer">
            <span className="text-brand-primary-500 font-bold">
              {t('preferredPatents.bannerCertainFields')}
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-700 p-3 [&>span:has([data-slot=tooltip-arrow])]:hidden">
            <ul className="list-inside list-disc">
              {fields.map(field => (
                <li key={field} className="text-sm font-semibold text-white">
                  {field}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
        {t('preferredPatents.bannerDescription')}
      </p>
      <img
        src={messageBoxAvatar}
        alt=""
        className="absolute right-6 bottom-0"
      />
    </div>
  );
}
