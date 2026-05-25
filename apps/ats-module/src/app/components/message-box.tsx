import { Ranking } from 'iconsax-reactjs';

import type { ReactNode } from 'react';

import bgImage from '@/assets/message-box-background.png';

interface MessageBoxProps {
  title: string;
  message: ReactNode;
}

export default function MessageBox({
  title,
  message,
}: Readonly<MessageBoxProps>) {
  return (
    <div
      className="relative overflow-hidden rounded-xl bg-[#E6EEEE] p-4"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay',
      }}
    >
      <div className="flex items-center gap-2">
        <Ranking
          size="24"
          className="text-brand-primary-500"
          variant="Outline"
        />
        <p className="text-brand-primary-500 text-base font-semibold">
          {title}
        </p>
      </div>
      <p className="mt-2 w-[65%] text-sm font-semibold text-slate-700 sm:w-4/5">
        {message}
      </p>
      <img
        src="/success-toast-avatar.svg"
        alt=""
        className="absolute right-2 -bottom-4 w-20 sm:top-6 sm:right-6 sm:-mr-4 sm:-mb-4 sm:w-20"
      />
    </div>
  );
}
