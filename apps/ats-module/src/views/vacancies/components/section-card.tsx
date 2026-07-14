import type { ReactNode } from 'react';

/** Shared white card shell: title row (with optional trailing content) + body. */
export default function SectionCard({
  title,
  headerExtra,
  children,
}: {
  title: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#d4d4d4] bg-white px-5 py-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl leading-6 font-bold tracking-[-0.1px] text-slate-900">
          {title}
        </h3>
        {headerExtra}
      </div>
      {children}
    </section>
  );
}
