import { ChevronLeft } from 'lucide-react';

import type { ReactNode } from 'react';

import { Badge } from '@cgp/ui-kit/components/ui/badge';

function Root({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden px-7 py-5">
      {children}
    </section>
  );
}

function Header({
  title,
  status,
  actions,
}: {
  title: string;
  status?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-2xl/8 font-bold tracking-[-0.6px] text-slate-900">
          {title}
        </h1>
        {status}
      </div>
      {actions}
    </header>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-lg border border-[#e5e5e5] bg-[#f5f5f5] p-3">
      <h2 className="mb-3 text-[18px] leading-6 font-bold text-slate-900">
        {title}
      </h2>
      <article className="rounded-[12px] bg-white p-4">{children}</article>
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      {children}
    </div>
  );
}

function Tags({ values }: { values: string[] }) {
  if (!values.length) {
    return <p className="text-sm text-slate-500">-</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {values.map(value => (
        <Badge
          key={value}
          variant="chip"
          className="break-all whitespace-normal"
        >
          {value}
        </Badge>
      ))}
    </div>
  );
}

function Description({ value }: { value: string }) {
  if (!value) {
    return <p className="text-sm text-slate-500">-</p>;
  }

  return (
    <p className="text-sm leading-5 font-semibold whitespace-pre-wrap text-slate-500">
      {value}
    </p>
  );
}

function BackHeader({
  title,
  status,
  onBack,
}: {
  title: string;
  status?: ReactNode;
  onBack: () => void;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 cursor-pointer text-slate-600 transition-colors hover:text-slate-500"
          aria-label="Go back"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="truncate text-2xl/8 font-bold tracking-[-0.6px] text-slate-900">
          {title}
        </h1>
        {status}
      </div>
    </header>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | string[];
}) {
  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1 text-slate-600">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <span className="size-1.5 shrink-0 rounded-full bg-slate-600" />
      <span className="font-semibold text-slate-600">
        {displayValue || '-'}
      </span>
    </div>
  );
}

const VacancyView = {
  Root,
  Header,
  BackHeader,
  Body,
  Section,
  Grid,
  Field,
  Tags,
  Description,
  InfoRow,
};

export { VacancyView };
